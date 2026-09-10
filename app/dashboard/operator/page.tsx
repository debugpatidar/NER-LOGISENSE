import { requireRole } from '@/lib/auth/helpers'
import { LogisticsOperatorWorkspace } from '@/components/dashboard/operator/LogisticsOperatorWorkspace'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OperatorDashboardPage() {
  // Server-side role authorization: verifies session & database role
  const user = await requireRole('LOGISTICS_OPERATOR')

  return (
    <LogisticsOperatorWorkspace initialUser={user} />
  )
}

