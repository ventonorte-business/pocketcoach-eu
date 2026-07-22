import { Check, X } from 'lucide-react'

export function Pricing() {
  return (
    <section className="py-12">
      <h2 className="text-xl font-bold text-center mb-8">Simple pricing</h2>
      <div className="flex flex-col gap-4">
        {/* Free tier */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="font-bold">Free</h3>
            <span className="text-2xl font-bold">€0</span>
          </div>
          <ul className="text-sm space-y-2">
            <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> 3 habits</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> Streaks & XP</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> Daily quests</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> 1 guild</li>
            <li className="flex items-center gap-2 text-gray-400"><X size={14} /> Boss fights</li>
            <li className="flex items-center gap-2 text-gray-400"><X size={14} /> Reflections</li>
            <li className="flex items-center gap-2 text-gray-400"><X size={14} /> Data export</li>
          </ul>
        </div>

        {/* Pro tier */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-2xl p-5 relative">
          <span className="absolute -top-3 left-4 bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium">
            Most popular
          </span>
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="font-bold">Pro</h3>
            <div>
              <span className="text-2xl font-bold">€7.90</span>
              <span className="text-sm text-gray-500">/mo</span>
            </div>
          </div>
          <ul className="text-sm space-y-2">
            <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> Unlimited habits</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> Streaks & XP</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> Daily quests</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> Unlimited guilds</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> Weekly boss fights</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> Daily reflections</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-green-500" /> Data export</li>
          </ul>
          <a
            href="/auth"
            className="block mt-4 w-full py-3 text-center rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors"
          >
            Start free trial
          </a>
        </div>
      </div>
    </section>
  )
}
