import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import type { ReactElement } from 'react'

export interface ModelMetrics {
  model: string
  executionTime: number
  tokensConsumed: number
}

interface AnalyticsDashboardProps {
  metrics: ModelMetrics[]
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444']

export default function AnalyticsDashboard({ metrics }: AnalyticsDashboardProps): ReactElement {
  if (metrics.length === 0) {
    return (
      <div className="text-slate-500 text-center py-8">
        No hay métricas disponibles. Ejecuta un benchmark para ver los resultados.
      </div>
    )
  }

  const timeData = metrics.map((m) => ({
    name: m.model,
    time: Number((m.executionTime / 1000).toFixed(2)),
  }))

  const tokenData = metrics.map((m) => ({
    name: m.model,
    value: m.tokensConsumed,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">
          Tiempo de Respuesta (s)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#e2e8f0',
              }}
            />
            <Bar dataKey="time" fill="#22c55e" radius={[4, 4, 0, 0]} name="Tiempo (s)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">
          Consumo de Tokens
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={tokenData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              label={({ name, value }: { name?: string; value?: number | string }) =>
                `${name ?? 'Desconocido'}: ${Number(value ?? 0).toLocaleString()}`
              }
            >
              {tokenData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#e2e8f0',
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
