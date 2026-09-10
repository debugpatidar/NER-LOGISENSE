import type { Metadata } from 'next'
import { Inter, Newsreader } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/theme/ThemeContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'NER / SHIELD — Logistics Intelligence Platform',
  description:
    "A unified logistics intelligence platform for India's North Eastern Region. Route monitoring, field reporting, and accessibility intelligence for NER operations.",
  keywords: ['NER', 'logistics', 'North East India', 'route intelligence', 'field operations'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${newsreader.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F8FAFC" />
      </head>
      <body className="bg-[#F8FAFC] text-[#172033] antialiased min-h-screen selection:bg-[#2563EB]/15 selection:text-[#172033]">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        {/* Service Worker registration & cache-invalidation */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                if ('caches' in window) {
                  caches.keys().then(function(keys) {
                    keys.forEach(function(k) { caches.delete(k); });
                  });
                }
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (var r of registrations) {
                      r.unregister();
                    }
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  )
}

