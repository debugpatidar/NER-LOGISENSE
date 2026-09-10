import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:3000'

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function login(email, password, role) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  })
  const data = await res.json()
  const rawCookie = res.headers.get('set-cookie') || ''
  const cookieMatch = rawCookie.match(/ner_session=([^;]+)/)
  const sessionCookie = cookieMatch ? `ner_session=${cookieMatch[1]}` : ''
  return { res, data, cookie: sessionCookie }
}

async function runTests() {
  console.log('🧪 Starting NER-SHIELD Field Officer Enhancement Verification...\n')

  // Wait for dev server readiness
  let serverReady = false
  for (let i = 0; i < 20; i++) {
    try {
      const ping = await fetch(`${BASE_URL}/api/auth/session`)
      if (ping.status === 200 || ping.status === 401) {
        serverReady = true
        break
      }
    } catch {
      await sleep(1000)
    }
  }

  if (!serverReady) {
    console.error('❌ Server failed to respond on http://localhost:3000 within 20s')
    process.exit(1)
  }
  console.log('✓ Dev server is online\n')

  let passed = 0
  let failed = 0

  function assert(cond, testName, details = '') {
    if (cond) {
      console.log(`  ✓ ${testName}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`)
      failed++
    }
  }

  // TEST SUITE 1: Auth & Role Boundaries
  console.log('--- TEST SUITE 1: Auth & Role Boundaries ---')
  const fieldAuth = await login('field@ner-shield.local', 'FieldOfficer123!', 'FIELD_OFFICER')
  assert(fieldAuth.data.success === true, 'Field Officer logs in successfully')
  assert(!!fieldAuth.cookie, 'Field Officer receives ner_session cookie')

  const carrierAuth = await login('carrier@ner-shield.local', 'CarrierDriver123!', 'CARRIER')
  assert(carrierAuth.data.success === true, 'Carrier logs in successfully')

  // Carrier attempting to access field reports API
  const carrierReportsRes = await fetch(`${BASE_URL}/api/field/reports`, {
    headers: { Cookie: carrierAuth.cookie },
  })
  assert(carrierReportsRes.status === 403, 'Carrier receives 403 on field reports API')

  // Unauthenticated access
  const unauthReportsRes = await fetch(`${BASE_URL}/api/field/reports`)
  assert(unauthReportsRes.status === 401, 'Unauthenticated user receives 401 on field reports API')

  // TEST SUITE 2: Live Location Telemetry in Incident Creation
  console.log('\n--- TEST SUITE 2: Incident Creation with Live GPS Telemetry ---')
  const timestamp = new Date().toISOString()
  const createIncidentRes = await fetch(`${BASE_URL}/api/field/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: fieldAuth.cookie,
    },
    body: JSON.stringify({
      title: 'TEST LANDSLIDE WITH LIVE GPS CONFIRMATION',
      description: 'Massive landslide blocking NH-13 Km 42. Captured with high precision device GPS.',
      state: 'Arunachal Pradesh',
      locationName: 'NH-13 Sela Pass Corridor Sector 4',
      latitude: 27.5023,
      longitude: 92.1045,
      locationAccuracy: 8.5,
      locationSource: 'GPS',
      locationCapturedAt: timestamp,
      category: 'LANDSLIDE',
      severity: 'CRITICAL',
    }),
  })

  const createIncidentData = await createIncidentRes.json()
  assert(createIncidentRes.status === 201, 'Report created successfully with 201 status')
  assert(createIncidentData.success === true, 'Response reports success: true')
  assert(!!createIncidentData.report?.id, 'Returned report has valid ID')
  assert(createIncidentData.report?.locationSource === 'GPS', 'Location source is GPS')
  assert(createIncidentData.report?.locationAccuracy === 8.5, 'Location accuracy is 8.5m')
  assert(createIncidentData.report?.latitude === 27.5023, 'Latitude matches accurately')
  assert(createIncidentData.report?.longitude === 92.1045, 'Longitude matches accurately')

  const testIncidentId = createIncidentData.report.id

  // TEST SUITE 3: Media Upload with Photo and Video
  console.log('\n--- TEST SUITE 3: Photo & Video Evidence Upload ---')

  // Create simulated PNG image buffer (minimal 1x1 valid PNG header)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ])

  // Simulated MP4 buffer (ftyp box header)
  const mp4Header = Buffer.from([
    0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
    0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
    0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31,
  ])

  const photoBlob = new Blob([pngHeader], { type: 'image/png' })
  const videoBlob = new Blob([mp4Header], { type: 'video/mp4' })

  const formData = new FormData()
  formData.append('files', photoBlob, 'evidence_debris_1.png')
  formData.append('files', videoBlob, 'drone_pass_1.mp4')

  const uploadMediaRes = await fetch(`${BASE_URL}/api/field/reports/${testIncidentId}/media`, {
    method: 'POST',
    headers: {
      Cookie: fieldAuth.cookie,
    },
    body: formData,
  })

  const uploadMediaData = await uploadMediaRes.json()
  assert(uploadMediaRes.status === 201, 'Media upload returns 201 Created')
  assert(uploadMediaData.success === true, 'Upload response success: true')
  assert(Array.isArray(uploadMediaData.media), 'Upload returns media array')
  assert(uploadMediaData.media.length === 2, '2 media items successfully uploaded')

  const photoItem = uploadMediaData.media.find((m) => m.type === 'PHOTO')
  const videoItem = uploadMediaData.media.find((m) => m.type === 'VIDEO')

  assert(!!photoItem, 'Photo item recorded in database')
  assert(photoItem?.filename === 'evidence_debris_1.png', 'Photo original filename preserved')
  assert(photoItem?.mimeType === 'image/png', 'Photo mimeType correctly stored')
  assert(photoItem?.url.startsWith('/uploads/incidents/'), 'Photo URL points to public uploads')

  assert(!!videoItem, 'Video item recorded in database')
  assert(videoItem?.filename === 'drone_pass_1.mp4', 'Video original filename preserved')
  assert(videoItem?.mimeType === 'video/mp4', 'Video mimeType correctly stored')

  // Verify file existence on disk
  const localPhotoPath = path.join(process.cwd(), 'public', photoItem.url)
  const localVideoPath = path.join(process.cwd(), 'public', videoItem.url)
  assert(fs.existsSync(localPhotoPath), 'Photo file exists physically on disk')
  assert(fs.existsSync(localVideoPath), 'Video file exists physically on disk')

  // TEST SUITE 4: Validation & Rejection
  console.log('\n--- TEST SUITE 4: Rejection of Invalid Media & Non-Existent Incidents ---')

  // Invalid file type
  const badFileBlob = new Blob([Buffer.from('malicious executable code')], { type: 'application/x-msdownload' })
  const badFormData = new FormData()
  badFormData.append('files', badFileBlob, 'malicious.exe')

  const badUploadRes = await fetch(`${BASE_URL}/api/field/reports/${testIncidentId}/media`, {
    method: 'POST',
    headers: { Cookie: fieldAuth.cookie },
    body: badFormData,
  })
  const badUploadData = await badUploadRes.json()
  assert(badUploadRes.status === 400, 'Rejects invalid file type with 400 status')
  assert(badUploadData.success === false, 'Bad file upload returns success: false')

  // Oversized photo (>10MB)
  const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024) // 11MB
  const oversizedBlob = new Blob([oversizedBuffer], { type: 'image/jpeg' })
  const oversizedFormData = new FormData()
  oversizedFormData.append('files', oversizedBlob, 'huge_photo.jpg')

  const oversizedRes = await fetch(`${BASE_URL}/api/field/reports/${testIncidentId}/media`, {
    method: 'POST',
    headers: { Cookie: fieldAuth.cookie },
    body: oversizedFormData,
  })
  const oversizedData = await oversizedRes.json()
  assert(oversizedRes.status === 400, 'Rejects photo exceeding 10MB limit with 400')
  assert(oversizedData.success === false, 'Oversized photo upload returns success: false')

  // Non-existent incident
  const nonExistentRes = await fetch(`${BASE_URL}/api/field/reports/non-existent-id-12345/media`, {
    method: 'POST',
    headers: { Cookie: fieldAuth.cookie },
    body: formData,
  })
  assert(nonExistentRes.status === 404, 'Returns 404 for non-existent incident')

  // Carrier attempting to upload media
  const carrierUploadRes = await fetch(`${BASE_URL}/api/field/reports/${testIncidentId}/media`, {
    method: 'POST',
    headers: { Cookie: carrierAuth.cookie },
    body: formData,
  })
  assert(carrierUploadRes.status === 403, 'Carrier cannot upload media (403 Forbidden)')

  // TEST SUITE 5: Incident Retrieval with Media & Telemetry
  console.log('\n--- TEST SUITE 5: Retrieve Incident with Attached Media & Telemetry ---')
  const getReportsRes = await fetch(`${BASE_URL}/api/field/reports`, {
    headers: { Cookie: fieldAuth.cookie },
  })
  const getReportsData = await getReportsRes.json()
  assert(getReportsRes.status === 200, 'GET /api/field/reports returns 200')
  assert(Array.isArray(getReportsData.reports), 'Returns reports array')

  const fetchedIncident = getReportsData.reports.find((r) => r.id === testIncidentId)
  assert(!!fetchedIncident, 'Created test incident found in feed')
  assert(fetchedIncident?.locationSource === 'GPS', 'Location source persisted as GPS')
  assert(fetchedIncident?.locationAccuracy === 8.5, 'Location accuracy persisted as 8.5m')
  assert(Array.isArray(fetchedIncident?.media), 'Media array is populated on incident')
  assert(fetchedIncident?.media?.length === 2, 'All 2 media files included in response')

  // Clean up
  console.log('\n--- CLEANUP ---')
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'incidents', testIncidentId)
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true })
      console.log('✓ Cleaned up test uploaded files on disk')
    }
  } catch (err) {
    console.warn('Cleanup warning:', err)
  }

  console.log(`\n========================================`)
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`)
  console.log(`========================================\n`)

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err)
  process.exit(1)
})
