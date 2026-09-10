'use client'

import { useState } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { UserRole } from '@/types/user'

interface LoginFormProps {
  selectedRole: UserRole | null
  email: string
  setEmail: (email: string) => void
  password: string
  setPassword: (password: string) => void
}

export function LoginForm({
  selectedRole,
  email,
  setEmail,
  password,
  setPassword,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedRole) {
      setError('Please select your operational role to continue.')
      return
    }
    if (!email.trim()) {
      setError('Email is required.')
      return
    }
    if (!password) {
      setError('Password is required.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: selectedRole,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.message ?? 'Authentication failed.')
        setLoading(false)
        return
      }

      // Hard redirect to role dashboard to populate fresh server state and cookies
      window.location.replace(data.redirectTo)
    } catch {
      setError('A network or server error occurred. Please try again.')
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm text-[#172554] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] focus:bg-white transition-colors duration-200 shadow-sm'

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569] mb-2 font-medium"
        >
          EMAIL ADDRESS
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError(null)
          }}
          placeholder="officer@ner-shield.local"
          className={inputClass}
          disabled={loading}
        />
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block font-mono text-[10px] tracking-[0.15em] uppercase text-[#475569] mb-2 font-medium"
        >
          PASSWORD
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError(null)
            }}
            placeholder="••••••••••••"
            className={`${inputClass} pr-11`}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#172554] transition-colors p-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA]"
        >
          <AlertCircle size={15} className="text-[#DC2626] mt-0.5 shrink-0" />
          <p className="text-xs text-[#DC2626] leading-relaxed font-medium">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        variant="amber"
        size="lg"
        disabled={loading}
        className="w-full mt-2 font-sans"
      >
        {loading ? (
          <>
            <LoadingSpinner className="w-4 h-4" />
            <span>VERIFYING CREDENTIALS...</span>
          </>
        ) : (
          <span>SIGN IN TO OPERATIONS PORTAL</span>
        )}
      </Button>

      {!selectedRole && (
        <p className="text-center font-mono text-[9px] tracking-[0.15em] uppercase text-[#64748B] pt-1">
          SELECT YOUR OPERATIONAL ROLE ABOVE TO CONTINUE
        </p>
      )}
    </form>
  )
}
