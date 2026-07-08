import type { CompareAgentResult } from '../types'
import { parseResult } from '../utils'
import MetricCard from './MetricCard'
import { Clock, FileText } from 'lucide-react'

interface CompareCardsProps {
  gemini: CompareAgentResult
  deepseek: CompareAgentResult
}

function AgentCard({
  name,
  headerClass,
  data,
}: {
  name: string
  headerClass: string
  data: CompareAgentResult
}) {
  const parsed = parseResult(data.result)

  return (
    <div className="flex-1 bg-surface-900/40 rounded-xl border border-surface-800 overflow-hidden">
      <div className={`px-4 py-2.5 ${headerClass}`}>
        <h3 className="text-sm font-semibold text-white">{name}</h3>
      </div>
      <div className="p-4 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
        {parsed.diagnosis && (
          <div>
            <h4 className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
              Diagnóstico
            </h4>
            <p className="text-xs text-surface-300 leading-relaxed whitespace-pre-wrap">
              {parsed.diagnosis}
            </p>
          </div>
        )}
        {parsed.strategy && (
          <div>
            <h4 className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider mb-1.5">
              Estrategia
            </h4>
            <p className="text-xs text-surface-300 leading-relaxed whitespace-pre-wrap">
              {parsed.strategy}
            </p>
          </div>
        )}
        <div>
          <h4 className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">
            SQL Optimizado
          </h4>
          <pre className="bg-surface-950 rounded-lg p-3 text-xs text-emerald-300 font-mono whitespace-pre-wrap leading-relaxed max-h-[20vh] overflow-y-auto">
            {parsed.optimizedSql}
          </pre>
        </div>
        <div className="flex gap-2">
          <MetricCard
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Tiempo"
            value={`${data.time.toFixed(2)}s`}
          />
          <MetricCard
            icon={<FileText className="w-3.5 h-3.5" />}
            label="Tokens"
            value={`~${data.tokens.toLocaleString()}`}
          />
        </div>
      </div>
    </div>
  )
}

export default function CompareCards({ gemini, deepseek }: CompareCardsProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <AgentCard
        name="Gemini 2.5 Flash"
        headerClass="bg-emerald-600/80"
        data={gemini}
      />
      <AgentCard
        name="DeepSeek Chat"
        headerClass="bg-blue-600/80"
        data={deepseek}
      />
    </div>
  )
}
