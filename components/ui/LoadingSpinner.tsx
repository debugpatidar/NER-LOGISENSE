export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-block w-5 h-5 border-2 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin ${className}`}
      aria-label="Loading"
    />
  )
}
