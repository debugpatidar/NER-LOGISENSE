'use client'

import { useEffect, useRef, useState } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { useTheme } from '@/lib/theme/ThemeContext'

interface NorthEastMapProps {
  className?: string
}

const NER_CENTER = { lat: 25.5, lng: 93.5 }
const NER_ZOOM = 6

// Clean, modern light map style matching #F8FAFC / #2563EB theme
export const LIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#F8FAFC' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }, { weight: 3 }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#CBD5E1' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#94A3B8' }, { weight: 1.5 }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#CBD5E1' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#F1F5F9' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#E2E8F0' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748B' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#DCFCE7' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#15803D' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#FFFFFF' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#E2E8F0' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#DBEAFE' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#93C5FD' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#1E40AF' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#F1F5F9' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#BAE6FD' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0369A1' }],
  },
]

// DARK_MAP_STYLE removed — light mode only
export const DARK_MAP_STYLE = LIGHT_MAP_STYLE
export const BRONZE_DARK_MAP_STYLE = LIGHT_MAP_STYLE

type MapStatus = 'loading' | 'loaded' | 'error' | 'no-key'

export function NorthEastMap({ className = '' }: NorthEastMapProps) {
  const { theme } = useTheme()
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  const [status, setStatus] = useState<MapStatus>('loading')

  // Theme is always light — no dynamic style update needed

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY' || apiKey.trim() === '') {
      setStatus('no-key')
      return
    }

    // Configure the global loader with our API key once
    try {
      setOptions({ key: apiKey, v: 'weekly' })
    } catch {
      // Ignore if already set
    }

    importLibrary('maps')
      .then((mapsLib) => {
        if (!mapRef.current) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { Map } = mapsLib as any

        mapInstanceRef.current = new Map(mapRef.current, {
          center: NER_CENTER,
          zoom: NER_ZOOM,
          styles: LIGHT_MAP_STYLE,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          rotateControl: false,
          scaleControl: true,
          backgroundColor: '#F8FAFC',
        })

        setStatus('loaded')
      })
      .catch((err: unknown) => {
        console.error('[NorthEastMap] Failed to load Google Maps:', err)
        setStatus('error')
      })
  }, [])

  if (status === 'no-key' || status === 'error') {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-white border border-[#E2E8F0] rounded-2xl shadow-sm ${className}`}
      >
        <div className="text-center px-8 py-12">
          <div className="w-12 h-12 rounded-full border border-[#BFDBFE] flex items-center justify-center mx-auto mb-6 bg-[#EFF6FF]">
            <div className="w-5 h-5 border-2 border-[#2563EB] rounded-sm" />
          </div>
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-[#2563EB] mb-3 font-bold">
            MAP INITIALIZATION REQUIRED
          </p>
          <p className="font-mono text-[11px] tracking-wider text-[#475569] max-w-xs">
            Configure{' '}
            <code className="text-[#172033] bg-[#EFF6FF] px-1.5 py-0.5 rounded border border-[#BFDBFE]">
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            </code>
            {' '}to enable regional mapping.
          </p>
          {status === 'error' && (
            <p className="mt-3 font-mono text-[10px] tracking-wider text-[#DC2626]">
              API key present but failed to load. Check your key configuration.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin mx-auto mb-4" />
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569]">
              LOADING REGIONAL MAP
            </p>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-full rounded-2xl"
        aria-label="Interactive map of India's North Eastern Region"
      />
    </div>
  )
}
