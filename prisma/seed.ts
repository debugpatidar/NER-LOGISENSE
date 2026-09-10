import fs from 'fs'
import path from 'path'
import {
  PrismaClient,
  Role,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

// Ensure .env / .env.local is loaded if running ts-node directly
for (const envFile of ['.env.local', '.env']) {
  const envPath = path.resolve(process.cwd(), envFile)
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim()
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    }
  }
}

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding development database for NER-SHIELD...')

  const salt = await bcrypt.genSalt(12)

  const devUsers = [
    {
      email: 'field@ner-shield.local',
      name: 'Field Officer Dev',
      password: process.env.DEV_FIELD_PASSWORD || 'FieldOfficer123!',
      role: Role.FIELD_OFFICER,
    },
    {
      email: 'operator@ner-shield.local',
      name: 'Logistics Operator Dev',
      password: process.env.DEV_OPERATOR_PASSWORD || 'LogisticsOp123!',
      role: Role.LOGISTICS_OPERATOR,
    },
    {
      email: 'carrier@ner-shield.local',
      name: 'Carrier Driver Dev',
      password: process.env.DEV_CARRIER_PASSWORD || 'CarrierDriver123!',
      role: Role.CARRIER,
    },
  ]

  let fieldOfficerUser: { id: string; email: string } | null = null

  for (const u of devUsers) {
    const passwordHash = await bcrypt.hash(u.password, salt)
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        passwordHash,
        role: u.role,
      },
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        role: u.role,
      },
    })

    if (user.role === Role.FIELD_OFFICER) {
      fieldOfficerUser = user
    }

    console.log(`✅ [${user.role}] ${user.email} (Password: ${u.password})`)
  }

  if (!fieldOfficerUser) {
    throw new Error('Field Officer user could not be created.')
  }

  console.log('\n📍 Seeding deterministic Northeast field incidents...')

  const sampleIncidents = [
    {
      id: 'incident-ner-01',
      title: 'Major Landslide Blockage on NH-13 near Sela Pass',
      description:
        'Heavy debris flow and boulders completely blocked both carriageways between Sela Pass and Dirang. Heavy BRO excavators deployed for clearance. High clearance risk.',
      state: 'Arunachal Pradesh',
      locationName: 'NH-13 Sela Pass / Dirang Sector',
      latitude: 27.502,
      longitude: 92.103,
      category: IncidentCategory.LANDSLIDE,
      severity: IncidentSeverity.CRITICAL,
      status: IncidentStatus.ACTIVE,
      officerId: fieldOfficerUser.id,
    },
    {
      id: 'incident-ner-02',
      title: 'Severe Waterlogging & Silt Accumulation on NH-27 Khanapara',
      description:
        'Monsoon flash inundation on primary arterial connector. Single lane passable for heavy vehicles only. Water recession monitoring in progress.',
      state: 'Assam',
      locationName: 'NH-27 Khanapara / Beltola Junction',
      latitude: 26.1158,
      longitude: 91.8214,
      category: IncidentCategory.FLOODING,
      severity: IncidentSeverity.HIGH,
      status: IncidentStatus.INVESTIGATING,
      officerId: fieldOfficerUser.id,
    },
    {
      id: 'incident-ner-03',
      title: 'Subsidence & Structural Road Damage at Pagala Pahar',
      description:
        'Portion of downhill road shoulder eroded following torrential rainfall. Traffic regulated to alternate one-way movement with spotter support.',
      state: 'Nagaland',
      locationName: 'NH-29 Kohima–Dimapur Corridor',
      latitude: 25.7512,
      longitude: 93.8115,
      category: IncidentCategory.ROAD_DAMAGE,
      severity: IncidentSeverity.HIGH,
      status: IncidentStatus.ACTIVE,
      officerId: fieldOfficerUser.id,
    },
    {
      id: 'incident-ner-04',
      title: 'Dense Fog & Loose Rockfall Warning on Pynursla Ridge',
      description:
        'Thick mountain fog reducing visibility below 15 meters combined with loose rockfall warning on hillside curves. Commercial speed restricted to 20 km/h.',
      state: 'Meghalaya',
      locationName: 'NH-206 Shillong–Dawki Corridor',
      latitude: 25.308,
      longitude: 91.902,
      category: IncidentCategory.WEATHER_ALERT,
      severity: IncidentSeverity.MEDIUM,
      status: IncidentStatus.ACTIVE,
      officerId: fieldOfficerUser.id,
    },
    {
      id: 'incident-ner-05',
      title: 'Transit Delay at Tengnoupal Security Checkpoint',
      description:
        'Routine physical vehicle and cargo inspection causing 45-minute commercial cargo queue. Moving systematically; documents check active.',
      state: 'Manipur',
      locationName: 'NH-102 Imphal–Moreh Highway',
      latitude: 24.385,
      longitude: 94.15,
      category: IncidentCategory.CHECKPOINT_DELAY,
      severity: IncidentSeverity.LOW,
      status: IncidentStatus.ACTIVE,
      officerId: fieldOfficerUser.id,
    },
    {
      id: 'incident-ner-06',
      title: 'Culvert Abutment Instability at Hmuifang Sector',
      description:
        'Severe foundation scouring underneath concrete bridge culvert. Heavy 10-wheel transport barred; light vehicle diversion in place along ridge line.',
      state: 'Mizoram',
      locationName: 'Aizawl–Lunglei Highway',
      latitude: 23.453,
      longitude: 92.748,
      category: IncidentCategory.BRIDGE_HAZARD,
      severity: IncidentSeverity.CRITICAL,
      status: IncidentStatus.INVESTIGATING,
      officerId: fieldOfficerUser.id,
    },
    {
      id: 'incident-ner-07',
      title: 'Asphalt Creep & Pothole Cluster near Bishalgarh',
      description:
        'Emergency patch repairs completed by state PWD. Normal double-lane traffic flow restored with warning signs in place for ongoing shoulder leveling.',
      state: 'Tripura',
      locationName: 'NH-08 Agartala–Udaipur Road',
      latitude: 23.687,
      longitude: 91.312,
      category: IncidentCategory.ROAD_DAMAGE,
      severity: IncidentSeverity.LOW,
      status: IncidentStatus.RESOLVED,
      officerId: fieldOfficerUser.id,
    },
    {
      id: 'incident-ner-08',
      title: 'Snow Blizzard Clearance at Mile 13 JN Road',
      description:
        'Snow clearance completed by Border Roads Organisation. Surface treated with anti-skid grit and reopened to escorted convoy traffic.',
      state: 'Sikkim',
      locationName: 'JN Road Gangtok–Nathula Sector',
      latitude: 27.368,
      longitude: 88.712,
      category: IncidentCategory.WEATHER_ALERT,
      severity: IncidentSeverity.MEDIUM,
      status: IncidentStatus.RESOLVED,
      officerId: fieldOfficerUser.id,
    },
  ]

  for (const inc of sampleIncidents) {
    const record = await prisma.fieldIncident.upsert({
      where: { id: inc.id },
      update: {
        title: inc.title,
        description: inc.description,
        state: inc.state,
        locationName: inc.locationName,
        latitude: inc.latitude,
        longitude: inc.longitude,
        category: inc.category,
        severity: inc.severity,
        status: inc.status,
        officerId: inc.officerId,
      },
      create: inc,
    })
    console.log(
      `  • [${record.status}] ${record.severity} - ${record.title} (${record.state})`
    )
  }

  console.log(
    '\n⚠️ Development users and sample incidents ready. Safe to run repeatedly (idempotent).'
  )
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
