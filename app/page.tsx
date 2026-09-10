import { Navbar } from '@/components/navbar/Navbar'
import { Hero } from '@/components/hero/Hero'
import { MapSection } from '@/components/map/MapSection'
import { HomepageRouteFinder } from '@/components/home/HomepageRouteFinder'
import { HomepageSupportingSection } from '@/components/home/HomepageSupportingSection'
import { Footer } from '@/components/footer/Footer'

export const metadata = {
  title: 'NER / LogiSense — Northeast India Logistics Intelligence',
  description:
    'Predict disruption before the road closes. Live logistics intelligence, public route planning, and corridor risk assessment for Northeast India.',
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-[#F8FAFC] text-[#172554] overflow-x-hidden">
      <Navbar />
      <Hero />
      <MapSection />
      <HomepageRouteFinder />
      <HomepageSupportingSection />
      <Footer />
    </main>
  )
}
