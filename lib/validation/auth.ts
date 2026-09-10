import { z } from 'zod'

export const UserRoleSchema = z.enum([
  'FIELD_OFFICER',
  'LOGISTICS_OPERATOR',
  'CARRIER',
])

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
  password: z
    .string()
    .min(1, 'Password is required.'),
  role: UserRoleSchema,
})

export type LoginInput = z.infer<typeof LoginSchema>
