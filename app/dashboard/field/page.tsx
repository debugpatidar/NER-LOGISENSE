import { requireRole } from '@/lib/auth/helpers'
import { FieldDashboardWorkspace } from '@/components/dashboard/field/FieldDashboardWorkspace'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FieldDashboardPage() {
  // Server-side role authorization: verifies session & database role strictly
  const user = await requireRole('FIELD_OFFICER')

  return (
    <FieldDashboardWorkspace
      initialUser={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
    />
  )
}
