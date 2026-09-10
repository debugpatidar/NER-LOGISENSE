import { Shield, BarChart3, Map } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const PERSPECTIVES = [
  {
    icon: Map,
    role: 'PUBLIC ROUTE PLANNER',
    description:
      'Plan vehicle and cargo routes across Northeast India. Access public road information, accessibility data, and regional coverage — no account required.',
    tags: ['ROUTE PLANNING', 'PUBLIC ACCESS', 'NO LOGIN REQUIRED'],
    accent: false,
    footer: 'AVAILABLE NOW — FREE TO USE',
  },
  {
    icon: Shield,
    role: 'FIELD OFFICER',
    description:
      'Capture ground-level conditions, incidents and accessibility updates from the field using GPS-verified reports.',
    tags: ['FIELD REPORTS', 'INCIDENTS', 'ROAD CONDITIONS'],
    accent: true,
    footer: 'AUTHORIZED PERSONNEL ONLY',
  },
  {
    icon: BarChart3,
    role: 'LOGISTICS OPERATOR',
    description:
      'Monitor transportation conditions and make informed routing decisions across the region from a central command dashboard.',
    tags: ['ROUTE MONITORING', 'LOGISTICS', 'ACCESSIBILITY'],
    accent: false,
    footer: 'AUTHORIZED PERSONNEL ONLY',
  },
]

export function RoleCards() {
  return (
    <section id="platform" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569] mb-4">
            TWO EXPERIENCES
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#172554]">
            ONE REGION.
            <br />
            <span className="text-[#475569] font-light">PUBLIC ACCESS & OPERATIONS.</span>
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {PERSPECTIVES.map(({ icon: Icon, role, description, tags, accent, footer }) => (
            <Card
              key={role}
              className="p-6 lg:p-8 group"
              glow={accent}
            >
              <div className="flex items-start gap-4 mb-6">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 ${
                    accent
                      ? 'bg-[#EFF6FF] text-[#2563EB]'
                      : 'bg-[#F8FAFC] text-[#475569] group-hover:bg-[#EFF6FF] group-hover:text-[#2563EB]'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#475569] mb-1">
                    {accent ? 'OPERATIONS ROLE' : 'ACCESS TYPE'}
                  </div>
                  <h3 className="text-sm font-bold tracking-wide text-[#172554]">{role}</h3>
                </div>
              </div>

              <p className="text-[#475569] text-sm leading-relaxed mb-6">{description}</p>

              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
                <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#475569]">
                  {footer}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
