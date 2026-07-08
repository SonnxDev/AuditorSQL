import { useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import AuditForm from '../components/AuditForm'
import ResultPanel from '../components/ResultPanel'
import { auditSingleQuery } from '../services/api'
import type { SimpleAuditResult } from '../types'

export default function SimpleAudit() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<SimpleAuditResult | null>(null)

  const handleExecute = async (data: {
    model: string
    sql: string
    target: string
  }) => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await auditSingleQuery(data.sql, data.model, data.target)
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
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-[35%] lg:min-w-[340px] shrink-0">
        <div className="bg-surface-900/30 rounded-xl p-5 border border-surface-800">
          <h2 className="text-sm font-semibold text-surface-200 mb-4">
            Formulario de Entrada
          </h2>
          <AuditForm onExecute={handleExecute} isLoading={loading} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {loading && (
          <div className="flex items-center justify-center h-64 text-surface-500 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-sm">
              La IA está analizando la consulta...
            </span>
          </div>
        )}

        {!loading && !result && !error && (
          <div className="flex flex-col items-center justify-center h-64 text-surface-600 gap-3">
            <p className="text-sm text-surface-500">
              Completa el formulario y ejecuta la auditoría para ver los
              resultados.
            </p>
          </div>
        )}

        {result && !loading && <ResultPanel result={result} />}

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
