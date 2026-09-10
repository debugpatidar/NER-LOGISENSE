export type UserRole = 'FIELD_OFFICER' | 'LOGISTICS_OPERATOR' | 'CARRIER'

export interface SafeUser {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export const ROLE_LABELS: Record<UserRole, string> = {
  FIELD_OFFICER: 'Field Officer',
  LOGISTICS_OPERATOR: 'Logistics Operator',
  CARRIER: 'Carrier / Driver',
}

export const ROLE_DASHBOARD_PATHS: Record<UserRole, string> = {
  FIELD_OFFICER: '/dashboard/field',
  LOGISTICS_OPERATOR: '/dashboard/operator',
  CARRIER: '/dashboard/carrier',
}
