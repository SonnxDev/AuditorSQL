import { useState } from 'react'
import { Loader2, AlertCircle, Cpu, Sparkles } from 'lucide-react'
import AuditForm from '../components/AuditForm'
import ResultPanel from '../components/ResultPanel'
import MultiagentStepper from '../components/MultiagentStepper'
import { auditSingleQuery, auditMultiAgentQuery } from '../services/api'
import type { SimpleAuditResult, MultiAgentResult } from '../types'

export default function SimpleAudit() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<SimpleAuditResult | null>(null)
  const [multiResult, setMultiResult] = useState<MultiAgentResult | null>(null)
  const [multiagentMode, setMultiagentMode] = useState(false)

  const handleExecute = async (data: {
    model: string
    sql: string
    target: string
  }) => {
    setLoading(true)
    setError('')
    setResult(null)
    setMultiResult(null)
    try {
      if (multiagentMode) {
        console.time('multiagent')
        const res = await auditMultiAgentQuery(data.sql, data.target)
        console.timeEnd('multiagent')
        console.log('[Multiagent] respuesta:', res)
        if (!res || (!res.gemini_plan && !res.final_result)) {
          throw new Error('El servidor no devolvió resultados de los agentes')
        }
        setMultiResult(res)
      } else {
        const res = await auditSingleQuery(data.sql, data.model, data.target)
        setResult(res)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error de conexión con el servidor',
      )
    } finally {
      setLoading(false)
    }
  }

  const hasResult = result && !loading
  const hasMultiResult = multiResult && !loading

  const formBorder = multiagentMode
    ? 'border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.15)]'
    : 'border-surface-800'

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-[35%] lg:min-w-[340px] shrink-0">
        <div className={`bg-surface-900/30 rounded-xl p-5 border transition-all duration-300 ${formBorder}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-surface-200">
              Formulario de Entrada
            </h2>
            <label
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 cursor-pointer text-xs ${
                multiagentMode
                  ? 'border-orange-500/50 bg-orange-950/30 text-orange-300'
                  : 'border-surface-700 bg-surface-800/50 text-surface-400 hover:border-surface-600'
              }`}
            >
              <input
                type="checkbox"
                checked={multiagentMode}
                onChange={() => {
                  setMultiagentMode(!multiagentMode)
                  setResult(null)
                  setMultiResult(null)
                  setError('')
                }}
                className="sr-only"
              />
              <div
                className={`w-7 h-4 rounded-full flex items-center px-0.5 transition-colors duration-200 ${
                  multiagentMode ? 'bg-orange-500 justify-end' : 'bg-surface-600 justify-start'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-200" />
              </div>
              <span className="flex items-center gap-1">
                <Cpu className={`w-3 h-3 ${multiagentMode ? 'text-orange-400' : 'text-surface-500'}`} />
                Pipeline Autónomo (Multiagente)
              </span>
            </label>
          </div>

          {multiagentMode && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-500/20">
              <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <p className="text-[11px] text-orange-300/80">
                Modo de alto poder: Gemini, Qwen, Llama 3 y DeepSeek trabajarán en cadena.
              </p>
            </div>
          )}

          <AuditForm
            onExecute={handleExecute}
            isLoading={loading}
            showModelSelector={!multiagentMode}
            multiagentActive={multiagentMode}
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {loading && (
          <div className="flex items-center justify-center h-64 text-surface-500 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
            <span className="text-sm">
              {multiagentMode
                ? '4 agentes están trabajando en cadena...'
                : 'La IA está analizando la consulta...'}
            </span>
          </div>
        )}

        {!loading && !hasResult && !hasMultiResult && !error && (
          <div className="flex flex-col items-center justify-center h-64 text-surface-600 gap-3">
            <p className="text-sm text-surface-500">
              Completa el formulario y ejecuta la auditoría para ver los resultados.
            </p>
          </div>
        )}

        {hasResult && <ResultPanel result={result} />}

        {hasMultiResult && <MultiagentStepper result={multiResult} />}

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