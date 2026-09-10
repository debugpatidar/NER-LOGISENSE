import type { UserRole } from './user'

export interface LoginRequest {
  email: string
  password: string
  role: UserRole
}

export interface LoginResponse {
  success: boolean
  message: string
  user?: {
    id: string
    name: string
    email: string
    role: UserRole
  }
  redirectTo?: string
}

export interface SessionPayload {
  userId: string
  role: UserRole
  iat: number
  exp: number
}

export interface ApiError {
  success: false
  message: string
}
