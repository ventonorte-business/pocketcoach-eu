import { Flame, Target, Users, Trophy, PenLine } from 'lucide-react'

const features = [
  {
    icon: Flame,
    title: 'Streak chains',
    description: 'Never break the chain. Your Sprout grows with every consecutive day.',
  },
  {
    icon: Target,
    title: 'Daily quests',
    description: 'A fresh challenge each day. Complete it for bonus XP.',
  },
  {
    icon: Users,
    title: 'Guilds of 5',
    description: 'Team up with friends. A private leaderboard keeps you accountable.',
  },
  {
    icon: Trophy,
    title: 'Boss fights',
    description: 'Weekly collective challenge. Defeat the Procrastination Dragon together.',
  },
  {
    icon: PenLine,
    title: 'Reflections',
    description: 'One sentence a day. Build self-awareness and earn XP.',
  },
]

export function Features() {
  return (
    <section className="py-12">
      <h2 className="text-xl font-bold text-center mb-8">Everything you need to stick</h2>
      <div className="flex flex-col gap-4">
        {features.map((f) => (
          <div key={f.title} className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <f.icon size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-sm">{f.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
