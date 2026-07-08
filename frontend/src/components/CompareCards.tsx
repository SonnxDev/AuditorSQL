import type { CompareAgentResult } from '../types'
import { parseResult } from '../utils'
import MetricCard from './MetricCard'
import { Clock, FileText } from 'lucide-react'

const MODEL_COLORS: Record<string, string> = {
  'gemini-2.5-flash': 'bg-emerald-600/80',
  'deepseek-chat': 'bg-blue-600/80',
  'groq-llama-3-70b': 'bg-purple-600/80',
  'qwen-2.5-coder': 'bg-cyan-600/80',
  'groq-llama-3': 'bg-orange-600/80',
}

const FALLBACK_COLORS = [
  'bg-rose-600/80',
  'bg-cyan-600/80',
  'bg-orange-600/80',
  'bg-teal-600/80',
]

function modelHeaderClass(model: string, index: number): string {
  return MODEL_COLORS[model] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

function formatModelName(name: string): string {
  const map: Record<string, string> = {
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'deepseek-chat': 'DeepSeek Chat',
    'groq-llama-3-70b': 'Groq Llama 3 70B',
    'qwen-2.5-coder': 'Qwen 2.5 Coder 7B',
    'groq-llama-3': 'Llama 3 (Groq)',
  }
  return map[name] ?? name
}

interface CompareCardsProps {
  results: Record<string, CompareAgentResult>
  models: string[]
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

  const ragUsed = data.rag_utilizado

  return (
    <div className="w-full bg-surface-900/40 rounded-xl border border-surface-800 overflow-hidden">
      <div className={`flex items-center justify-between px-4 py-2.5 ${headerClass}`}>
        <h3 className="text-sm font-semibold text-white">{name}</h3>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
            ragUsed
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : ragUsed === false
                ? 'bg-surface-700/40 text-surface-400 border-surface-600/40'
                : 'bg-surface-800/30 text-surface-500 border-surface-700/20'
          }`}
        >
          {ragUsed ? 'RAG: Utilizadas' : ragUsed === false ? 'RAG: Descartadas' : 'RAG: —'}
        </span>
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

export default function CompareCards({ results, models }: CompareCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {models.map((model, i) => (
        <AgentCard
          key={model}
          name={formatModelName(model)}
          headerClass={modelHeaderClass(model, i)}
          data={results[model]}
        />
      ))}
    </div>
  )
}
