import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  onClick?: () => void
}

export function Card({ children, className = '', glow = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white/95 backdrop-blur-md border border-[#E2E8F0]
        rounded-2xl transition-all duration-300 ease-out text-[#172554] shadow-sm
        ${glow ? 'border-[#2563EB]/40 shadow-[0_4px_25px_rgba(37,99,235,0.10)] bg-[#EFF6FF]/40' : ''}
        ${onClick ? 'cursor-pointer hover:border-[#2563EB]/50 hover:shadow-[0_4px_20px_rgba(37,99,235,0.08)] hover:scale-[1.005]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
