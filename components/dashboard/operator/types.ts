export type OfficerStatus = 'ON_PATROL' | 'INCIDENT_REPORTED' | 'STANDBY' | 'SURVEYING'

export type VehicleStatus = 'IN_TRANSIT' | 'ROUTE_WARNING' | 'ON_SCHEDULE' | 'DELAYED'

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface OfficerIncidentReport {
  id: string
  officerId: string
  officerName: string
  title: string
  category: 'LANDSLIDE' | 'ROAD_DAMAGE' | 'FLOODING' | 'BRIDGE_HAZARD' | 'CHECKPOINT_DELAY' | 'WEATHER_ALERT'
  severity: IncidentSeverity
  state: string
  locationName: string
  latitude: number
  longitude: number
  description: string
  timestamp: string
  affectsRoute?: string
  affectedVehicleId?: string
}

export interface FieldOfficerItem {
  id: string
  name: string
  badgeId: string
  locationName: string
  state: string
  latitude: number
  longitude: number
  status: OfficerStatus
  lastUpdate: string
  hasIncident: boolean
  report?: OfficerIncidentReport
}

export interface CargoVehicleItem {
  id: string
  driverName: string
  vehicleId: string // e.g. CG-03
  currentLat: number
  currentLng: number
  locationName: string
  origin: string
  destination: string
  routeString: string // e.g. "jabalpur --> katni"
  cargo: string
  status: VehicleStatus
  speedKmH: number
  routePath: { lat: number; lng: number }[]
  currentWaypointIndex: number
  interpolatedProgress: number
  routeColor?: string
  isAffected?: boolean
}

export interface RouteIncidentImpactAlert {
  id: string
  affectedDriver: string
  vehicleId: string
  affectedRoute: string
  shortIncidentDescription: string
  severity: IncidentSeverity
  reportingOfficer: string
  location: string
  timestamp: string
  status: 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED'
}
