export type IncidentCategory =
  | 'LANDSLIDE'
  | 'ROAD_DAMAGE'
  | 'FLOODING'
  | 'BRIDGE_HAZARD'
  | 'CHECKPOINT_DELAY'
  | 'WEATHER_ALERT'

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type IncidentStatus = 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED'

export const NER_STATES = [
  'Arunachal Pradesh',
  'Assam',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Sikkim',
  'Tripura',
] as const

export type NerState = (typeof NER_STATES)[number]

export interface IncidentOfficer {
  id: string
  name: string
  email: string
}

export type LocationSource = 'GPS' | 'MAP_MANUAL'

export type MediaType = 'PHOTO' | 'VIDEO'

export interface IncidentMediaItem {
  id: string
  incidentId: string
  type: MediaType
  url: string
  filename: string
  mimeType: string
  size: number
  createdAt: string
}

export interface FieldIncidentItem {
  id: string
  title: string
  description: string
  state: string
  locationName: string
  latitude: number
  longitude: number
  locationAccuracy?: number | null
  locationSource?: LocationSource
  locationCapturedAt?: string | null
  category: IncidentCategory
  severity: IncidentSeverity
  status: IncidentStatus
  officerId: string
  officer: IncidentOfficer
  media?: IncidentMediaItem[]
  createdAt: string
  updatedAt: string
}

export const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  LANDSLIDE: 'Landslide',
  ROAD_DAMAGE: 'Road Damage',
  FLOODING: 'Flooding / Inundation',
  BRIDGE_HAZARD: 'Bridge / Culvert Hazard',
  CHECKPOINT_DELAY: 'Checkpoint Delay',
  WEATHER_ALERT: 'Severe Weather Alert',
}

export const SEVERITY_COLORS: Record<IncidentSeverity, { bg: string; text: string; border: string; dot: string }> = {
  CRITICAL: {
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#DC2626]',
    border: 'border-[#FECACA]',
    dot: '#DC2626',
  },
  HIGH: {
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#D97706]',
    border: 'border-[#FDE68A]',
    dot: '#D97706',
  },
  MEDIUM: {
    bg: 'bg-[#EFF6FF]',
    text: 'text-[#2563EB]',
    border: 'border-[#BFDBFE]',
    dot: '#2563EB',
  },
  LOW: {
    bg: 'bg-[#ECFEFF]',
    text: 'text-[#0891B2]',
    border: 'border-[#A5F3FC]',
    dot: '#0891B2',
  },
}

export const STATUS_COLORS: Record<IncidentStatus, { bg: string; text: string; border: string }> = {
  ACTIVE: {
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#DC2626]',
    border: 'border-[#FECACA]',
  },
  INVESTIGATING: {
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#D97706]',
    border: 'border-[#FDE68A]',
  },
  RESOLVED: {
    bg: 'bg-[#ECFDF5]',
    text: 'text-[#059669]',
    border: 'border-[#A7F3D0]',
  },
}
