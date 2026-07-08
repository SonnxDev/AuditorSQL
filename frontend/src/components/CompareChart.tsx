import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { CompareAgentResult } from '../types'

const MODEL_COLORS: Record<string, string> = {
  'gemini-2.5-flash': '#22c55e',
  'deepseek-chat': '#3b82f6',
  'groq-llama-3-70b': '#a855f7',
  'qwen-2.5-coder': '#06b6d4',
  'groq-llama-3': '#f97316',
}

const FALLBACK_COLORS = [
  '#e11d48',
  '#06b6d4',
  '#f97316',
  '#14b8a6',
]

function modelColor(model: string, index: number): string {
  return MODEL_COLORS[model] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

interface CompareChartProps {
  results: Record<string, CompareAgentResult>
  models: string[]
}

const tooltipStyle = {
  backgroundColor: '#1a1d27',
  border: '1px solid #4d566b',
  borderRadius: '8px',
  color: '#e2e6ef',
  fontSize: '12px',
}

export default function CompareChart({ results, models }: CompareChartProps) {
  const timeEntry: Record<string, string | number> = { name: 'Tiempo (s)' }
  const tokenEntry: Record<string, string | number> = { name: 'Tokens' }

  models.forEach((m) => {
    timeEntry[m] = Number((results[m]?.time ?? 0).toFixed(2))
    tokenEntry[m] = results[m]?.tokens ?? 0
  })

  const timeData = [timeEntry]
  const tokenData = [tokenEntry]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-surface-900/40 rounded-xl p-4 border border-surface-800">
        <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">
          Tiempo de Respuesta
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={timeData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#4d566b" />
            <XAxis dataKey="name" stroke="#8b98b5" tick={{ fontSize: 12 }} />
            <YAxis stroke="#8b98b5" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            {models.map((m, i) => (
              <Bar
                key={m}
                dataKey={m}
                fill={modelColor(m, i)}
                radius={[4, 4, 0, 0]}
                name={m}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-surface-900/40 rounded-xl p-4 border border-surface-800">
        <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">
          Consumo de Tokens
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={tokenData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#4d566b" />
            <XAxis dataKey="name" stroke="#8b98b5" tick={{ fontSize: 12 }} />
            <YAxis stroke="#8b98b5" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            {models.map((m, i) => (
              <Bar
                key={m}
                dataKey={m}
                fill={modelColor(m, i)}
                radius={[4, 4, 0, 0]}
                name={m}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
