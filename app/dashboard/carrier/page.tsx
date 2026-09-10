import { requireRole } from '@/lib/auth/helpers'
import { DashboardPlaceholder } from '@/components/dashboard/DashboardPlaceholder'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CarrierDashboardPage() {
  // Server-side role authorization: verifies session & database role
  const user = await requireRole('CARRIER')

  return (
    <DashboardPlaceholder
      role="CARRIER / DRIVER"
      title="CARRIER OPERATIONS"
      subtitle="Phase 2 dashboard under development."
      description="The carrier operations dashboard will provide route information, road conditions, and accessibility alerts to support drivers moving through the North Eastern Region."
      userName={user.name}
      userEmail={user.email}
    />
  )
}
