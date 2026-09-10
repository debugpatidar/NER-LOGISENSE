export interface RoutePoint {
  lat: number
  lng: number
}

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH'

export interface RouteSuggestion {
  id: string
  name: string
  summary: string
  distanceKm: number
  durationHours: number
  durationFormatted: string
  riskScore: number // 0 to 100
  riskLevel: RiskLevel
  riskReason: string
  isRecommended: boolean
  geometry: RoutePoint[] // Real road coordinate path
  keyRoads: string[]
  hazards: string[]
  advisories: string[]
  vehicleSuitability: 'OPTIMAL' | 'PASSABLE' | 'RESTRICTED'
  originCoord: RoutePoint
  destinationCoord: RoutePoint
  originName: string
  destinationName: string
  weather?: {
    temperature: number
    condition: string
    description: string
    precipitationMm: number
    windSpeedKmh: number
    humidity: number
    isMonsoonAlert: boolean
    isFoggy: boolean
    advisory: string
  }
}

export interface RouteQueryParams {
  origin: string
  destination: string
  vehicleType: string
  cargoType: string
}
