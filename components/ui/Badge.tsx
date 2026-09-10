interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'red' | 'outline'
  className?: string
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB]',
    red: 'bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626]',
    outline: 'border border-[#E2E8F0] text-[#475569] bg-white',
  }

  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded text-[10px]
        font-mono uppercase tracking-widest
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
