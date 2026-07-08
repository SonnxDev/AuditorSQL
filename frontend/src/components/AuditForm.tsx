import { useState } from 'react'
import { Play, Terminal, Target, Database } from 'lucide-react'
import type { AuditFormData } from '../types'

interface AuditFormProps {
  onExecute: (data: AuditFormData) => Promise<void>
  isLoading: boolean
  showModelSelector?: boolean
  multiagentActive?: boolean
}

const DEFAULT_TARGET = 'Optimizar tiempo de respuesta, identificar índices faltantes'

export default function AuditForm({ onExecute, isLoading, showModelSelector = true, multiagentActive = false }: AuditFormProps) {
  const [sql, setSql] = useState('')
  const [model, setModel] = useState('gemini-2.5-flash')
  const [target, setTarget] = useState('')
  const [schemaDdl, setSchemaDdl] = useState('')

  const handleSubmit = async () => {
    if (!sql.trim()) return
    await onExecute({
      model,
      sql: sql.trim(),
      target: target.trim() || DEFAULT_TARGET,
    })
  }

  const isDisabled = isLoading || !sql.trim()

  return (
    <div className="flex flex-col gap-5">
      {showModelSelector && (
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-surface-300 uppercase tracking-wider mb-1.5">
            <Terminal className="w-3.5 h-3.5" />
            Modelo
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2.5 text-sm text-surface-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
          >
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="deepseek-chat">DeepSeek Chat</option>
            <option value="qwen-2.5-coder">Qwen 2.5 Coder 7B</option>
            <option value="groq-llama-3">Llama 3 (Groq)</option>
          </select>
        </div>
      )}

      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-surface-300 uppercase tracking-wider mb-1.5">
          <Database className="w-3.5 h-3.5" />
          Consulta SQL <span className="text-red-400">*</span>
        </label>
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          placeholder="SELECT * FROM users WHERE ..."
          rows={10}
          className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-3 text-sm text-surface-100 font-mono placeholder-surface-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-surface-300 uppercase tracking-wider mb-1.5">
          <Target className="w-3.5 h-3.5" />
          Objetivo de Optimización
          <span className="text-surface-500 font-normal normal-case">(opcional)</span>
        </label>
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Ej: Reducir tiempo de ejecución, identificar índices faltantes..."
          className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
        />
        {!target.trim() && (
          <p className="text-[11px] text-surface-500 mt-1">
            Se usará un valor predeterminado si se deja vacío.
          </p>
        )}
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-surface-300 uppercase tracking-wider mb-1.5">
          <Database className="w-3.5 h-3.5" />
          Schema DDL
          <span className="text-surface-500 font-normal normal-case">(opcional)</span>
        </label>
        <textarea
          value={schemaDdl}
          onChange={(e) => setSchemaDdl(e.target.value)}
          placeholder="CREATE TABLE users (id INT PRIMARY KEY, ...)"
          rows={4}
          className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-3 text-sm text-surface-100 font-mono placeholder-surface-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isDisabled}
        className={`flex items-center justify-center gap-2 w-full py-2.5 text-white text-sm font-medium rounded-lg transition-all duration-300 disabled:shadow-none ${
          multiagentActive
            ? 'bg-orange-600 hover:bg-orange-500 disabled:bg-surface-800 disabled:text-surface-500 shadow-lg shadow-orange-900/40'
            : 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-surface-800 disabled:text-surface-500 shadow-lg shadow-emerald-900/30'
        }`}
      >
        <Play className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Procesando...' : 'Ejecutar Auditoría'}
      </button>
    </div>
  )
}
