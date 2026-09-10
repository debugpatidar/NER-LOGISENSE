import type { RouteSuggestion, RoutePoint, RiskLevel } from '@/types/routing'
import { fetchLiveWeather } from '@/lib/weather/service'

// Northeast India Major Hubs & Coordinates
export const NER_LOCATIONS: Record<string, RoutePoint & { name: string; state: string; isHillTerrain?: boolean }> = {
  guwahati: { name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362, isHillTerrain: false },
  shillong: { name: 'Shillong', state: 'Meghalaya', lat: 25.5788, lng: 91.8933, isHillTerrain: true },
  tawang: { name: 'Tawang', state: 'Arunachal Pradesh', lat: 27.5861, lng: 91.8594, isHillTerrain: true },
  itanagar: { name: 'Itanagar', state: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053, isHillTerrain: true },
  silchar: { name: 'Silchar', state: 'Assam', lat: 24.8333, lng: 92.7789, isHillTerrain: false },
  agartala: { name: 'Agartala', state: 'Tripura', lat: 23.8315, lng: 91.2868, isHillTerrain: false },
  imphal: { name: 'Imphal', state: 'Manipur', lat: 24.8170, lng: 93.9368, isHillTerrain: true },
  kohima: { name: 'Kohima', state: 'Nagaland', lat: 25.6751, lng: 94.1086, isHillTerrain: true },
  dimapur: { name: 'Dimapur', state: 'Nagaland', lat: 25.9068, lng: 93.7273, isHillTerrain: false },
  aizawl: { name: 'Aizawl', state: 'Mizoram', lat: 23.7271, lng: 92.7176, isHillTerrain: true },
  gangtok: { name: 'Gangtok', state: 'Sikkim', lat: 27.3389, lng: 88.6065, isHillTerrain: true },
  dibrugarh: { name: 'Dibrugarh', state: 'Assam', lat: 27.4728, lng: 94.9120, isHillTerrain: false },
  jorhat: { name: 'Jorhat', state: 'Assam', lat: 26.7509, lng: 94.2037, isHillTerrain: false },
  tezpur: { name: 'Tezpur', state: 'Assam', lat: 26.6338, lng: 92.7926, isHillTerrain: false },
  bongaigaon: { name: 'Bongaigaon', state: 'Assam', lat: 26.5028, lng: 90.5574, isHillTerrain: false },
  pasighat: { name: 'Pasighat', state: 'Arunachal Pradesh', lat: 28.0669, lng: 95.3268, isHillTerrain: true },
  kaziranga: { name: 'Kaziranga', state: 'Assam', lat: 26.5775, lng: 93.1711, isHillTerrain: false },
  nagaon: { name: 'Nagaon', state: 'Assam', lat: 26.3452, lng: 92.6840, isHillTerrain: false },
}

export const POPULAR_CORRIDORS = [
  { origin: 'Guwahati, Assam', destination: 'Shillong, Meghalaya', label: 'Guwahati ↔ Shillong' },
  { origin: 'Guwahati, Assam', destination: 'Tawang, Arunachal Pradesh', label: 'Guwahati ↔ Tawang' },
  { origin: 'Silchar, Assam', destination: 'Agartala, Tripura', label: 'Silchar ↔ Agartala' },
  { origin: 'Guwahati, Assam', destination: 'Itanagar, Arunachal Pradesh', label: 'Guwahati ↔ Itanagar' },
  { origin: 'Dimapur, Nagaland', destination: 'Kohima, Nagaland', label: 'Dimapur ↔ Kohima' },
  { origin: 'Guwahati, Assam', destination: 'Dibrugarh, Assam', label: 'Guwahati ↔ Dibrugarh' },
]

