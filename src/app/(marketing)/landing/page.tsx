import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { Pricing } from '@/components/landing/Pricing'

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Features />
      <Pricing />

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-400 space-y-2">
        <p>PocketCoach EU · Made with 🌱 in Europe</p>
        <div className="flex gap-4 justify-center">
          <a href="/privacy" className="hover:text-gray-600">Privacy</a>
          <a href="/terms" className="hover:text-gray-600">Terms</a>
          <a href="/impressum" className="hover:text-gray-600">Impressum</a>
        </div>
      </footer>
    </div>
  )
}
