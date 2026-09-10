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

async function run() {
  console.log('====================================================')
  console.log('   NER-SHIELD AUTHENTICATION COMPREHENSIVE VERIFICATION')
  console.log('====================================================\n')

  // 1. UNAUTHENTICATED TESTS
  console.log('--- TEST GROUP 1: UNAUTHENTICATED ACCESS ---')
  const unauthSession = await request('/api/auth/session')
  assert(unauthSession.status === 200, 'GET /api/auth/session returns 200')
  assert(unauthSession.json?.authenticated === false, 'authenticated is false')
  assert(unauthSession.json?.user === null, 'user is null')

  const unauthField = await request('/dashboard/field')
  assert(
    unauthField.status === 307 || unauthField.status === 302,
    `GET /dashboard/field redirects unauthenticated user (status ${unauthField.status})`
  )
  assert(
    unauthField.location?.includes('/login'),
    `Redirect location is /login (${unauthField.location})`
  )

  const unauthOp = await request('/dashboard/operator')
  assert(
    unauthOp.status === 307 || unauthOp.status === 302,
    `GET /dashboard/operator redirects unauthenticated user (status ${unauthOp.status})`
  )
  assert(
    unauthOp.location?.includes('/login'),
    `Redirect location is /login (${unauthOp.location})`
  )

  const unauthCarrier = await request('/dashboard/carrier')
  assert(
    unauthCarrier.status === 307 || unauthCarrier.status === 302,
    `GET /dashboard/carrier redirects unauthenticated user (status ${unauthCarrier.status})`
  )
  assert(
    unauthCarrier.location?.includes('/login'),
    `Redirect location is /login (${unauthCarrier.location})`
  )

  // 2. ERROR HANDLING & SECURITY TESTS
  console.log('\n--- TEST GROUP 2: LOGIN ERROR CASES & SECURITY ---')
  // Missing fields
  const missingBody = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  assert(missingBody.status === 400, 'Empty payload returns 400')

  const missingEmail = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'Password123!', role: 'FIELD_OFFICER' }),
  })
  assert(missingEmail.status === 400, 'Missing email returns 400')

  const missingPassword = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'field@ner-shield.local', role: 'FIELD_OFFICER' }),
  })
  assert(missingPassword.status === 400, 'Missing password returns 400')

  const missingRole = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'field@ner-shield.local', password: 'FieldOfficer123!' }),
  })
  assert(missingRole.status === 400, 'Missing role returns 400')

  // Unknown email
  const unknownEmail = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'nonexistent@ner-shield.local',
      password: 'WrongPassword123!',
      role: 'FIELD_OFFICER',
    }),
  })
  assert(unknownEmail.status === 401, 'Unknown email returns 401')
  assert(
    unknownEmail.json?.message === 'Invalid email or password.',
    `Safe error message on unknown email: "${unknownEmail.json?.message}"`
  )

  // Wrong password for real user
  const wrongPass = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'field@ner-shield.local',
      password: 'TotallyWrongPassword!',
      role: 'FIELD_OFFICER',
    }),
  })
  assert(wrongPass.status === 401, 'Wrong password returns 401')
  assert(
    wrongPass.json?.message === 'Invalid email or password.',
    `Safe error message on wrong password matches unknown email: "${wrongPass.json?.message}"`
  )

  // Wrong selected role (FIELD_OFFICER user selecting LOGISTICS_OPERATOR)
  const wrongRoleField = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'field@ner-shield.local',
      password: 'FieldOfficer123!',
      role: 'LOGISTICS_OPERATOR',
    }),
  })
  assert(wrongRoleField.status === 403, 'Correct credentials with wrong role returns 403')
  assert(
    wrongRoleField.json?.message === 'This account is not registered for the selected role.',
    `Role mismatch error message: "${wrongRoleField.json?.message}"`
  )

  // 3. ROLE 1: FIELD OFFICER COMPLETE FLOW
  console.log('\n--- TEST GROUP 3: FIELD OFFICER LOGIN FLOW ---')
  const fieldLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'field@ner-shield.local',
      password: 'FieldOfficer123!',
      role: 'FIELD_OFFICER',
    }),
  })
  assert(fieldLogin.status === 200, 'Field Officer login returns 200')
  assert(fieldLogin.json?.success === true, 'success is true')
  assert(fieldLogin.json?.redirectTo === '/dashboard/field', 'redirectTo is /dashboard/field')
  assert(fieldLogin.json?.user?.role === 'FIELD_OFFICER', 'user.role is FIELD_OFFICER')
  assert(!('passwordHash' in (fieldLogin.json?.user || {})), 'passwordHash is NOT exposed')
  assert(!fieldLogin.text.includes('$2a$'), 'bcrypt hash not in response body')

  const fieldCookie = extractSessionCookie(fieldLogin.setCookie)
  assert(Boolean(fieldCookie), 'ner_session HTTP-only cookie was issued')
  assert(fieldLogin.setCookie?.includes('HttpOnly'), 'Cookie has HttpOnly flag')
  assert(fieldLogin.setCookie?.toLowerCase().includes('samesite=lax'), 'Cookie has SameSite=lax flag')

  const fieldAuthHeaders = { Cookie: `ner_session=${fieldCookie}` }

  // Session route check
  const fieldSession = await request('/api/auth/session', { headers: fieldAuthHeaders })
  assert(fieldSession.status === 200, 'Field Officer session check returns 200')
  assert(fieldSession.json?.authenticated === true, 'Session reports authenticated: true')
  assert(fieldSession.json?.user?.role === 'FIELD_OFFICER', 'Session user role is FIELD_OFFICER')
  assert(!('passwordHash' in (fieldSession.json?.user || {})), 'passwordHash NOT in session response')

  // Access authorized dashboard
  const fieldDash = await request('/dashboard/field', { headers: fieldAuthHeaders })
  assert(fieldDash.status === 200, 'Field Officer can access /dashboard/field (200 OK)')
  assert(fieldDash.text.includes('FIELD OPERATIONS'), 'Dashboard content contains FIELD OPERATIONS')

  // Access unauthorized dashboard (operator) -> should redirect to /dashboard/field
  const fieldToOp = await request('/dashboard/operator', { headers: fieldAuthHeaders })
  assert(
    fieldToOp.status === 307 || fieldToOp.status === 302,
    `Field Officer redirected when accessing /dashboard/operator (status ${fieldToOp.status})`
  )
  assert(
    fieldToOp.location === '/dashboard/field',
    `Redirected back to own dashboard: ${fieldToOp.location}`
  )

  // Access unauthorized dashboard (carrier) -> should redirect to /dashboard/field
  const fieldToCarrier = await request('/dashboard/carrier', { headers: fieldAuthHeaders })
  assert(
    fieldToCarrier.status === 307 || fieldToCarrier.status === 302,
    `Field Officer redirected when accessing /dashboard/carrier (status ${fieldToCarrier.status})`
  )
  assert(
    fieldToCarrier.location === '/dashboard/field',
    `Redirected back to own dashboard: ${fieldToCarrier.location}`
  )

  // 4. ROLE 2: LOGISTICS OPERATOR COMPLETE FLOW
  console.log('\n--- TEST GROUP 4: LOGISTICS OPERATOR LOGIN FLOW ---')
  const opLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'operator@ner-shield.local',
      password: 'LogisticsOp123!',
      role: 'LOGISTICS_OPERATOR',
    }),
  })
  assert(opLogin.status === 200, 'Logistics Operator login returns 200')
  assert(opLogin.json?.redirectTo === '/dashboard/operator', 'redirectTo is /dashboard/operator')
  assert(opLogin.json?.user?.role === 'LOGISTICS_OPERATOR', 'user.role is LOGISTICS_OPERATOR')

  const opCookie = extractSessionCookie(opLogin.setCookie)
  assert(Boolean(opCookie), 'Logistics Operator received ner_session cookie')
  const opAuthHeaders = { Cookie: `ner_session=${opCookie}` }

  // Access authorized dashboard
  const opDash = await request('/dashboard/operator', { headers: opAuthHeaders })
  assert(opDash.status === 200, 'Logistics Operator can access /dashboard/operator (200 OK)')
  assert(opDash.text.includes('LOGISTICS OPERATIONS'), 'Dashboard contains LOGISTICS OPERATIONS')

  // Access unauthorized dashboard (field) -> redirects to /dashboard/operator
  const opToField = await request('/dashboard/field', { headers: opAuthHeaders })
  assert(
    opToField.status === 307 || opToField.status === 302,
    `Logistics Operator redirected when accessing /dashboard/field (status ${opToField.status})`
  )
  assert(
    opToField.location === '/dashboard/operator',
    `Redirected to own dashboard: ${opToField.location}`
  )

  // 5. ROLE 3: CARRIER COMPLETE FLOW
  console.log('\n--- TEST GROUP 5: CARRIER / DRIVER LOGIN FLOW ---')
  const carrierLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'carrier@ner-shield.local',
      password: 'CarrierDriver123!',
      role: 'CARRIER',
    }),
  })
  assert(carrierLogin.status === 200, 'Carrier login returns 200')
  assert(carrierLogin.json?.redirectTo === '/dashboard/carrier', 'redirectTo is /dashboard/carrier')
  assert(carrierLogin.json?.user?.role === 'CARRIER', 'user.role is CARRIER')

  const carrierCookie = extractSessionCookie(carrierLogin.setCookie)
  assert(Boolean(carrierCookie), 'Carrier received ner_session cookie')
  const carrierAuthHeaders = { Cookie: `ner_session=${carrierCookie}` }

  // Access authorized dashboard
  const carrierDash = await request('/dashboard/carrier', { headers: carrierAuthHeaders })
  assert(carrierDash.status === 200, 'Carrier can access /dashboard/carrier (200 OK)')
  assert(carrierDash.text.includes('CARRIER OPERATIONS'), 'Dashboard contains CARRIER OPERATIONS')

  // Access unauthorized dashboard (field) -> redirects to /dashboard/carrier
  const carrierToField = await request('/dashboard/field', { headers: carrierAuthHeaders })
  assert(
    carrierToField.status === 307 || carrierToField.status === 302,
    `Carrier redirected when accessing /dashboard/field (status ${carrierToField.status})`
  )
  assert(
    carrierToField.location === '/dashboard/carrier',
    `Redirected to own dashboard: ${carrierToField.location}`
  )

  // 6. SESSION PERSISTENCE (PAGE REFRESH SIMULATION)
  console.log('\n--- TEST GROUP 6: SESSION PERSISTENCE ---')
  // Make 3 repeated requests with the same cookie
  const refresh1 = await request('/api/auth/session', { headers: carrierAuthHeaders })
  const refresh2 = await request('/dashboard/carrier', { headers: carrierAuthHeaders })
  const refresh3 = await request('/api/auth/session', { headers: carrierAuthHeaders })
  assert(refresh1.json?.authenticated === true, 'Session persists on request 1')
  assert(refresh2.status === 200, 'Session persists on request 2 (dashboard access)')
  assert(refresh3.json?.authenticated === true, 'Session persists on request 3')

  // 7. LOGOUT FLOW
  console.log('\n--- TEST GROUP 7: LOGOUT VERIFICATION ---')
  const logoutRes = await request('/api/auth/logout', {
    method: 'POST',
    headers: carrierAuthHeaders,
  })
  assert(logoutRes.status === 200, 'POST /api/auth/logout returns 200')
  assert(logoutRes.json?.success === true, 'logout success is true')
  assert(
    logoutRes.setCookie?.includes('ner_session=;') ||
      logoutRes.setCookie?.includes('Max-Age=0') ||
      logoutRes.setCookie?.includes('expires='),
    'Logout sets cookie expiration/clearing headers'
  )

  // Post-logout session check using cleared cookie or empty cookie
  const expiredCookieHeader = { Cookie: 'ner_session=' }
  const postLogoutSession = await request('/api/auth/session', { headers: expiredCookieHeader })
  assert(postLogoutSession.json?.authenticated === false, 'Post-logout session is unauthenticated')

  const postLogoutDash = await request('/dashboard/carrier', { headers: expiredCookieHeader })
  assert(
    postLogoutDash.status === 307 || postLogoutDash.status === 302,
    'Post-logout access to dashboard is blocked with redirect'
  )
  assert(
    postLogoutDash.location?.includes('/login'),
    'Redirects to /login after logout'
  )

  // 8. FORGED / INVALID TOKEN REJECTION
  console.log('\n--- TEST GROUP 8: TAMPERED / FORGED TOKEN REJECTION ---')
  const forgedHeaders = {
    Cookie: 'ner_session=eyJhbGciOiJIUzI1NiJ9.forged.invalid_signature',
  }
  const forgedSession = await request('/api/auth/session', { headers: forgedHeaders })
  assert(forgedSession.json?.authenticated === false, 'Forged token rejected by session API')

  const forgedDash = await request('/dashboard/field', { headers: forgedHeaders })
  assert(
    forgedDash.status === 307 || forgedDash.status === 302,
    'Forged token blocked from protected dashboard'
  )
  assert(
    forgedDash.location?.includes('/login'),
    'Forged token redirected to /login'
  )

  console.log('\n====================================================')
  console.log(`VERIFICATION SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`)
  console.log('====================================================')

  if (testsFailed > 0) {
    process.exit(1)
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
