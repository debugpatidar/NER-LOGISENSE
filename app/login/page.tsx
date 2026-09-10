import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { ROLE_DASHBOARD_PATHS, type UserRole } from '@/types/user'
import { LoginContainer } from '@/components/login/LoginContainer'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LoginPage() {
  // If user is already authenticated, redirect straight to their role dashboard
  const session = await getSession()
  if (session?.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { role: true },
      })
      if (user) {
        const dest = ROLE_DASHBOARD_PATHS[user.role as UserRole] ?? '/'
        redirect(dest)
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'digest' in err) {
        throw err
      }
      // If db check fails, proceed to render login
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#172554] flex flex-col">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-100 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(23,37,84,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(23,37,84,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Blue ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#2563EB]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-5 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-xl">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#475569] hover:text-[#172554] transition-colors text-sm group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase font-semibold">BACK TO PLATFORM</span>
        </Link>
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#172554] font-bold">
          NER / LOGISENSE
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#64748B] hidden sm:block">
            OPERATIONS ACCESS · PHASE 01
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569] font-medium">
                AUTHORIZED PERSONNEL PORTAL
              </span>
            </div>
            <h1 className="font-editorial text-4xl sm:text-5xl font-normal tracking-tight text-[#172554] mb-2">
              Operations <span className="italic text-[#2563EB]">Login</span>
            </h1>
            <p className="text-[#475569] text-sm font-light">
              For authorized Field Officers and Logistics Operators only.
            </p>
          </div>

          {/* Interactive Login Container */}
          <LoginContainer />

          {/* Footer note */}
          <div className="mt-6 text-center font-mono text-[9px] tracking-[0.15em] uppercase text-[#64748B]">
            SECURE SESSION · ENCRYPTED JWT IN HTTP-ONLY COOKIE
          </div>
        </div>
      </div>
    </main>
  )
}
