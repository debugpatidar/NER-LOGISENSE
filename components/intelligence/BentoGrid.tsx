import { Globe2, FileSearch, CloudSun, BrainCircuit } from 'lucide-react'

const BENTO_ITEMS = [
  {
    icon: Globe2,
    title: 'GEOSPATIAL',
    description: 'Map the operational geography of the North Eastern Region.',
    status: 'ACTIVE / PHASE 01',
    active: true,
    colSpan: 'md:col-span-2',
  },
  {
    icon: FileSearch,
    title: 'FIELD DATA',
    description: 'Create a foundation for ground-level operational observations.',
    status: 'PHASE 02',
    active: false,
    colSpan: '',
  },
  {
    icon: CloudSun,
    title: 'WEATHER',
    description: 'Prepare the platform for future environmental intelligence.',
    status: 'PHASE 02',
    active: false,
    colSpan: '',
  },
  {
    icon: BrainCircuit,
    title: 'INTELLIGENCE',
    description: 'Future AI-assisted analysis for logistics and accessibility.',
    status: 'FUTURE ROADMAP',
    active: false,
    colSpan: 'md:col-span-2',
  },
]

export function BentoGrid() {
  return (
    <section id="intelligence" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 max-w-2xl">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569] mb-4">
            SYSTEM CAPABILITIES
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#172554]">
            THE FOUNDATION FOR
            <br />
            <span className="text-[#475569] font-light">REGIONAL INTELLIGENCE.</span>
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BENTO_ITEMS.map(({ icon: Icon, title, description, status, active, colSpan }) => (
            <div
              key={title}
              className={`
                relative overflow-hidden rounded-xl border p-6 lg:p-8 group transition-all duration-300
                ${colSpan}
                ${
                  active
                    ? 'bg-white border-[#2563EB]/40 hover:border-[#2563EB] shadow-[0_4px_25px_rgba(37,99,235,0.08)]'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] shadow-sm'
                }
              `}
            >
              {/* Background accent for active */}
              {active && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#EFF6FF] to-transparent pointer-events-none" />
              )}

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      active
                        ? 'bg-[#EFF6FF] text-[#2563EB]'
                        : 'bg-[#F8FAFC] text-[#475569] group-hover:text-[#172554]'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    className={`font-mono text-[8px] tracking-[0.2em] uppercase px-2 py-1 rounded border ${
                      active
                        ? 'text-[#2563EB] border-[#2563EB]/30 bg-[#EFF6FF]'
                        : 'text-[#475569] border-[#E2E8F0] bg-[#F8FAFC]'
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <h3 className="text-base font-bold tracking-wide text-[#172554] mb-2">{title}</h3>
                <p className="text-sm text-[#475569] leading-relaxed">{description}</p>

                {!active && (
                  <div className="mt-4 font-mono text-[9px] tracking-[0.15em] uppercase text-[#475569]/60">
                    NOT YET IMPLEMENTED
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
