import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface RagCompareTableProps {
  sources: string[]
}

export default function RagCompareTable({ sources }: RagCompareTableProps) {
  const [open, setOpen] = useState(false)

  if (!sources || sources.length === 0) return null

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
                <th className="text-center px-4 py-2 text-surface-500 font-medium uppercase tracking-wider">
                  Gemini
                </th>
                <th className="text-center px-4 py-2 text-surface-500 font-medium uppercase tracking-wider">
                  DeepSeek
                </th>
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
                  <td className="px-4 py-2.5 text-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      ✓
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                      ✓
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
