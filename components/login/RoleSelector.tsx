'use client'

import { Shield, BarChart3, Check } from 'lucide-react'
import type { UserRole } from '@/types/user'

interface Role {
  id: UserRole
  label: string
  subtitle: string
  icon: React.ComponentType<{ size?: number }>
}

const ROLES: Role[] = [
  {
    id: 'FIELD_OFFICER',
    label: 'FIELD OFFICER',
    subtitle: 'Ground-level reporting & live GPS incident verification',
    icon: Shield,
  },
  {
    id: 'LOGISTICS_OPERATOR',
    label: 'LOGISTICS OPERATOR',
    subtitle: 'Central command & regional corridor traffic monitoring',
    icon: BarChart3,
  },
]

interface RoleSelectorProps {
  selected: UserRole | null
  onSelect: (role: UserRole) => void
}

export function RoleSelector({ selected, onSelect }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {ROLES.map(({ id, label, subtitle, icon: Icon }) => {
        const isActive = selected === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`
              relative text-left p-4 rounded-2xl border transition-all duration-200 ease-out
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:ring-offset-white
              ${
                isActive
                  ? 'border-[#2563EB] bg-[#EFF6FF] shadow-sm'
                  : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#2563EB]/40 hover:bg-[#EFF6FF]/50'
              }
            `}
            aria-pressed={isActive}
          >
            {/* Active indicator */}
            {isActive && (
              <div className="absolute top-3.5 right-3.5 w-4 h-4 rounded-full bg-[#2563EB] flex items-center justify-center">
                <Check size={10} className="text-white stroke-[3]" />
              </div>
            )}

            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                isActive ? 'bg-[#2563EB] text-white' : 'bg-white border border-[#E2E8F0] text-[#2563EB]'
              }`}
            >
              <Icon size={18} />
            </div>

            <div
              className={`font-mono text-[10px] tracking-[0.15em] uppercase font-bold mb-1 transition-colors ${
                isActive ? 'text-[#172554]' : 'text-[#475569]'
              }`}
            >
              {label}
            </div>
            <div className="text-[11px] text-[#64748B] leading-snug">{subtitle}</div>
          </button>
        )
      })}
    </div>
  )
}
