'use client'

import { useState } from 'react'
import { RoleSelector } from '@/components/login/RoleSelector'
import { LoginForm } from '@/components/login/LoginForm'
import type { UserRole } from '@/types/user'
import { KeyRound, ShieldAlert } from 'lucide-react'

const DEV_ACCOUNTS = [
  {
    role: 'FIELD_OFFICER' as UserRole,
    label: 'Field Officer',
    email: 'field@ner-shield.local',
    pass: 'FieldOfficer123!',
  },
  {
    role: 'LOGISTICS_OPERATOR' as UserRole,
    label: 'Logistics Operator',
    email: 'operator@ner-shield.local',
    pass: 'LogisticsOp123!',
  },
]

export function LoginContainer() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleDevFill = (acc: typeof DEV_ACCOUNTS[number]) => {
    setSelectedRole(acc.role)
    setEmail(acc.email)
    setPassword(acc.pass)
  }

  return (
    <div>
      {/* Login card */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Role selector section */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569] font-semibold">
            01 / SELECT OPERATIONAL ROLE
          </span>
          {selectedRole && (
            <span className="font-mono text-[9px] tracking-wider text-white bg-[#2563EB] px-2.5 py-0.5 rounded-full font-bold">
              {selectedRole}
            </span>
          )}
        </div>

        <RoleSelector selected={selectedRole} onSelect={setSelectedRole} />

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 border-t border-[#E2E8F0]" />
          <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#64748B]">
            02 / CREDENTIALS
          </div>
          <div className="flex-1 border-t border-[#E2E8F0]" />
        </div>

        {/* Credentials Form */}
        <LoginForm
          selectedRole={selectedRole}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
        />
      </div>

      {/* Development Quick-Fill Helpers */}
      <div className="mt-6 p-4 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-[#475569]">
          <KeyRound size={13} className="text-[#2563EB]" />
          <span className="font-mono text-[9px] tracking-[0.15em] uppercase font-semibold">
            DEVELOPMENT SEED ACCOUNTS
          </span>
        </div>
        <p className="text-[11px] text-[#64748B] mb-3">
          Click an account to pre-fill credentials for rapid verification:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DEV_ACCOUNTS.map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={() => handleDevFill(acc)}
              className="text-left px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#2563EB]/40 hover:bg-[#EFF6FF] transition-all text-xs"
            >
              <div className="font-mono text-[10px] text-[#2563EB] tracking-wide uppercase font-bold">
                {acc.label}
              </div>
              <div className="text-[10px] text-[#475569] truncate mt-0.5">{acc.email}</div>
            </button>
          ))}
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-[#64748B]">
          <ShieldAlert size={12} className="shrink-0 text-[#2563EB]" />
          <span>Role verification is enforced strictly on the database side upon login.</span>
        </div>
      </div>
    </div>
  )
}
