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

interface CompareChartProps {
  gemini: CompareAgentResult
  deepseek: CompareAgentResult
}

const tooltipStyle = {
  backgroundColor: '#1a1d27',
  border: '1px solid #4d566b',
  borderRadius: '8px',
  color: '#e2e6ef',
  fontSize: '12px',
}

export default function CompareChart({ gemini, deepseek }: CompareChartProps) {
  const timeData = [
    {
      name: 'Tiempo (s)',
      Gemini: Number(gemini.time.toFixed(2)),
      DeepSeek: Number(deepseek.time.toFixed(2)),
    },
  ]

  const tokenData = [
    { name: 'Tokens', Gemini: gemini.tokens, DeepSeek: deepseek.tokens },
  ]

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
            <Bar
              dataKey="Gemini"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              name="Gemini"
            />
            <Bar
              dataKey="DeepSeek"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              name="DeepSeek"
            />
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
            <Bar
              dataKey="Gemini"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              name="Gemini"
            />
            <Bar
              dataKey="DeepSeek"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              name="DeepSeek"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
