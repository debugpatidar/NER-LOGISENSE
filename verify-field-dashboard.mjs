const BASE_URL = 'http://localhost:3000'

let testsPassed = 0
let testsFailed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`)
    testsPassed++
  } else {
    console.error(`  ❌ FAIL: ${message}`)
    testsFailed++
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    redirect: 'manual',
    ...options,
  })

  let json = null
  const text = await res.text()
  try {
    json = JSON.parse(text)
  } catch {}

  const setCookie = res.headers.get('set-cookie')
  const location = res.headers.get('location')

  return {
    status: res.status,
    headers: res.headers,
    setCookie,
    location,
    text,
    json,
  }
}

function extractSessionCookie(setCookieHeader) {
  if (!setCookieHeader) return null
  const match = setCookieHeader.match(/ner_session=([^;]+)/)
  return match ? match[1] : null
}

async function loginUser(email, password, role) {
  const res = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  })
  const cookie = extractSessionCookie(res.setCookie)
  return { cookie, user: res.json?.user }
}

async function run() {
  console.log('================================================================')
  console.log('   FIELD OFFICER DASHBOARD COMPREHENSIVE E2E VERIFICATION')
  console.log('================================================================\n')

  // Step 0: Authenticate each role
  console.log('--- LOGGING IN USERS FOR ROLE VERIFICATION ---')
  const fieldAuth = await loginUser('field@ner-shield.local', 'FieldOfficer123!', 'FIELD_OFFICER')
  assert(Boolean(fieldAuth.cookie), 'Field Officer authenticated successfully')

  const opAuth = await loginUser('operator@ner-shield.local', 'LogisticsOp123!', 'LOGISTICS_OPERATOR')
  assert(Boolean(opAuth.cookie), 'Logistics Operator authenticated successfully')

  const carrierAuth = await loginUser('carrier@ner-shield.local', 'CarrierDriver123!', 'CARRIER')
  assert(Boolean(carrierAuth.cookie), 'Carrier Driver authenticated successfully')

  const fieldHeaders = { Cookie: `ner_session=${fieldAuth.cookie}` }
  const opHeaders = { Cookie: `ner_session=${opAuth.cookie}` }
  const carrierHeaders = { Cookie: `ner_session=${carrierAuth.cookie}` }

  // 1. ROUTE & AUTHORIZATION CHECKS FOR /dashboard/field
  console.log('\n--- TEST GROUP 1: ROUTE ACCESS & ROLE GUARDS (/dashboard/field) ---')
  const unauthField = await request('/dashboard/field')
  assert(
    unauthField.status === 307 || unauthField.status === 302,
    `Unauthenticated user redirected (status ${unauthField.status})`
  )
  assert(unauthField.location?.includes('/login'), 'Redirects unauthenticated user to /login')

  const opToField = await request('/dashboard/field', { headers: opHeaders })
  assert(
    opToField.status === 307 || opToField.status === 302,
    `Logistics Operator denied access (status ${opToField.status})`
  )
  assert(
    opToField.location === '/dashboard/operator',
    `Operator redirected to /dashboard/operator (${opToField.location})`
  )

  const carrierToField = await request('/dashboard/field', { headers: carrierHeaders })
  assert(
    carrierToField.status === 307 || carrierToField.status === 302,
    `Carrier denied access (status ${carrierToField.status})`
  )
  assert(
    carrierToField.location === '/dashboard/carrier',
    `Carrier redirected to /dashboard/carrier (${carrierToField.location})`
  )

  const fieldAccess = await request('/dashboard/field', { headers: fieldHeaders })
  assert(fieldAccess.status === 200, 'Field Officer granted access to /dashboard/field (200 OK)')
  assert(
    fieldAccess.text.includes('FIELD OPERATIONS'),
    'Page includes FIELD OPERATIONS branding'
  )
  assert(
    fieldAccess.text.includes('GROUND SURVEILLANCE'),
    'Page includes GROUND SURVEILLANCE workspace title'
  )

  // 2. GET /api/field/reports
  console.log('\n--- TEST GROUP 2: GET /api/field/reports ---')
  const unauthGetReports = await request('/api/field/reports')
  assert(unauthGetReports.status === 401, 'Unauthenticated GET /api/field/reports returns 401')

  const opGetReports = await request('/api/field/reports', { headers: opHeaders })
  assert(opGetReports.status === 403, 'Operator GET /api/field/reports returns 403')

  const carrierGetReports = await request('/api/field/reports', { headers: carrierHeaders })
  assert(carrierGetReports.status === 403, 'Carrier GET /api/field/reports returns 403')

  const fieldGetReports = await request('/api/field/reports', { headers: fieldHeaders })
  assert(fieldGetReports.status === 200, 'Field Officer GET /api/field/reports returns 200 OK')
  assert(fieldGetReports.json?.success === true, 'Returns success: true')
  assert(Array.isArray(fieldGetReports.json?.reports), 'Returns reports array')
  assert(fieldGetReports.json?.reports.length >= 8, `Returns all seeded reports (count: ${fieldGetReports.json?.reports.length})`)

  // Check structure of first report
  const sample = fieldGetReports.json?.reports[0]
  assert(Boolean(sample?.id), 'Report has id')
  assert(Boolean(sample?.title), 'Report has title')
  assert(Boolean(sample?.category), 'Report has category')
  assert(Boolean(sample?.severity), 'Report has severity')
  assert(Boolean(sample?.status), 'Report has status')
  assert(typeof sample?.latitude === 'number', 'Report has numeric latitude')
  assert(typeof sample?.longitude === 'number', 'Report has numeric longitude')
  assert(Boolean(sample?.officer?.name), `Report includes officer name (${sample?.officer?.name})`)
  assert(Boolean(sample?.officer?.email), `Report includes officer email (${sample?.officer?.email})`)

  // Filter by state=Assam
  const assamReports = await request('/api/field/reports?state=Assam', { headers: fieldHeaders })
  assert(assamReports.status === 200, 'GET /api/field/reports?state=Assam returns 200')
  const allAssam = assamReports.json?.reports.every((r) => r.state === 'Assam')
  assert(allAssam && assamReports.json?.reports.length > 0, 'All returned reports belong to Assam')

  // Filter by severity=CRITICAL
  const criticalReports = await request('/api/field/reports?severity=CRITICAL', { headers: fieldHeaders })
  assert(criticalReports.status === 200, 'GET /api/field/reports?severity=CRITICAL returns 200')
  const allCritical = criticalReports.json?.reports.every((r) => r.severity === 'CRITICAL')
  assert(allCritical && criticalReports.json?.reports.length > 0, 'All returned reports have CRITICAL severity')

  // Filter by status=ACTIVE
  const activeReports = await request('/api/field/reports?status=ACTIVE', { headers: fieldHeaders })
  assert(activeReports.status === 200, 'GET /api/field/reports?status=ACTIVE returns 200')
  const allActive = activeReports.json?.reports.every((r) => r.status === 'ACTIVE')
  assert(allActive && activeReports.json?.reports.length > 0, 'All returned reports have ACTIVE status')

  // 3. POST /api/field/reports
  console.log('\n--- TEST GROUP 3: POST /api/field/reports (INCIDENT SUBMISSION) ---')
  const unauthPost = await request('/api/field/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test' }),
  })
  assert(unauthPost.status === 401, 'Unauthenticated POST /api/field/reports returns 401')

  const opPost = await request('/api/field/reports', {
    method: 'POST',
    headers: { ...opHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test' }),
  })
  assert(opPost.status === 403, 'Operator POST /api/field/reports returns 403')

  // Validation failure: missing fields
  const invalidPost = await request('/api/field/reports', {
    method: 'POST',
    headers: { ...fieldHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Incomplete Report',
      // Missing description, state, locationName, latitude, longitude, category, severity
    }),
  })
  assert(invalidPost.status === 400, 'Validation failure returns 400 Bad Request')

  // Validation failure: coordinates outside NER bounding box
  const invalidCoordsPost = await request('/api/field/reports', {
    method: 'POST',
    headers: { ...fieldHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Out of bounds test',
      description: 'Coordinates in southern India or outside NER',
      state: 'Assam',
      locationName: 'Invalid Sector',
      latitude: 12.9716, // Bangalore latitude, invalid for NER
      longitude: 77.5946,
      category: 'LANDSLIDE',
      severity: 'HIGH',
    }),
  })
  assert(invalidCoordsPost.status === 400, 'Out-of-bounds coordinates rejected with 400')

  // Security test: Attempt to spoof officerId
  const newIncidentPayload = {
    title: 'E2E Verified Mudslide on NH-37 Jorhat Bypass',
    description:
      'Heavy soil slippage obstructed eastbound commercial freight lane. State PWD excavator clearing shoulder.',
    state: 'Assam',
    locationName: 'NH-37 Jorhat Bypass Corridor',
    latitude: 26.7509,
    longitude: 94.2037,
    category: 'LANDSLIDE',
    severity: 'HIGH',
    status: 'ACTIVE',
    officerId: 'spoofed_officer_id_should_be_ignored', // Spoof attempt
  }

  const createRes = await request('/api/field/reports', {
    method: 'POST',
    headers: { ...fieldHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(newIncidentPayload),
  })

  assert(createRes.status === 201, 'Valid Field Officer report created with 201 Created')
  assert(createRes.json?.success === true, 'Response contains success: true')
  const createdReport = createRes.json?.report
  assert(Boolean(createdReport?.id), `Created report assigned cuid: ${createdReport?.id}`)
  assert(
    createdReport?.officerId === fieldAuth.user?.id,
    `officerId strictly assigned to authenticated user (${createdReport?.officerId} == ${fieldAuth.user?.id})`
  )
  assert(
    createdReport?.officerId !== 'spoofed_officer_id_should_be_ignored',
    'Spoofed officerId was completely disregarded'
  )

  // 4. PATCH /api/field/reports/[id]
  console.log('\n--- TEST GROUP 4: PATCH /api/field/reports/[id] (STATUS UPDATE) ---')
  const incidentIdToUpdate = createdReport.id

  const unauthPatch = await request(`/api/field/reports/${incidentIdToUpdate}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'RESOLVED' }),
  })
  assert(unauthPatch.status === 401, 'Unauthenticated PATCH returns 401')

  const opPatch = await request(`/api/field/reports/${incidentIdToUpdate}`, {
    method: 'PATCH',
    headers: { ...opHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'RESOLVED' }),
  })
  assert(opPatch.status === 403, 'Operator PATCH returns 403')

  // Non-existent incident
  const notFoundPatch = await request('/api/field/reports/non-existent-incident-id', {
    method: 'PATCH',
    headers: { ...fieldHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'RESOLVED' }),
  })
  assert(notFoundPatch.status === 404, 'Non-existent incident returns 404')

  // Invalid status value
  const invalidStatusPatch = await request(`/api/field/reports/${incidentIdToUpdate}`, {
    method: 'PATCH',
    headers: { ...fieldHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'INVALID_STATUS_VALUE' }),
  })
  assert(invalidStatusPatch.status === 400, 'Invalid status value returns 400')

  // Valid status update to INVESTIGATING
  const patchInvestigating = await request(`/api/field/reports/${incidentIdToUpdate}`, {
    method: 'PATCH',
    headers: { ...fieldHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'INVESTIGATING' }),
  })
  assert(patchInvestigating.status === 200, 'Update to INVESTIGATING returns 200 OK')
  assert(
    patchInvestigating.json?.report?.status === 'INVESTIGATING',
    'Report status updated to INVESTIGATING'
  )

  // Valid status update to RESOLVED
  const patchResolved = await request(`/api/field/reports/${incidentIdToUpdate}`, {
    method: 'PATCH',
    headers: { ...fieldHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'RESOLVED' }),
  })
  assert(patchResolved.status === 200, 'Update to RESOLVED returns 200 OK')
  assert(patchResolved.json?.report?.status === 'RESOLVED', 'Report status updated to RESOLVED')

  // Confirm persistence via fresh GET
  const verifyGet = await request('/api/field/reports', { headers: fieldHeaders })
  const verifiedReport = verifyGet.json?.reports.find((r) => r.id === incidentIdToUpdate)
  assert(
    verifiedReport?.status === 'RESOLVED',
    `Database persistence confirmed: status is ${verifiedReport?.status}`
  )

  // 5. REGRESSION CHECK: ORIGINAL AUTH FLOW STILL WORKS
  console.log('\n--- TEST GROUP 5: AUTHENTICATION REGRESSION VERIFICATION ---')
  const logoutRes = await request('/api/auth/logout', {
    method: 'POST',
    headers: fieldHeaders,
  })
  assert(logoutRes.status === 200, 'POST /api/auth/logout succeeds (200)')

  const postLogoutAccess = await request('/dashboard/field', {
    headers: { Cookie: 'ner_session=' },
  })
  assert(
    postLogoutAccess.status === 307 || postLogoutAccess.status === 302,
    'Post-logout access to /dashboard/field is redirected'
  )

  console.log('\n================================================================')
  console.log(`VERIFICATION SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`)
  console.log('================================================================')

  if (testsFailed > 0) {
    process.exit(1)
  }
}

run().catch((err) => {
  console.error('Fatal test execution error:', err)
  process.exit(1)
})
