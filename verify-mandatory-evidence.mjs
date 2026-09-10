import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:3000'

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

async function run() {
  console.log('====================================================================')
  console.log('  NER-SHIELD MANDATORY EVIDENCE VERIFICATION SUITE')
  console.log('====================================================================\n')

  let passed = 0
  let failed = 0

  function assert(cond, msg) {
    if (cond) {
      console.log(`  ✓ ${msg}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${msg}`)
      failed++
    }
  }

  // 1. Authenticate as Field Officer
  const auth = await login('field@ner-shield.local', 'FieldOfficer123!', 'FIELD_OFFICER')
  assert(auth.data.success === true, 'Authenticated as Field Officer')

  // Prepare PNG and MP4 buffers
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ])
  const mp4Header = Buffer.from([
    0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
    0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
    0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31,
  ])

  // EDGE CASE 1 & 10: User calls API directly without evidence (Multipart with zero files)
  console.log('--- TEST GROUP 1: ZERO EVIDENCE REJECTION ---')
  const emptyFormData = new FormData()
  emptyFormData.append('title', 'Hazard With No Files Attached')
  emptyFormData.append('description', 'Attempting submission without any photo or video.')
  emptyFormData.append('state', 'Assam')
  emptyFormData.append('locationName', 'NH-27 Km 12')
  emptyFormData.append('latitude', '26.1158')
  emptyFormData.append('longitude', '91.8214')
  emptyFormData.append('category', 'LANDSLIDE')
  emptyFormData.append('severity', 'HIGH')

  const noFilesRes = await fetch(`${BASE_URL}/api/field/reports`, {
    method: 'POST',
    headers: { Cookie: auth.cookie },
    body: emptyFormData,
  })
  const noFilesData = await noFilesRes.json()
  assert(noFilesRes.status === 400, 'Zero-evidence multipart submission returns 400 Bad Request')
  assert(noFilesData.success === false, 'success is false on zero-evidence')
  assert(
    noFilesData.message === 'Photo or video evidence is required to submit an incident report.',
    `Exact error message returned: "${noFilesData.message}"`
  )

  // EDGE CASE 10 (JSON direct call without evidence)
  const jsonDirectRes = await fetch(`${BASE_URL}/api/field/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: auth.cookie },
    body: JSON.stringify({
      title: 'Direct JSON Bypass Attempt',
      description: 'Attempting direct API bypass without media files.',
      state: 'Assam',
      locationName: 'NH-27 Km 15',
      latitude: 26.1158,
      longitude: 91.8214,
      category: 'LANDSLIDE',
      severity: 'HIGH',
    }),
  })
  const jsonDirectData = await jsonDirectRes.json()
  assert(jsonDirectRes.status === 400, 'Direct JSON call without evidence returns 400 Bad Request')
  assert(
    jsonDirectData.message === 'Photo or video evidence is required to submit an incident report.',
    `Direct JSON rejected with: "${jsonDirectData.message}"`
  )

  // EDGE CASE 11: User sends a fake hasEvidence=true value
  console.log('\n--- TEST GROUP 2: UNTRUSTED CLIENT FLAGS ---')
  const fakeFlagRes = await fetch(`${BASE_URL}/api/field/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: auth.cookie },
    body: JSON.stringify({
      title: 'Fake hasEvidence Flag Attack',
      description: 'Sending fake boolean flag to trick server verification.',
      state: 'Assam',
      locationName: 'NH-27 Km 18',
      latitude: 26.1158,
      longitude: 91.8214,
      category: 'LANDSLIDE',
      severity: 'HIGH',
      hasEvidence: true,
      evidenceCount: 5,
    }),
  })
  const fakeFlagData = await fakeFlagRes.json()
  assert(fakeFlagRes.status === 400, 'Server disregards fake hasEvidence=true and returns 400')
  assert(
    fakeFlagData.message === 'Photo or video evidence is required to submit an incident report.',
    'Server rejects fake hasEvidence flag with mandatory evidence error'
  )

  // EDGE CASE 5: Invalid file type (.exe)
  console.log('\n--- TEST GROUP 3: FILE FORMAT VALIDATION ---')
  const badTypeForm = new FormData()
  badTypeForm.append('title', 'Invalid File Type Incident')
  badTypeForm.append('description', 'Attaching an executable file.')
  badTypeForm.append('state', 'Assam')
  badTypeForm.append('locationName', 'NH-27 Km 22')
  badTypeForm.append('latitude', '26.1158')
  badTypeForm.append('longitude', '91.8214')
  badTypeForm.append('category', 'ROAD_DAMAGE')
  badTypeForm.append('severity', 'MEDIUM')
  badTypeForm.append('files', new Blob([Buffer.from('malicious-payload')], { type: 'application/x-msdownload' }), 'virus.exe')

  const badTypeRes = await fetch(`${BASE_URL}/api/field/reports`, {
    method: 'POST',
    headers: { Cookie: auth.cookie },
    body: badTypeForm,
  })
  const badTypeData = await badTypeRes.json()
  assert(badTypeRes.status === 400, 'Invalid file type (.exe) returns 400 Bad Request')
  assert(badTypeData.message.includes('Unsupported file type'), `Error message explains format error: "${badTypeData.message}"`)

  // EDGE CASE 6: Oversized photo (>10MB)
  const oversizedPhotoForm = new FormData()
  oversizedPhotoForm.append('title', 'Oversized Photo Incident')
  oversizedPhotoForm.append('description', 'Attaching 11MB image file.')
  oversizedPhotoForm.append('state', 'Assam')
  oversizedPhotoForm.append('locationName', 'NH-27 Km 25')
  oversizedPhotoForm.append('latitude', '26.1158')
  oversizedPhotoForm.append('longitude', '91.8214')
  oversizedPhotoForm.append('category', 'ROAD_DAMAGE')
  oversizedPhotoForm.append('severity', 'MEDIUM')
  oversizedPhotoForm.append('files', new Blob([Buffer.alloc(11 * 1024 * 1024)], { type: 'image/jpeg' }), 'huge_photo.jpg')

  const oversizedRes = await fetch(`${BASE_URL}/api/field/reports`, {
    method: 'POST',
    headers: { Cookie: auth.cookie },
    body: oversizedPhotoForm,
  })
  const oversizedData = await oversizedRes.json()
  assert(oversizedRes.status === 400, 'Oversized photo (>10MB) returns 400 Bad Request')
  assert(oversizedData.message.includes('exceeds maximum allowed size'), `Error message explains size error: "${oversizedData.message}"`)

  // EDGE CASE 7: One valid photo
  console.log('\n--- TEST GROUP 4: VALID SUBMISSIONS WITH MANDATORY EVIDENCE ---')
  const singlePhotoForm = new FormData()
  singlePhotoForm.append('title', 'Valid Report With 1 Photo Evidence')
  singlePhotoForm.append('description', 'Single valid photo attached to report.')
  singlePhotoForm.append('state', 'Meghalaya')
  singlePhotoForm.append('locationName', 'Shillong Bypass Km 14')
  singlePhotoForm.append('latitude', '25.5788')
  singlePhotoForm.append('longitude', '91.8933')
  singlePhotoForm.append('locationAccuracy', '9.2')
  singlePhotoForm.append('locationSource', 'GPS')
  singlePhotoForm.append('category', 'LANDSLIDE')
  singlePhotoForm.append('severity', 'HIGH')
  singlePhotoForm.append('files', new Blob([pngHeader], { type: 'image/png' }), 'rockfall_evidence.png')

  const singlePhotoRes = await fetch(`${BASE_URL}/api/field/reports`, {
    method: 'POST',
    headers: { Cookie: auth.cookie },
    body: singlePhotoForm,
  })
  const singlePhotoData = await singlePhotoRes.json()
  assert(singlePhotoRes.status === 201, 'Single valid photo submission returns 201 Created')
  assert(singlePhotoData.success === true, 'success is true')
  assert(singlePhotoData.report?.media?.length === 1, 'Report has exactly 1 media record in database')
  assert(singlePhotoData.report?.media[0].type === 'PHOTO', 'Media type is PHOTO')

  const singlePhotoId = singlePhotoData.report?.id

  // EDGE CASE 8: One valid video
  const singleVideoForm = new FormData()
  singleVideoForm.append('title', 'Valid Report With 1 Video Evidence')
  singleVideoForm.append('description', 'Single valid video attached to report.')
  singleVideoForm.append('state', 'Sikkim')
  singleVideoForm.append('locationName', 'NH-10 Rangpo Pass')
  singleVideoForm.append('latitude', '27.1767')
  singleVideoForm.append('longitude', '88.5334')
  singleVideoForm.append('locationAccuracy', '5.5')
  singleVideoForm.append('locationSource', 'GPS')
  singleVideoForm.append('category', 'FLOODING')
  singleVideoForm.append('severity', 'CRITICAL')
  singleVideoForm.append('files', new Blob([mp4Header], { type: 'video/mp4' }), 'flood_surge.mp4')

  const singleVideoRes = await fetch(`${BASE_URL}/api/field/reports`, {
    method: 'POST',
    headers: { Cookie: auth.cookie },
    body: singleVideoForm,
  })
  const singleVideoData = await singleVideoRes.json()
  assert(singleVideoRes.status === 201, 'Single valid video submission returns 201 Created')
  assert(singleVideoData.report?.media?.length === 1, 'Report has exactly 1 media record in database')
  assert(singleVideoData.report?.media[0].type === 'VIDEO', 'Media type is VIDEO')

  const singleVideoId = singleVideoData.report?.id

  // EDGE CASE 9: Multiple valid photos and videos
  const multiMediaForm = new FormData()
  multiMediaForm.append('title', 'Multi-Evidence Complex Hazard')
  multiMediaForm.append('description', 'Contains 2 photos and 1 video in single atomic submission.')
  multiMediaForm.append('state', 'Nagaland')
  multiMediaForm.append('locationName', 'NH-29 Kohima Bypass')
  multiMediaForm.append('latitude', '25.6751')
  multiMediaForm.append('longitude', '94.1086')
  multiMediaForm.append('locationAccuracy', '8.0')
  multiMediaForm.append('locationSource', 'GPS')
  multiMediaForm.append('category', 'ROAD_DAMAGE')
  multiMediaForm.append('severity', 'HIGH')
  multiMediaForm.append('files', new Blob([pngHeader], { type: 'image/png' }), 'photo_1.png')
  multiMediaForm.append('files', new Blob([pngHeader], { type: 'image/png' }), 'photo_2.png')
  multiMediaForm.append('files', new Blob([mp4Header], { type: 'video/mp4' }), 'video_1.mp4')

  const multiMediaRes = await fetch(`${BASE_URL}/api/field/reports`, {
    method: 'POST',
    headers: { Cookie: auth.cookie },
    body: multiMediaForm,
  })
  const multiMediaData = await multiMediaRes.json()
  assert(multiMediaRes.status === 201, 'Multi-evidence submission returns 201 Created')
  assert(multiMediaData.report?.media?.length === 3, 'Report has all 3 media records in database')
  assert(
    multiMediaData.message === 'Incident data submitted to Logistics Operator Center.',
    `Confirmation message returned: "${multiMediaData.message}"`
  )

  const multiIncidentId = multiMediaData.report?.id

  // EDGE CASE 12: Duplicate submission prevention
  console.log('\n--- TEST GROUP 5: DUPLICATE PREVENTION ---')
  const duplicateRes = await fetch(`${BASE_URL}/api/field/reports`, {
    method: 'POST',
    headers: { Cookie: auth.cookie },
    body: multiMediaForm,
  })
  const duplicateData = await duplicateRes.json()
  assert(duplicateRes.status === 409, 'Immediate duplicate submission returns 409 Conflict')
  assert(duplicateData.success === false, 'Duplicate is blocked')
  assert(duplicateData.message.includes('Duplicate incident report detected'), `Duplicate message: "${duplicateData.message}"`)

  // TEST GROUP 6: Frontend UI Verification
  console.log('\n--- TEST GROUP 6: FRONTEND UI VERIFICATION ---')
  const dashRes = await fetch(`${BASE_URL}/dashboard/field`, {
    headers: { Cookie: auth.cookie },
  })
  const dashHtml = await dashRes.text()
  assert(dashHtml.includes('EVIDENCE *'), 'UI contains required marker: "EVIDENCE *"')
  assert(dashHtml.includes('REQUIRED (MIN 1 FILE)'), 'UI contains badge: "REQUIRED (MIN 1 FILE)"')
  assert(
    dashHtml.includes('Photo or video evidence is required to submit an incident report.'),
    'UI renders validation requirement: "Photo or video evidence is required to submit an incident report."'
  )
  assert(dashHtml.includes('TRANSMIT TO OPERATOR CENTER'), 'UI contains submit action button')

  // Clean up test upload files
  console.log('\n--- CLEANUP ---')
  for (const id of [singlePhotoId, singleVideoId, multiIncidentId]) {
    if (!id) continue
    try {
      const dir = path.join(process.cwd(), 'public', 'uploads', 'incidents', id)
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true })
      }
    } catch {}
  }
  console.log('✓ Test files cleaned up')

  console.log('\n====================================================================')
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('====================================================================\n')

  if (failed > 0) process.exit(1)
}

run().catch((err) => {
  console.error('Test execution error:', err)
  process.exit(1)
})
