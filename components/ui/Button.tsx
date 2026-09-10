import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'amber'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium tracking-wide transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variants = {
    primary:
      'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] shadow-md shadow-[#2563EB]/25 font-bold',
    amber:
      'bg-gradient-to-r from-[#D97706] to-[#B45309] text-white hover:brightness-105 active:scale-[0.98] shadow-md shadow-[#D97706]/20 font-bold',
    secondary:
      'border border-[#E2E8F0] bg-white text-[#172554] hover:border-[#2563EB]/40 hover:bg-[#F8FAFC] active:scale-[0.98] shadow-sm',
    ghost:
      'bg-transparent text-[#475569] hover:text-[#172554] hover:bg-[#F1F5F9] active:scale-[0.98]',
  }

  const sizes = {
    sm: 'h-8 px-3.5 text-xs rounded-lg gap-1.5',
    md: 'h-10 px-5 text-sm rounded-xl gap-2',
    lg: 'h-12 px-7 text-sm rounded-xl gap-2',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
