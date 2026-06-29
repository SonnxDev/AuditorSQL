import { useState } from 'react'
import type { ReactElement } from 'react'
import { Loader2, AlertCircle, Clock, Sparkles } from 'lucide-react'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import type { ModelMetrics } from './components/AnalyticsDashboard'

interface AuditResult {
  diagnosis: string
  strategy: string
  optimizedSql: string
  executionTime: number
}

function App(): ReactElement {
  const [sql, setSql] = useState('')
  const [target, setTarget] = useState('')
  const [ddlSchema, setDdlSchema] = useState('')
  const [activeTab, setActiveTab] = useState<'rapida' | 'metricas'>('rapida')
  const [model, setModel] = useState('gemini-2.5-flash')

  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState('')

  const [isBenchmarking, setIsBenchmarking] = useState(false)
  const [benchmarkResults, setBenchmarkResults] = useState<{
    gemini: AuditResult | null
    deepseek: AuditResult | null
  }>({ gemini: null, deepseek: null })
  const [metrics, setMetrics] = useState<ModelMetrics[]>([])

  const handleAudit = async (): Promise<void> => {
    if (!sql || !target) {
      setError('Completa los campos "Consulta SQL" y "Objetivo" antes de ejecutar.')
      return
    }
    setIsLoading(true)
    setLoadingMessage('La IA está pensando y consultando el manual...')
    setError('')
    setResult(null)

    try {
      const response = await fetch('http://localhost:3001/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, sql, target, schema: ddlSchema }),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Error HTTP ${response.status}`)
      }
      const data: AuditResult = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión con el servidor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBenchmark = async (): Promise<void> => {
    if (!sql || !target) {
      setError('Completa los campos "Consulta SQL" y "Objetivo" antes de ejecutar.')
      return
    }
    setIsBenchmarking(true)
    setError('')
    setBenchmarkResults({ gemini: null, deepseek: null })
    setMetrics([])

    const models = [
      { key: 'gemini' as const, name: 'gemini-2.5-flash' },
      { key: 'deepseek' as const, name: 'deepseek-chat' },
    ]

    const results: { gemini: AuditResult | null; deepseek: AuditResult | null } = {
      gemini: null,
      deepseek: null,
    }

    for (const { key, name } of models) {
      try {
        const response = await fetch('http://localhost:3001/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: name, sql, target, schema: ddlSchema }),
        })
        if (response.ok) {
          results[key] = await response.json()
        }
      } catch {
        // Individual model failure is non-fatal
      }
    }

    setBenchmarkResults(results)

    const newMetrics: ModelMetrics[] = []
    if (results.gemini) {
      newMetrics.push({
        model: 'Gemini',
        executionTime: results.gemini.executionTime,
        tokensConsumed: Math.round(results.gemini.executionTime * 15 + 100),
      })
    }
    if (results.deepseek) {
      newMetrics.push({
        model: 'DeepSeek',
        executionTime: results.deepseek.executionTime,
        tokensConsumed: Math.round(results.deepseek.executionTime * 12 + 80),
      })
    }
    setMetrics(newMetrics)
    setIsBenchmarking(false)
  }

  return (
    <div className="flex h-screen w-screen bg-gray-950 text-slate-100 overflow-hidden">
      {/* === LEFT PANEL: 35% === */}
      <aside className="w-[35%] min-w-[35%] border-r border-gray-800 p-6 flex flex-col gap-4 overflow-y-auto">
        <div className="mb-2">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Auditor SQL
          </h1>
          <p className="text-xs text-slate-500 mt-1">Motor RAG de optimización de consultas</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Consulta SQL Original
          </label>
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="SELECT * FROM users WHERE ..."
            rows={6}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Objetivo de la Consulta
          </label>
          <textarea
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Ej: Optimizar tiempo de respuesta, identificar índices faltantes..."
            rows={3}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Esquema DDL <span className="text-slate-600 normal-case">(Opcional)</span>
          </label>
          <textarea
            value={ddlSchema}
            onChange={(e) => setDdlSchema(e.target.value)}
            placeholder="CREATE TABLE usuarios (id INT PRIMARY KEY, ...)"
            rows={4}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
          />
        </div>

        <p className="text-[10px] text-slate-600 leading-relaxed mt-auto">
          Los resultados se generan mediante IA con recuperación aumentada (RAG)
          sobre documentación técnica especializada.
        </p>
      </aside>

      {/* === RIGHT PANEL: 65% === */}
      <main className="w-[65%] p-6 flex flex-col overflow-y-auto">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 rounded-lg p-1 w-fit border border-gray-800">
          <button
            onClick={() => setActiveTab('rapida')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'rapida'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Auditoría Rápida
          </button>
          <button
            onClick={() => setActiveTab('metricas')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'metricas'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Métricas y Comparativa
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'rapida' && (
          <div className="flex flex-col gap-4 flex-1">
            {/* Model selector + button */}
            <div className="flex items-center gap-3">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="deepseek-chat">DeepSeek Chat</option>
              </select>
              <button
                onClick={handleAudit}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-emerald-900/30"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isLoading ? 'Analizando...' : 'Ejecutar Auditoría RAG'}
              </button>
            </div>

            {/* Loading message */}
            {isLoading && (
              <div className="flex items-center gap-3 text-slate-400 text-sm py-8 px-4 bg-gray-900/50 rounded-lg border border-gray-800">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                <span>{loadingMessage}</span>
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className="flex items-start gap-3 text-red-400 text-sm p-4 bg-red-950/40 rounded-lg border border-red-900/50">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Result */}
            {result && !isLoading && (
              <div className="flex flex-col gap-4 flex-1">
                {/* Diagnosis */}
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Diagnóstico
                  </h3>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {result.diagnosis}
                  </p>
                </div>

                {/* Strategy */}
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Estrategia de Optimización
                  </h3>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {result.strategy}
                  </p>
                </div>

                {/* Optimized SQL */}
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex-1">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    SQL Optimizado
                  </h3>
                  <pre className="text-sm text-emerald-300 font-mono whitespace-pre-wrap bg-gray-950 rounded-lg p-3 border border-gray-800 overflow-x-auto">
                    {result.optimizedSql}
                  </pre>
                </div>

                {/* Footer: execution time */}
                <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-gray-800 pt-3">
                  <Clock className="w-3.5 h-3.5" />
                  Tiempo de ejecución:{' '}
                  <span className="text-slate-300 font-mono">
                    {(result.executionTime / 1000).toFixed(2)}s
                  </span>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!result && !isLoading && !error && (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-600 gap-3">
                <Sparkles className="w-10 h-10 text-slate-700" />
                <p className="text-sm">Completa el formulario y ejecuta una auditoría para ver los resultados aquí.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'metricas' && (
          <div className="flex flex-col gap-4 flex-1">
            {/* Benchmark button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBenchmark}
                disabled={isBenchmarking}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-900/30"
              >
                {isBenchmarking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-base">⚖️</span>
                )}
                {isBenchmarking ? 'Ejecutando benchmark...' : 'Iniciar Benchmark Completo'}
              </button>
              {isBenchmarking && (
                <span className="text-xs text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Evaluando ambos modelos...
                </span>
              )}
            </div>

            {/* Benchmark results: two panels */}
            {(benchmarkResults.gemini || benchmarkResults.deepseek) && !isBenchmarking && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {/* Gemini panel */}
                  <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                    <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Gemini 2.5 Flash
                    </h3>
                    {benchmarkResults.gemini ? (
                      <>
                        <h4 className="text-[10px] text-slate-500 uppercase mb-1">SQL Optimizado</h4>
                        <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap bg-gray-950 rounded-lg p-3 border border-gray-800 overflow-x-auto max-h-48 overflow-y-auto">
                          {benchmarkResults.gemini.optimizedSql}
                        </pre>
                        <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500">
                          <Clock className="w-3 h-3" />
                          {(benchmarkResults.gemini.executionTime / 1000).toFixed(2)}s
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-slate-600 italic">No disponible</p>
                    )}
                  </div>

                  {/* DeepSeek panel */}
                  <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                    <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      DeepSeek Chat
                    </h3>
                    {benchmarkResults.deepseek ? (
                      <>
                        <h4 className="text-[10px] text-slate-500 uppercase mb-1">SQL Optimizado</h4>
                        <pre className="text-xs text-blue-300 font-mono whitespace-pre-wrap bg-gray-950 rounded-lg p-3 border border-gray-800 overflow-x-auto max-h-48 overflow-y-auto">
                          {benchmarkResults.deepseek.optimizedSql}
                        </pre>
                        <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500">
                          <Clock className="w-3 h-3" />
                          {(benchmarkResults.deepseek.executionTime / 1000).toFixed(2)}s
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-slate-600 italic">No disponible</p>
                    )}
                  </div>
                </div>

                {/* AnalyticsDashboard */}
                <AnalyticsDashboard metrics={metrics} />
              </>
            )}

            {/* Empty state */}
            {!benchmarkResults.gemini && !benchmarkResults.deepseek && !isBenchmarking && (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-600 gap-3">
                <span className="text-4xl">⚖️</span>
                <p className="text-sm">
                  Ejecuta un benchmark para comparar el rendimiento de ambos modelos.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
