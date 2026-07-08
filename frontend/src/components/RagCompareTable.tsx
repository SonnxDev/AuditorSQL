import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { CompareAgentResult } from '../types'

const MODEL_CHECK_COLORS: Record<string, string> = {
  'gemini-2.5-flash': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'deepseek-chat': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'qwen-2.5-coder': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'groq-llama-3': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

const MODEL_MUTED_COLORS: Record<string, string> = {
  'gemini-2.5-flash': 'bg-surface-800/40 text-surface-600 border-surface-700/30',
  'deepseek-chat': 'bg-surface-800/40 text-surface-600 border-surface-700/30',
  'qwen-2.5-coder': 'bg-surface-800/40 text-surface-600 border-surface-700/30',
  'groq-llama-3': 'bg-surface-800/40 text-surface-600 border-surface-700/30',
}

const MODEL_LABELS: Record<string, string> = {
  'gemini-2.5-flash': 'Gemini',
  'deepseek-chat': 'DeepSeek',
  'qwen-2.5-coder': 'Qwen',
  'groq-llama-3': 'Llama 3',
}

interface RagCompareTableProps {
  sources: string[]
  models: string[]
  results: Record<string, CompareAgentResult>
}

export default function RagCompareTable({ sources, models, results }: RagCompareTableProps) {
  const [open, setOpen] = useState(false)

  if (!sources || sources.length === 0) return null

  const usedByModel = (model: string, sourceIndex: number): boolean | null => {
    const agent = results[model]
    if (!agent?.sources_used) return null
    return agent.sources_used[sourceIndex] ?? false
  }

  return (
    <div className="border border-surface-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 bg-surface-900/40 hover:bg-surface-900/60 transition-colors text-sm font-medium text-surface-300"
      >
        <span className="flex items-center gap-2">
          Contexto RAG Compartido
          <span className="text-xs text-surface-500 font-normal">
            ({sources.length} fragmentos)
          </span>
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-surface-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-surface-500" />
        )}
      </button>
      {open && (
        <div className="border-t border-surface-800 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-900/60">
                <th className="text-left px-4 py-2 text-surface-500 font-medium uppercase tracking-wider">
                  #
                </th>
                <th className="text-left px-4 py-2 text-surface-500 font-medium uppercase tracking-wider">
                  Fragmento
                </th>
                {models.map((m) => (
                  <th
                    key={m}
                    className="text-center px-4 py-2 text-surface-500 font-medium uppercase tracking-wider"
                  >
                    {MODEL_LABELS[m] ?? m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/50">
              {sources.map((src, i) => (
                <tr
                  key={i}
                  className="hover:bg-surface-900/20 transition-colors"
                >
                  <td className="px-4 py-2.5 text-surface-600 font-mono">
                    {i + 1}
                  </td>
                  <td className="px-4 py-2.5 text-surface-400 max-w-md truncate">
                    {src.length > 100
                      ? `${src.slice(0, 100)}...`
                      : src}
                  </td>
                  {models.map((m) => {
                    const used = usedByModel(m, i)
                    const isUsed = used === true
                    const isUnknown = used === null
                    return (
                      <td key={m} className="px-4 py-2.5 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border ${
                            isUsed
                              ? MODEL_CHECK_COLORS[m] ?? 'bg-emerald-500/20 text-emerald-400'
                              : isUnknown
                                ? 'bg-surface-800/20 text-surface-500 border-surface-700/20'
                                : MODEL_MUTED_COLORS[m] ?? 'bg-surface-800/40 text-surface-600'
                          }`}
                        >
                          {isUsed ? '✓' : isUnknown ? '-' : '✗'}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
