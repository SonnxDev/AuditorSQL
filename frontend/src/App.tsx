import { useState } from 'react'
import type { ReactElement } from 'react'
import { Loader2, AlertCircle, Clock, Sparkles, FileText } from 'lucide-react'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import type { ModelMetrics } from './components/AnalyticsDashboard'

interface SingleAuditResponse {
  model: string
  result: string
  time: number
  tokens: number
  sources: string[]
}

interface ComparativeAuditResponse {
  gemini: { result: string; time: number; tokens: number }
  deepseek: { result: string; time: number; tokens: number }
  sources: string[]
}

function App(): ReactElement {
  const [sql, setSql] = useState('')
  const [target, setTarget] = useState('')
  const [ddlSchema, setDdlSchema] = useState('')
  const [activeTab, setActiveTab] = useState<'rapida' | 'metricas'>('rapida')
  const [model, setModel] = useState('gemini-2.5-flash')

  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [singleResult, setSingleResult] = useState<SingleAuditResponse | null>(null)
  const [error, setError] = useState('')

  const [isBenchmarking, setIsBenchmarking] = useState(false)
  const [compareResult, setCompareResult] = useState<ComparativeAuditResponse | null>(null)
  const [metrics, setMetrics] = useState<ModelMetrics[]>([])

  const handleAudit = async (): Promise<void> => {
    if (!sql || !target) {
      setError('Completa los campos "Consulta SQL" y "Objetivo" antes de ejecutar.')
      return
    }
    setIsLoading(true)
    setLoadingMessage('La IA está pensando y consultando el manual...')
    setError('')
    setSingleResult(null)

    try {
      const response = await fetch('http://localhost:3001/api/audit/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, sql, target, schema: ddlSchema }),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Error HTTP ${response.status}`)
      }
      const data: SingleAuditResponse = await response.json()
      setSingleResult(data)
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
    setCompareResult(null)
    setMetrics([])

    try {
      const response = await fetch('http://localhost:3001/api/audit/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, target, schema: ddlSchema }),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Error HTTP ${response.status}`)
      }
      const data: ComparativeAuditResponse = await response.json()
      setCompareResult(data)

      const newMetrics: ModelMetrics[] = []
      if (data.gemini) {
        newMetrics.push({
          model: 'Gemini',
          executionTime: data.gemini.time * 1000,
          tokensConsumed: data.gemini.tokens,
        })
      }
      if (data.deepseek) {
        newMetrics.push({
          model: 'DeepSeek',
          executionTime: data.deepseek.time * 1000,
          tokensConsumed: data.deepseek.tokens,
        })
      }
      setMetrics(newMetrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión con el servidor')
    } finally {
      setIsBenchmarking(false)
    }
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

        {/* Tab: Auditoría Rápida */}
        {activeTab === 'rapida' && (
          <div className="flex flex-col gap-4 flex-1">
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

            {isLoading && (
              <div className="flex items-center gap-3 text-slate-400 text-sm py-8 px-4 bg-gray-900/50 rounded-lg border border-gray-800">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                <span>{loadingMessage}</span>
              </div>
            )}

            {error && !isLoading && (
              <div className="flex items-start gap-3 text-red-400 text-sm p-4 bg-red-950/40 rounded-lg border border-red-900/50">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {singleResult && !isLoading && (
              <div className="flex flex-col gap-4 flex-1">
                {/* Model badge + tokens */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 bg-gray-800 px-3 py-1 rounded-full">
                    {singleResult.model}
                  </span>
                  <span className="text-xs text-slate-500">
                    ~{singleResult.tokens} tokens generados
                  </span>
                </div>

                {/* Result raw text */}
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex-1">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Respuesta de la IA
                  </h3>
                  <pre className="text-sm text-slate-200 font-mono whitespace-pre-wrap leading-relaxed bg-gray-950 rounded-lg p-3 border border-gray-800 overflow-x-auto max-h-[50vh] overflow-y-auto">
                    {singleResult.result}
                  </pre>
                </div>

                {/* Sources */}
                {singleResult.sources.length > 0 && (
                  <details className="bg-gray-900/60 rounded-xl border border-gray-800 group">
                    <summary className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-200 transition-colors select-none">
                      <FileText className="w-3.5 h-3.5" />
                      Fuentes consultadas ({singleResult.sources.length})
                      <span className="ml-auto text-slate-600 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="px-4 pb-3 flex flex-col gap-2 border-t border-gray-800 pt-3">
                      {singleResult.sources.map((src, i) => (
                        <div key={i} className="text-xs text-slate-500 bg-gray-950 rounded-lg p-3 border border-gray-800/50 leading-relaxed">
                          <span className="text-slate-600 font-mono mr-2">[{i + 1}]</span>
                          {src.length > 300 ? `${src.slice(0, 300)}...` : src}
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Footer */}
                <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-gray-800 pt-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Tiempo:{' '}
                    <span className="text-slate-300 font-mono">{singleResult.time.toFixed(2)}s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    Fuentes:{' '}
                    <span className="text-slate-300 font-mono">{singleResult.sources.length}</span>
                  </div>
                </div>
              </div>
            )}

            {!singleResult && !isLoading && !error && (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-600 gap-3">
                <Sparkles className="w-10 h-10 text-slate-700" />
                <p className="text-sm">Completa el formulario y ejecuta una auditoría para ver los resultados aquí.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Métricas y Comparativa */}
        {activeTab === 'metricas' && (
          <div className="flex flex-col gap-4 flex-1">
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

            {compareResult && !isBenchmarking && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {/* Gemini */}
                  <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        Gemini 2.5 Flash
                      </h3>
                      <span className="text-[10px] text-slate-500">~{compareResult.gemini.tokens} tok</span>
                    </div>
                    <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap bg-gray-950 rounded-lg p-3 border border-gray-800 overflow-x-auto max-h-48 overflow-y-auto flex-1">
                      {compareResult.gemini.result}
                    </pre>
                    <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {compareResult.gemini.time.toFixed(2)}s
                    </div>
                  </div>

                  {/* DeepSeek */}
                  <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        DeepSeek Chat
                      </h3>
                      <span className="text-[10px] text-slate-500">~{compareResult.deepseek.tokens} tok</span>
                    </div>
                    <pre className="text-xs text-blue-300 font-mono whitespace-pre-wrap bg-gray-950 rounded-lg p-3 border border-gray-800 overflow-x-auto max-h-48 overflow-y-auto flex-1">
                      {compareResult.deepseek.result}
                    </pre>
                    <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {compareResult.deepseek.time.toFixed(2)}s
                    </div>
                  </div>
                </div>

                {/* AnalyticsDashboard */}
                <AnalyticsDashboard metrics={metrics} />

                {/* Shared sources */}
                {compareResult.sources.length > 0 && (
                  <details className="bg-gray-900/60 rounded-xl border border-gray-800 group">
                    <summary className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-200 transition-colors select-none">
                      <FileText className="w-3.5 h-3.5" />
                      Fuentes compartidas del RAG ({compareResult.sources.length})
                      <span className="ml-auto text-slate-600 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="px-4 pb-3 flex flex-col gap-2 border-t border-gray-800 pt-3">
                      {compareResult.sources.map((src, i) => (
                        <div key={i} className="text-xs text-slate-500 bg-gray-950 rounded-lg p-3 border border-gray-800/50 leading-relaxed">
                          <span className="text-slate-600 font-mono mr-2">[{i + 1}]</span>
                          {src.length > 300 ? `${src.slice(0, 300)}...` : src}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </>
            )}

            {!compareResult && !isBenchmarking && (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-600 gap-3">
                <span className="text-4xl">⚖️</span>
                <p className="text-sm">
                  Ejecuta un benchmark para comparar el rendimiento de ambos modelos.
                </p>
              </div>
            )}

            {error && !isBenchmarking && !compareResult && (
              <div className="flex items-start gap-3 text-red-400 text-sm p-4 bg-red-950/40 rounded-lg border border-red-900/50">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
