import { useState } from 'react'
import { ChevronDown, ChevronRight, FileText } from 'lucide-react'

interface RagSourcesProps {
  sources: string[]
}

export default function RagSources({ sources }: RagSourcesProps) {
  const [open, setOpen] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  if (!sources || sources.length === 0) return null

  return (
    <div className="border border-surface-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 bg-surface-900/40 hover:bg-surface-900/60 transition-colors text-sm font-medium text-surface-300"
      >
        <span className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-surface-500" />
          Fragmentos de RAG Utilizados
          <span className="text-xs text-surface-500 font-normal">
            ({sources.length})
          </span>
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-surface-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-surface-500" />
        )}
      </button>
      {open && (
        <div className="border-t border-surface-800 divide-y divide-surface-800/50">
          {sources.map((src, i) => (
            <div key={i}>
              <button
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-surface-900/20 transition-colors"
              >
                <span className="text-xs text-surface-600 font-mono w-6 shrink-0">
                  [{i + 1}]
                </span>
                <span className="text-xs text-surface-400 truncate flex-1">
                  {expandedIndex === i
                    ? src
                    : src.length > 120
                      ? `${src.slice(0, 120)}...`
                      : src}
                </span>
                {src.length > 120 && (
                  <span className="text-[10px] text-emerald-500 shrink-0">
                    {expandedIndex === i ? 'menos' : 'más'}
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