// Resolve location name to coordinates
export async function resolveLocation(query: string): Promise<RoutePoint & { name: string }> {
  const clean = query.trim().toLowerCase()

  // Match predefined hub dictionary
  for (const [key, loc] of Object.entries(NER_LOCATIONS)) {
    if (clean.includes(key) || clean.includes(loc.name.toLowerCase())) {
      return { lat: loc.lat, lng: loc.lng, name: `${loc.name}, ${loc.state}` }
    }
  }

  // Fallback to OpenStreetMap Nominatim geocoding for any custom text
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&limit=1`
    const res = await fetch(url, { headers: { 'User-Agent': 'NER-SHIELD-Logistics-Platform' } })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          name: data[0].display_name.split(',').slice(0, 2).join(','),
        }
      }
    }
  } catch {
    // Ignore network geocoding errors and fallback to Guwahati
  }

  return { lat: 26.1445, lng: 91.7362, name: query }
}

function formatDuration(minutes: number): string {
  const hrs = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hrs === 0) return `${mins}m`
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

// Fetch real road geometry from OSRM
async function fetchOsrmRoute(
  start: RoutePoint,
  end: RoutePoint,
  via?: RoutePoint
): Promise<{ coordinates: RoutePoint[]; distanceKm: number; durationMin: number } | null> {
  try {
    let coordsStr = `${start.lng},${start.lat};${end.lng},${end.lat}`
    if (via) {
      coordsStr = `${start.lng},${start.lat};${via.lng},${via.lat};${end.lng},${end.lat}`
    }

    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      const rawCoords: [number, number][] = route.geometry.coordinates
      const points: RoutePoint[] = rawCoords.map(([lng, lat]) => ({ lat, lng }))

      return {
        coordinates: points,
        distanceKm: Number((route.distance / 1000).toFixed(1)),
        durationMin: Math.round(route.duration / 60),
      }
    }
  } catch (err) {
    console.warn('[RoutingEngine] OSRM query failed:', err)
  }
  return null
}

// Generates route suggestions with real road geometry & risk analysis
export async function calculateRouteSuggestions(
  originStr: string,
  destinationStr: string,
  vehicleType: string,
  cargoType: string
): Promise<{ routes: RouteSuggestion[]; origin: RoutePoint & { name: string }; destination: RoutePoint & { name: string } }> {
  const origin = await resolveLocation(originStr)
  const destination = await resolveLocation(destinationStr)

  // Fetch live weather along the corridor
  const liveWeather = await fetchLiveWeather(destination.lat, destination.lng)

  // 1. Fetch Primary Route
  const primaryOsrm = await fetchOsrmRoute(origin, destination)

  let primaryGeometry: RoutePoint[] = []
  let primaryDistance = 120
  let primaryDurationMin = 180

  if (primaryOsrm && primaryOsrm.coordinates.length > 0) {
    primaryGeometry = primaryOsrm.coordinates
    primaryDistance = primaryOsrm.distanceKm
    primaryDurationMin = primaryOsrm.durationMin
  } else {
    // Generate fallback smooth road points between coordinates if offline
    primaryGeometry = generateInterpolatedPath(origin, destination)
  }

  // 2. Fetch Alternate Route (via an offset intermediate corridor)
  const midLat = (origin.lat + destination.lat) / 2 + (destination.lng > origin.lng ? 0.15 : -0.15)
  const midLng = (origin.lng + destination.lng) / 2 + 0.2
  const altVia: RoutePoint = { lat: midLat, lng: midLng }
  const altOsrm = await fetchOsrmRoute(origin, destination, altVia)

  let altGeometry: RoutePoint[] = []
  let altDistance = Math.round(primaryDistance * 1.15)
  let altDurationMin = Math.round(primaryDurationMin * 1.25)

  if (altOsrm && altOsrm.coordinates.length > 0) {
    altGeometry = altOsrm.coordinates
    altDistance = altOsrm.distanceKm
    altDurationMin = altOsrm.durationMin
  } else {
    altGeometry = generateInterpolatedPath(origin, destination, 0.2)
  }

  // 3. Compute Risk Profiles incorporating Live Weather
  const isHeavyVehicle = vehicleType === 'heavy_truck' || vehicleType === 'bus'
  const isSensitiveCargo = cargoType === 'medicine' || cargoType === 'emergency' || cargoType === 'food'

  const weatherRiskAdd = liveWeather.weatherRiskScore || 0

  // Route 1: Recommended Primary Route (Safe / Low Risk)
  const baseScore1 = isHeavyVehicle ? 14 : 10
  const totalScore1 = Math.min(95, baseScore1 + weatherRiskAdd)
  const riskLevel1: RiskLevel = totalScore1 > 60 ? 'HIGH' : totalScore1 > 30 ? 'MODERATE' : 'LOW'

  const route1Hazards = [
    `Live Weather: ${liveWeather.condition} (${liveWeather.temperature}°C, ${liveWeather.humidity}% humidity)`,
    liveWeather.advisory,
    'Normal freight traffic monitoring on National Highway',
  ]

  const route1: RouteSuggestion = {
    id: 'route-primary-safe',
    name: 'Primary National Highway Corridor',
    summary: `${origin.name.split(',')[0]} to ${destination.name.split(',')[0]} via National Highway (NH Corridor)`,
    distanceKm: primaryDistance,
    durationHours: Number((primaryDurationMin / 60).toFixed(1)),
    durationFormatted: formatDuration(primaryDurationMin),
    riskScore: totalScore1,
    riskLevel: riskLevel1,
    riskReason: liveWeather.isMonsoonAlert
      ? `Active monsoon weather (${liveWeather.precipitationMm}mm rain). Monitored highway corridor.`
      : 'All-weather paved highway with active monitoring and emergency road maintenance.',
    isRecommended: true,
    geometry: primaryGeometry,
    keyRoads: ['National Highway Corridor (NH)', 'Asian Highway Sector (AH-1/2)'],
    hazards: route1Hazards,
    advisories: [
      'Recommended for all commercial and emergency logistics',
      isSensitiveCargo ? 'Optimal temperature control stability on this corridor' : 'Lowest fuel gradient consumption',
      `Live Weather Alert: ${liveWeather.condition} · Wind ${liveWeather.windSpeedKmh} km/h`,
    ],
    vehicleSuitability: 'OPTIMAL',
    originCoord: origin,
    destinationCoord: destination,
    originName: origin.name,
    destinationName: destination.name,
    weather: liveWeather,
  }

  // Route 2: Alternate Route (Moderate Risk)
  const baseScore2 = isHeavyVehicle ? 40 : 32
  const totalScore2 = Math.min(95, baseScore2 + Math.round(weatherRiskAdd * 1.3))
  const riskLevel2: RiskLevel = totalScore2 > 65 ? 'HIGH' : 'MODERATE'

  const route2: RouteSuggestion = {
    id: 'route-alternate-moderate',
    name: 'State Highway / Valley Bypass',
    summary: `Secondary arterial connector via regional state bypass`,
    distanceKm: altDistance,
    durationHours: Number((altDurationMin / 60).toFixed(1)),
    durationFormatted: formatDuration(altDurationMin),
    riskScore: totalScore2,
    riskLevel: riskLevel2,
    riskReason: 'Secondary road surfaces with hill gradient and single-lane bottlenecks in river sectors.',
    isRecommended: false,
    geometry: altGeometry,
    keyRoads: ['State Highway Arterial (SH)', 'Inter-District Bypass Road'],
    hazards: [
      `Weather Impact: ${liveWeather.condition} (${liveWeather.precipitationMm}mm rain)`,
      'Moderate hill gradient and tight turning radius',
      'Reduced mobile network coverage in valley pass',
      'Periodic water accumulation during heavy rainfall',
    ],
    advisories: [
      'Passable for light vehicles and 2-axle trucks',
      'Exercise caution if driving after sunset or in rainy sectors',
    ],
    vehicleSuitability: isHeavyVehicle ? 'RESTRICTED' : 'PASSABLE',
    originCoord: origin,
    destinationCoord: destination,
    originName: origin.name,
    destinationName: destination.name,
    weather: liveWeather,
  }

  const routes: RouteSuggestion[] = [route1, route2]

  // If the destination is a high-altitude or border sector (e.g. Tawang, Kohima, Gangtok, Pasighat), add a 3rd Mountain Pass Route with HIGH RISK
  const isHighAltitude =
    destination.name.toLowerCase().includes('tawang') ||
    destination.name.toLowerCase().includes('kohima') ||
    destination.name.toLowerCase().includes('gangtok') ||
    primaryDistance > 300

  if (isHighAltitude) {
    const highRiskVia: RoutePoint = {
      lat: (origin.lat + destination.lat) / 2 + 0.35,
      lng: (origin.lng + destination.lng) / 2 - 0.25,
    }
    const highRiskOsrm = await fetchOsrmRoute(origin, destination, highRiskVia)
    const highRiskGeom = highRiskOsrm?.coordinates?.length
      ? highRiskOsrm.coordinates
      : generateInterpolatedPath(origin, destination, -0.3)

    const route3: RouteSuggestion = {
      id: 'route-mountain-highrisk',
      name: 'High Altitude Pass / Ridge Link',
      summary: 'Steep ridge mountain pass connector (High Elevation Sector)',
      distanceKm: Math.round(primaryDistance * 1.05),
      durationHours: Number(((primaryDurationMin * 1.4) / 60).toFixed(1)),
      durationFormatted: formatDuration(primaryDurationMin * 1.4),
      riskScore: 84,
      riskLevel: 'HIGH',
      riskReason: 'Extreme elevation gain, dense fog, active monsoon landslide zones and icy roads.',
      isRecommended: false,
      geometry: highRiskGeom,
      keyRoads: ['Border Roads Sector (BRO)', 'High Gradient Mountain Track'],
      hazards: [
        'Active landslide vulnerability in monsoon sector',
        'Dense fog reducing visibility below 20 meters',
        'Steep hair-pin turns and unpaved shoulder gravel',
      ],
      advisories: [
        'High clearance 4WD / heavy snow chains recommended',
        'Check Field Officer live verification before entering pass',
      ],
      vehicleSuitability: 'RESTRICTED',
      originCoord: origin,
      destinationCoord: destination,
      originName: origin.name,
      destinationName: destination.name,
    }
    routes.push(route3)
  }

  return {
    routes,
    origin,
    destination,
  }
}

// Fallback smooth curve generator if network API is completely unreachable
function generateInterpolatedPath(start: RoutePoint, end: RoutePoint, offset = 0): RoutePoint[] {
  const points: RoutePoint[] = []
  const steps = 60
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    // Linear interpolation
    const lat = start.lat + (end.lat - start.lat) * t
    const lng = start.lng + (end.lng - start.lng) * t
    // Add realistic curved arc
    const arc = Math.sin(t * Math.PI) * offset
    points.push({
      lat: lat + arc * 0.4,
      lng: lng + arc * 0.7,
    })
  }
  return points
}
