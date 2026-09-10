import type { FieldOfficerItem, CargoVehicleItem, RouteIncidentImpactAlert } from './types'

// ── Map centre: central Northeast India ──────────────────────────────────────
export const JABALPUR_CENTER = { lat: 25.5, lng: 92.1 }

// ── Field Officers ────────────────────────────────────────────────────────────
export const INITIAL_FIELD_OFFICERS: FieldOfficerItem[] = [
  {
    id: 'off-01',
    name: 'Vikram Das',
    badgeId: 'FO-104',
    locationName: 'Guwahati Control Hub, Assam',
    state: 'Assam',
    latitude: 26.1445,
    longitude: 91.7362,
    status: 'ON_PATROL',
    lastUpdate: '2 mins ago',
    hasIncident: false,
  },
  {
    id: 'off-02',
    name: 'Ananya Sharma',
    badgeId: 'FO-208',
    locationName: 'Silchar, Assam — NH-6 Sector',
    state: 'Assam',
    latitude: 24.8333,
    longitude: 92.7789,
    status: 'INCIDENT_REPORTED',
    lastUpdate: '5 mins ago',
    hasIncident: true,
    report: {
      id: 'rep-208',
      officerId: 'off-02',
      officerName: 'Ananya Sharma',
      title: 'Road Blockage on NH-6 Near Silchar Approach',
      category: 'LANDSLIDE',
      severity: 'HIGH',
      state: 'Assam',
      locationName: 'NH-6 km 34, Silchar South Approach',
      latitude: 24.8333,
      longitude: 92.7789,
      description:
        'Earth slip and fallen debris blocking both transit lanes on NH-6 near Silchar. Clearance machinery dispatched by Assam Highway Patrol. Heavy freight halted pending clearance.',
      timestamp: 'Today, 14:28 IST',
      affectsRoute: 'guwahati --> silchar',
      affectedVehicleId: 'CG-03',
    },
  },
  {
    id: 'off-03',
    name: 'Rahul Gogoi',
    badgeId: 'FO-312',
    locationName: 'Shillong, Meghalaya — East Khasi Hills',
    state: 'Meghalaya',
    latitude: 25.5788,
    longitude: 91.8933,
    status: 'INCIDENT_REPORTED',
    lastUpdate: 'Just now',
    hasIncident: true,
    report: {
      id: 'rep-312',
      officerId: 'off-03',
      officerName: 'Rahul Gogoi',
      title: 'Bridge Structural Warning on Umiam Approach',
      category: 'BRIDGE_HAZARD',
      severity: 'MEDIUM',
      state: 'Meghalaya',
      locationName: 'Umiam Bridge, Shillong–Guwahati NH-6',
      latitude: 25.5788,
      longitude: 91.8933,
      description:
        'Structural cracks observed on the Umiam bridge deck. Load limit reduced to 16 T. Heavy cargo vehicles should use Nongpoh bypass until further inspection.',
      timestamp: 'Today, 14:40 IST',
    },
  },
  {
    id: 'off-04',
    name: 'Sunita Roy',
    badgeId: 'FO-405',
    locationName: 'Dimapur Freight Terminal, Nagaland',
    state: 'Nagaland',
    latitude: 25.9110,
    longitude: 93.7215,
    status: 'INCIDENT_REPORTED',
    lastUpdate: '8 mins ago',
    hasIncident: true,
    report: {
      id: 'rep-405',
      officerId: 'off-04',
      officerName: 'Sunita Roy',
      title: 'Flash Flooding on Dimapur–Kohima Link Road',
      category: 'FLOODING',
      severity: 'HIGH',
      state: 'Nagaland',
      locationName: 'NH-29 km 18, Dimapur South',
      latitude: 25.9110,
      longitude: 93.7215,
      description:
        'Storm-drain overflow flooded low-lying road section south of Dimapur. Freight transit permitted only with caution. Water level being monitored every 30 min.',
      timestamp: 'Today, 13:50 IST',
    },
  },
  {
    id: 'off-05',
    name: 'Tashi Norbu',
    badgeId: 'FO-519',
    locationName: 'Agartala Rail & Road Hub, Tripura',
    state: 'Tripura',
    latitude: 23.8315,
    longitude: 91.2868,
    status: 'STANDBY',
    lastUpdate: '12 mins ago',
    hasIncident: false,
  },
  {
    id: 'off-06',
    name: 'Lalit Teron',
    badgeId: 'FO-620',
    locationName: 'Aizawl Logistics Depot, Mizoram',
    state: 'Mizoram',
    latitude: 23.7271,
    longitude: 92.7176,
    status: 'SURVEYING',
    lastUpdate: '4 mins ago',
    hasIncident: false,
  },
]

