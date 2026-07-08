import { useState } from 'react'
import { Copy, Check, Clock, FileText } from 'lucide-react'
import type { SimpleAuditResult } from '../types'
import { parseResult } from '../utils'
import MetricCard from './MetricCard'
import RagSources from './RagSources'

interface ResultPanelProps {
  result: SimpleAuditResult
}

export default function ResultPanel({ result }: ResultPanelProps) {
  const [copied, setCopied] = useState(false)
  const parsed = parseResult(result.result)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(parsed.optimizedSql)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
            SQL Optimizado
          </h3>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-surface-300 transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <pre className="bg-surface-950 rounded-xl p-4 border border-surface-800 text-sm text-emerald-300 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[35vh] overflow-y-auto">
          {parsed.optimizedSql}
        </pre>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {parsed.diagnosis && (
          <div className="bg-surface-900/60 rounded-xl p-4 border border-surface-800">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              Diagnóstico
            </h3>
            <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-wrap">
              {parsed.diagnosis}
            </p>
          </div>
        )}
        {parsed.strategy && (
          <div className="bg-surface-900/60 rounded-xl p-4 border border-surface-800">
            <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
              Estrategia
            </h3>
            <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-wrap">
              {parsed.strategy}
            </p>
          </div>
        )}
      </div>

      <section>
        <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2.5">
          Métricas de Rendimiento
        </h3>
        <div className="flex flex-wrap gap-3">
          <MetricCard
            icon={<Clock className="w-4 h-4" />}
            label="Tiempo"
            value={`${result.time.toFixed(2)}s`}
          />
          <MetricCard
            icon={<FileText className="w-4 h-4" />}
            label="Tokens"
            value={`~${result.tokens.toLocaleString()}`}
          />
        </div>
      </section>

      <RagSources sources={result.sources} />
    </div>
  )
}
