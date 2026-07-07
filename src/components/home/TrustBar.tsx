'use client'

interface Props {
  trust: number
  label?: string
  color?: string
}

export default function TrustBar({ trust, label = 'Confiança', color = 'bg-green-500' }: Props) {
  const pct = Math.max(0, Math.min(100, trust))

  return (
    <div className="flex items-center gap-3">
      <span className="text-white/50 text-xs w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-white/70 text-xs w-8 text-right">{pct}%</span>
    </div>
  )
}
