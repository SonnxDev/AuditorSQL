import type { ReactNode } from 'react'

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string
}

export default function MetricCard({ icon, label, value }: MetricCardProps) {
  return (
    <div className="flex items-center gap-3 bg-surface-900/40 rounded-xl px-4 py-3.5 border border-surface-800">
      <div className="text-surface-500">{icon}</div>
      <div>
        <p className="text-[11px] text-surface-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-surface-100 font-mono font-medium">{value}</p>
      </div>
    </div>
  )
}
