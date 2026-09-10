/**
 * NER-SHIELD Offline Sync — End-to-End API Verification
 *
 * Tests the server-side idempotency guarantee that underpins offline sync.
 * Simulates what lib/offline/sync.ts does when replaying a queued incident.
 *
 * Scenarios:
 *   1. Authenticated session established
 *   2. First submission with clientIncidentId → 201 Created
 *   3. Retry with same clientIncidentId → 200 OK (not 409, not 500)
 *   4. Retry returns SAME server incident ID
 *   5. Third retry → still 200 OK, still same ID
 *   6. Different clientIncidentId → creates NEW incident (201)
 *   7. No clientIncidentId → still works (online form path, 201)
 *   8. Service Worker and manifest checks
 *
 * Run: node verify-offline-sync.mjs
 */

import { randomUUID } from 'crypto'


const BASE = 'http://localhost:3000'

let passed = 0
let failed = 0
let sessionCookie = ''
const createdIds = []

function pass(msg) {
  console.log(`  ✓ ${msg}`)
  passed++
}

function fail(msg) {
  console.error(`  ✗ FAIL: ${msg}`)
  failed++
}

function assert(condition, msg) {
  if (condition) pass(msg)
  else fail(msg)
}

// ── Minimal JPEG Blob (no file system needed) ─────────────────────────────
const JPEG_BYTES = Buffer.from(
  [
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
  ],
  'binary'
)
const JPEG_BLOB = new Blob([JPEG_BYTES], { type: 'image/jpeg' })

// ── Helpers ──────────────────────────────────────────────────────────────────

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'field@ner-shield.local',
      password: 'FieldOfficer123!',
      role: 'FIELD_OFFICER',
    }),


  })
  const setCookie = res.headers.get('set-cookie') || ''
  const match = setCookie.match(/ner_session=[^;]+/)
  if (match) sessionCookie = match[0]
  return res.status
}

async function submitWithClientId(clientIncidentId, titleSuffix = '') {
  const form = new FormData()
  if (clientIncidentId) form.append('clientIncidentId', clientIncidentId)
  form.append('title', `Offline Sync Test ${titleSuffix || clientIncidentId?.slice(0, 8) || 'noId'}`)
  form.append('description', 'Test description for offline sync verification.')
  form.append('state', 'Assam')
  form.append('locationName', 'Guwahati Test Corridor')
  form.append('latitude', '26.1158')
  form.append('longitude', '91.8214')
  form.append('locationSource', 'GPS')
  form.append('locationCapturedAt', new Date().toISOString())
  form.append('category', 'LANDSLIDE')
  form.append('severity', 'HIGH')
  form.append('files', JPEG_BLOB, 'test-photo.jpg')

  const res = await fetch(`${BASE}/api/field/reports`, {
    method: 'POST',
    headers: { Cookie: sessionCookie },
    body: form,
  })

  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

function recordForCleanup(id) {
  if (id) createdIds.push(id)
}


// ── Test Runner ───────────────────────────────────────────────────────────────

console.log('====================================================================')
console.log('  NER-SHIELD OFFLINE SYNC — IDEMPOTENCY VERIFICATION')
console.log('====================================================================')
console.log()

// ── TEST 1: Login ────────────────────────────────────────────────────────────
console.log('--- TEST GROUP 1: AUTHENTICATION ---')
const loginStatus = await login()
assert(loginStatus === 200, `Field Officer login returns 200 (got ${loginStatus})`)
assert(sessionCookie !== '', 'ner_session cookie was set')
console.log()

// ── TEST 2: First submission with clientIncidentId ───────────────────────────
console.log('--- TEST GROUP 2: FIRST SUBMISSION WITH clientIncidentId ---')
const clientId1 = randomUUID()
const { status: s1, data: d1 } = await submitWithClientId(clientId1, 'First')
assert(s1 === 201, `First submission returns 201 (got ${s1})`)
assert(d1.success === true, 'success is true on first submission')
const serverId1 = d1.report?.id
assert(typeof serverId1 === 'string' && serverId1.length > 0, `Server incident ID was returned: ${serverId1}`)
recordForCleanup(serverId1)
console.log()

// ── TEST 3: Retry with same clientIncidentId ─────────────────────────────────
console.log('--- TEST GROUP 3: RETRY (IDEMPOTENT REPLAY) ---')
const { status: s2, data: d2 } = await submitWithClientId(clientId1, 'Retry')
assert(s2 === 200, `Retry returns 200 OK (not 201, not 409) — got ${s2}`)
assert(d2.success === true, 'success is true on retry')
const serverId2 = d2.report?.id
assert(serverId2 === serverId1, `Retry returns SAME server incident ID (${serverId1})`)
console.log()

// ── TEST 4: Third retry ───────────────────────────────────────────────────────
console.log('--- TEST GROUP 4: THIRD RETRY ---')
const { status: s3, data: d3 } = await submitWithClientId(clientId1, 'Third')
assert(s3 === 200, `Third retry still returns 200 (got ${s3})`)
assert(d3.report?.id === serverId1, `Third retry still returns same server ID`)
console.log()

// ── TEST 5: Different clientIncidentId creates new incident ──────────────────
console.log('--- TEST GROUP 5: DIFFERENT clientIncidentId = NEW INCIDENT ---')
const clientId2 = randomUUID()
const { status: s4, data: d4 } = await submitWithClientId(clientId2, 'Different')
assert(s4 === 201, `Different clientIncidentId returns 201 (got ${s4})`)
const serverId3 = d4.report?.id
assert(serverId3 !== serverId1, `Different clientIncidentId creates different server incident`)
recordForCleanup(serverId3)
console.log()

// ── TEST 6: No clientIncidentId — online form path ───────────────────────────
console.log('--- TEST GROUP 6: NO clientIncidentId (ONLINE FORM) ---')
const { status: s5, data: d5 } = await submitWithClientId(null, 'Online')
assert(s5 === 201, `Online (no clientIncidentId) submission returns 201 (got ${s5})`)
assert(d5.success === true, 'Online submission success is true')
recordForCleanup(d5.report?.id)
console.log()

// ── TEST 7: SW file exists ────────────────────────────────────────────────────
console.log('--- TEST GROUP 7: PWA / SERVICE WORKER ---')
const swRes = await fetch(`${BASE}/sw.js`)
assert(swRes.status === 200, `GET /sw.js returns 200 (got ${swRes.status})`)
const swContent = await swRes.text()
assert(swContent.includes('ner-shield-v1'), 'SW contains correct cache name')
assert(swContent.includes('/api/'), 'SW has API bypass rule')
assert(swContent.includes('/dashboard/field'), 'SW has Field Officer dashboard cache rule')

const manifestRes = await fetch(`${BASE}/manifest.json`)
assert(manifestRes.status === 200, `GET /manifest.json returns 200 (got ${manifestRes.status})`)
const manifest = await manifestRes.json()
assert(manifest.name === 'NER-SHIELD Field Officer Portal', 'Manifest has correct app name')
assert(manifest.start_url === '/dashboard/field', 'Manifest start_url is Field Officer dashboard')
assert(manifest.theme_color === '#00D9FF', 'Manifest theme color is NER-SHIELD cyan')
console.log()

// ── Cleanup note ──────────────────────────────────────────────────────────────
console.log('--- CREATED TEST INCIDENTS (for manual DB cleanup if needed) ---')
createdIds.filter(Boolean).forEach((id) => console.log(`  • ${id}`))
console.log()

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('====================================================================')
console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`)
console.log('====================================================================')
console.log()

if (failed > 0) process.exit(1)

