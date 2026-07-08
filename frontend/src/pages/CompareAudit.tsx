import { useState } from 'react'
import { Loader2, AlertCircle, Terminal } from 'lucide-react'
import AuditForm from '../components/AuditForm'
import CompareCards from '../components/CompareCards'
import CompareChart from '../components/CompareChart'
import RagCompareTable from '../components/RagCompareTable'
import { auditCompareQuery } from '../services/api'
import type { CompareAuditResult } from '../types'

const ALL_MODELS = [
  'gemini-2.5-flash',
  'deepseek-chat',
  'qwen-2.5-coder',
  'groq-llama-3',
]

const MODEL_BADGES: Record<string, { label: string; class: string }> = {
  'gemini-2.5-flash': { label: 'Gemini 2.5 Flash', class: 'bg-emerald-600/20 text-emerald-400 border-emerald-700/40' },
  'deepseek-chat': { label: 'DeepSeek Chat', class: 'bg-blue-600/20 text-blue-400 border-blue-700/40' },
  'qwen-2.5-coder': { label: 'Qwen 2.5 Coder 7B', class: 'bg-cyan-600/20 text-cyan-400 border-cyan-700/40' },
  'groq-llama-3': { label: 'Llama 3 (Groq)', class: 'bg-orange-600/20 text-orange-400 border-orange-700/40' },
}

export default function CompareAudit() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CompareAuditResult | null>(null)

  const handleExecute = async (data: {
    sql: string
    target: string
  }) => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await auditCompareQuery(data.sql, data.target, ALL_MODELS)
      setResult(res)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error de conexión con el servidor',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-surface-900/30 rounded-xl p-5 border border-surface-800">
        <h2 className="text-sm font-semibold text-surface-200 mb-4">
          Formulario de Entrada
        </h2>
        <AuditForm onExecute={handleExecute} isLoading={loading} showModelSelector={false} />
      </div>

      <div className="flex items-center gap-2 text-xs text-surface-500">
        <Terminal className="w-3.5 h-3.5" />
        Modelos a ejecutar:
        {ALL_MODELS.map((m) => {
          const badge = MODEL_BADGES[m]
          return (
            <span
              key={m}
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${badge.class}`}
            >
              {badge.label}
            </span>
          )
        })}
      </div>

      <div className="flex-1 min-w-0">
        {loading && (
          <div className="flex items-center justify-center h-64 text-surface-500 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-sm">
              Los agentes están analizando la consulta simultáneamente...
            </span>
          </div>
        )}

        {!loading && !result && !error && (
          <div className="flex flex-col items-center justify-center h-64 text-surface-600 gap-3">
            <p className="text-sm text-surface-500">
              Completa el formulario y ejecuta la comparativa para ver los
              resultados.
            </p>
          </div>
        )}

        {result && !loading && (
          <div className="flex flex-col gap-5">
            <CompareCards
              results={result.results}
              models={result.models}
            />
            <CompareChart
              results={result.results}
              models={result.models}
            />
            <RagCompareTable sources={result.sources} models={result.models} />
          </div>
        )}

        {error && !loading && (
          <div className="flex items-start gap-3 text-red-400 text-sm p-4 bg-red-950/40 rounded-xl border border-red-900/50">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}
