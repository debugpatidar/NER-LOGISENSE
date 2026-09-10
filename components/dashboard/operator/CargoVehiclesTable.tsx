'use client'

import type { CargoVehicleItem } from './types'
import { Truck, MapPin, AlertTriangle, CheckCircle2, ArrowRight, Package, Radio } from 'lucide-react'

interface CargoVehiclesTableProps {
  vehicles: CargoVehicleItem[]
  onSelectVehicleOnMap?: (vehicle: CargoVehicleItem) => void
}

export function CargoVehiclesTable({ vehicles, onSelectVehicleOnMap }: CargoVehiclesTableProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden flex flex-col font-sans">
      {/* Table Header */}
      <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#16A34A]">
            <Truck size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Cargo Vehicles Live Fleet</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-ping" />
                Live Tracking
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Active heavy cargo vehicles streaming real-time coordinates synchronized with Google Maps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs font-sans">
          <Radio size={13} className="text-[#2563EB] animate-pulse" />
          <span>Live Telemetry Synchronized</span>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-[#E2E8F0] text-xs font-semibold text-slate-600">
              <th className="py-3.5 px-5">Driver Name</th>
              <th className="py-3.5 px-5">Vehicle ID</th>
              <th className="py-3.5 px-5">Current Location (Live Coordinates)</th>
              <th className="py-3.5 px-5">Destination / Route</th>
              <th className="py-3.5 px-5">Cargo Carried</th>
              <th className="py-3.5 px-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-xs text-slate-700 font-sans">
            {vehicles.map((vehicle) => (
              <tr
                key={vehicle.id}
                onClick={() => onSelectVehicleOnMap?.(vehicle)}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                {/* Driver Name */}
                <td className="py-4 px-5 font-bold text-slate-900">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
                    <span>{vehicle.driverName}</span>
                  </div>
                </td>

                {/* Vehicle ID */}
                <td className="py-4 px-5 font-semibold text-[#2563EB]">
                  <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs font-mono">
                    {vehicle.vehicleId}
                  </span>
                </td>

                {/* Current Location - Dynamic Lat/Lng updating together with map */}
                <td className="py-4 px-5">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-slate-900 font-semibold font-mono text-xs">
                      <MapPin size={14} className="text-blue-600 shrink-0" />
                      <span>
                        {vehicle.currentLat.toFixed(4)}°N, {vehicle.currentLng.toFixed(4)}°E
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-sans mt-0.5 ml-5">{vehicle.locationName}</span>
                  </div>
                </td>

                {/* Destination / Route */}
                <td className="py-4 px-5 font-medium text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{vehicle.origin}</span>
                    <ArrowRight size={13} className="text-[#2563EB]" />
                    <span className="font-bold text-slate-900">{vehicle.destination}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{vehicle.routeString}</div>
                </td>

                {/* Cargo Being Carried */}
                <td className="py-4 px-5">
                  <div className="flex items-center gap-1.5 text-blue-700 font-medium">
                    <Package size={14} className="shrink-0" />
                    <span>{vehicle.cargo}</span>
                  </div>
                </td>

                {/* Status Badge */}
                <td className="py-4 px-5 text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      vehicle.status === 'ROUTE_WARNING'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : vehicle.status === 'IN_TRANSIT'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    {vehicle.status === 'ROUTE_WARNING' ? (
                      <>
                        <AlertTriangle size={13} className="text-amber-600" />
                        <span>Route Warning</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>In Transit ({vehicle.speedKmH} km/h)</span>
                      </>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
