/**
 * NER-SHIELD Field Officer — Service Worker
 *
 * Strategy:
 *   - Static assets (/_next/static/**):  Cache-first
 *   - App shell (/dashboard/field):       Network-first, fallback to cache
 *   - API routes (/api/**):               Network-only — never cache
 *   - Auth routes (login/logout/session): Network-only — never cache
 *   - All other routes:                   Network-first
 *
 * Auth session cookies are HTTP-only and managed entirely by the server.
 * This SW never reads, writes, or intercepts them.
 */

const CACHE_NAME = 'ner-shield-v1'
const STATIC_CACHE = 'ner-shield-static-v1'

// Assets to pre-cache on install
const APP_SHELL_URLS = [
  '/dashboard/field',
]

// ─────────────────────────────────────────────────────────────────────────────
// Install — cache app shell
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        // Pre-cache app shell pages
        await cache.addAll(APP_SHELL_URLS)
      } catch {
        // If pre-cache fails (e.g., redirected to /login because no session),
        // do not block install — the SW still installs successfully.
        console.log('[SW] Pre-cache skipped (auth redirect likely).')
      }
    })
  )
  // Take over immediately without waiting for old SW to die
  self.skipWaiting()
})

// ─────────────────────────────────────────────────────────────────────────────
// Activate — clean up old caches
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    )
  )
  self.clients.claim()
})

// ─────────────────────────────────────────────────────────────────────────────
// Fetch — route-based strategy
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // ── API routes: NETWORK-ONLY — never cache ────────────────────────────────
  if (url.pathname.startsWith('/api/')) {
    return // Let browser handle normally
  }

  // ── Auth pages: NETWORK-ONLY ──────────────────────────────────────────────
  if (url.pathname === '/login' || url.pathname === '/logout') {
    return
  }

  // ── Static Next.js assets: NETWORK-FIRST with cache fallback (ensures fresh UI updates instantly) ──
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image/') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // ── Field Officer dashboard: NETWORK-FIRST, cache fallback ────────────────
  if (url.pathname.startsWith('/dashboard/field')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(request)
          if (response.ok && response.status < 300) {
            // Update cache with fresh response
            cache.put(request, response.clone())
          }
          return response
        } catch {
          // Offline fallback: try cache
          const cached = await cache.match(request)
          if (cached) return cached
          // Nothing in cache — return offline page if exists
          const offline = await cache.match('/dashboard/field')
          if (offline) return offline
          // Last resort: let the browser show its offline error
          return new Response('Field Officer portal is offline. Please connect to the internet.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          })
        }
      })
    )
    return
  }

  // ── All other routes: NETWORK-FIRST ──────────────────────────────────────
  event.respondWith(fetch(request).catch(() => caches.match(request)))
})
