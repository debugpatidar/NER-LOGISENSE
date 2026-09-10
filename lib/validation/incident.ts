import { z } from 'zod'

export const IncidentCategorySchema = z.enum([
  'LANDSLIDE',
  'ROAD_DAMAGE',
  'FLOODING',
  'BRIDGE_HAZARD',
  'CHECKPOINT_DELAY',
  'WEATHER_ALERT',
])

export const IncidentSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

export const IncidentStatusSchema = z.enum(['ACTIVE', 'INVESTIGATING', 'RESOLVED'])

export const LocationSourceSchema = z.enum(['GPS', 'MAP_MANUAL'])

export const CreateIncidentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters.')
    .max(120, 'Title cannot exceed 120 characters.'),
  description: z
    .string()
    .trim()
    .min(5, 'Description must be at least 5 characters.')
    .max(1000, 'Description cannot exceed 1000 characters.'),
  state: z
    .string()
    .trim()
    .min(2, 'State is required.'),
  locationName: z
    .string()
    .trim()
    .min(3, 'Location or road corridor name is required.')
    .max(150, 'Location cannot exceed 150 characters.'),
  latitude: z
    .number({ message: 'Valid latitude is required.' })
    .min(-90.0, 'Latitude must be between -90 and 90.')
    .max(90.0, 'Latitude must be between -90 and 90.'),
  longitude: z
    .number({ message: 'Valid longitude is required.' })
    .min(-180.0, 'Longitude must be between -180 and 180.')
    .max(180.0, 'Longitude must be between -180 and 180.'),
  locationAccuracy: z.number().nullable().optional(),

  locationSource: LocationSourceSchema.optional().default('MAP_MANUAL'),
  locationCapturedAt: z.string().nullable().optional(),
  category: IncidentCategorySchema,
  severity: IncidentSeveritySchema,
  status: IncidentStatusSchema.optional().default('ACTIVE'),
})

export const UpdateIncidentStatusSchema = z.object({
  status: IncidentStatusSchema,
})

export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>
export type UpdateIncidentStatusInput = z.infer<typeof UpdateIncidentStatusSchema>