// ── Cargo Vehicles ────────────────────────────────────────────────────────────
export const INITIAL_CARGO_VEHICLES: CargoVehicleItem[] = [
  {
    id: 'veh-01',
    driverName: 'Raj Sharma',
    vehicleId: 'AS-03',
    currentLat: 25.7474,
    currentLng: 93.1675,
    locationName: 'Lumding Junction Transit Sector',
    origin: 'Guwahati',
    destination: 'Silchar',
    routeString: 'guwahati --> silchar',
    cargo: 'Medical Supplies & Vaccines',
    status: 'ROUTE_WARNING',
    speedKmH: 44,
    currentWaypointIndex: 1,
    interpolatedProgress: 0.3,
    routeColor: '#DC2626',
    isAffected: true,
    routePath: [
      { lat: 26.1445, lng: 91.7362 }, // Guwahati
      { lat: 25.9835, lng: 92.3145 }, // Nagaon
      { lat: 25.7474, lng: 93.1675 }, // Lumding
      { lat: 25.1651, lng: 93.0151 }, // Haflong
      { lat: 24.8333, lng: 92.7789 }, // Silchar
    ],
  },
  {
    id: 'veh-02',
    driverName: 'Amit Verma',
    vehicleId: 'ML-07',
    currentLat: 25.9115,
    currentLng: 91.8698,
    locationName: 'Nongpoh–Jorabat Highway Corridor',
    origin: 'Shillong',
    destination: 'Guwahati',
    routeString: 'shillong --> guwahati',
    cargo: 'Electronics & Telecom Equipment',
    status: 'IN_TRANSIT',
    speedKmH: 56,
    currentWaypointIndex: 1,
    interpolatedProgress: 0.4,
    routeColor: '#2563EB',
    isAffected: false,
    routePath: [
      { lat: 25.5788, lng: 91.8933 }, // Shillong
      { lat: 25.9115, lng: 91.8698 }, // Nongpoh
      { lat: 26.1058, lng: 91.8021 }, // Jorabat
      { lat: 26.1445, lng: 91.7362 }, // Guwahati
    ],
  },
  {
    id: 'veh-03',
    driverName: 'Priya Singh',
    vehicleId: 'TR-12',
    currentLat: 24.5300,
    currentLng: 92.1600,
    locationName: 'Karimganj–Agartala Transit Sector',
    origin: 'Silchar',
    destination: 'Agartala',
    routeString: 'silchar --> agartala',
    cargo: 'Essential Food Grains & Rice Reserves',
    status: 'ON_SCHEDULE',
    speedKmH: 60,
    currentWaypointIndex: 1,
    interpolatedProgress: 0.5,
    routeColor: '#059669',
    isAffected: false,
    routePath: [
      { lat: 24.8333, lng: 92.7789 }, // Silchar
      { lat: 24.8648, lng: 92.3611 }, // Karimganj
      { lat: 24.2120, lng: 91.7380 }, // Belonia approach
      { lat: 23.8315, lng: 91.2868 }, // Agartala
    ],
  },
]

// ── Route Impact Alerts ───────────────────────────────────────────────────────
export const INITIAL_ROUTE_ALERTS: RouteIncidentImpactAlert[] = [
  {
    id: 'alert-01',
    affectedDriver: 'Raj Sharma',
    vehicleId: 'AS-03',
    affectedRoute: 'guwahati --> silchar',
    shortIncidentDescription: 'Road blockage reported on NH-6 near Silchar approach.',
    severity: 'HIGH',
    reportingOfficer: 'Ananya Sharma (FO-208)',
    location: 'NH-6 km 34, Silchar South Approach',
    timestamp: '14:28 IST',
    status: 'ACTIVE',
  },
]

/**
 * Utility function to smoothly advance vehicle coordinates along their route paths.
 */
export function advanceVehiclePositions(vehicles: CargoVehicleItem[]): CargoVehicleItem[] {
  return vehicles.map((v) => {
    const path = v.routePath
    if (!path || path.length < 2) return v

    let wpIndex = v.currentWaypointIndex
    let progress = v.interpolatedProgress + 0.04 // Smooth increment along route

    if (progress >= 1) {
      progress = 0
      wpIndex = (wpIndex + 1) % (path.length - 1)
    }

    const p1 = path[wpIndex]
    const p2 = path[(wpIndex + 1) % path.length]

    // Interpolate lat & lng
    const newLat = Number((p1.lat + (p2.lat - p1.lat) * progress).toFixed(4))
    const newLng = Number((p1.lng + (p2.lng - p1.lng) * progress).toFixed(4))

    return {
      ...v,
      currentLat: newLat,
      currentLng: newLng,
      currentWaypointIndex: wpIndex,
      interpolatedProgress: progress,
    }
  })
}
