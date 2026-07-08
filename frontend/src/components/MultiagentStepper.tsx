import { useState } from 'react'
import { Sparkles, Bot, Braces, FileSearch, ChevronDown, ChevronRight, CheckCircle, Cpu } from 'lucide-react'
import type { MultiAgentResult } from '../types'
import { parseResult } from '../utils'
import MetricCard from './MetricCard'
import { Clock, FileText } from 'lucide-react'

interface MultiagentStepperProps {
  result: MultiAgentResult
}

interface StepCardProps {
  index: number
  title: string
  subtitle: string
  icon: React.ReactNode
  borderColor: string
  glowColor: string
  children: React.ReactNode
  isExpanded?: boolean
  onToggle?: () => void
}

function StepCard({ index, title, subtitle, icon, borderColor, glowColor, children, isExpanded, onToggle }: StepCardProps) {
  return (
    <div
      className={`relative rounded-xl border ${borderColor} bg-surface-900/60 backdrop-blur-sm overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-lg' : ''}`}
      style={isExpanded ? { boxShadow: `0 0 20px ${glowColor}15` } : {}}
    >
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-surface-800/30 transition-colors" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${borderColor.replace('border-', 'bg-').replace('/50', '/20')}`}>
            {icon}
          </div>
          <div>
            <span className="text-xs font-semibold text-surface-400">Paso {index}</span>
            <h4 className="text-sm font-semibold text-surface-100">{title}</h4>
            <p className="text-[11px] text-surface-500">{subtitle}</p>
          </div>
        </div>
        {isExpanded ? <ChevronDown className="w-4 h-4 text-surface-500" /> : <ChevronRight className="w-4 h-4 text-surface-500" />}
      </div>
      {isExpanded && (
        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

function StepConnector({ active }: { active: boolean }) {
  return (
    <div className="flex justify-center py-1">
      <div className={`w-0.5 h-6 rounded-full ${active ? 'bg-gradient-to-b from-orange-500 to-amber-500' : 'bg-surface-700'}`} />
    </div>
  )
}

export default function MultiagentStepper({ result }: MultiagentStepperProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    plan: true,
    sql: true,
    review: true,
    final: true,
  })

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  const parsedFinal = parseResult(result.final_result)

  return (
    <div className="flex flex-col gap-0">
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-4 h-4 text-orange-400" />
          <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
            Pipeline Multiagente
          </h3>
        </div>
        <p className="text-[11px] text-surface-500">
          4 modelos trabajaron en cadena para auditar tu consulta
        </p>
      </div>

      {/* Paso 1: Planificador */}
      <StepCard
        index={1}
        title="Gemini 2.5 Flash"
        subtitle="Planificador RAG — Analiza contexto y genera plan estratégico"
        icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
        borderColor="border-emerald-700/40"
        glowColor="#10b981"
        isExpanded={expanded.plan}
        onToggle={() => toggle('plan')}
      >
        {result.gemini_plan ? (
          <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-wrap">
            {result.gemini_plan}
          </p>
        ) : (
          <p className="text-sm text-surface-500 italic">Sin contenido</p>
        )}
      </StepCard>

      <StepConnector active />

      {/* Paso 2: Desarrollador */}
      <StepCard
        index={2}
        title="Qwen 2.5 Coder"
        subtitle="Desarrollador SQL — Escribe la consulta optimizada"
        icon={<Braces className="w-4 h-4 text-cyan-400" />}
        borderColor="border-cyan-700/40"
        glowColor="#06b6d4"
        isExpanded={expanded.sql}
        onToggle={() => toggle('sql')}
      >
        {result.qwen_sql ? (
          <pre className="bg-surface-950 rounded-lg p-3 text-sm text-emerald-300 font-mono whitespace-pre-wrap leading-relaxed max-h-[30vh] overflow-y-auto border border-surface-700/50">
            {result.qwen_sql}
          </pre>
        ) : (
          <p className="text-sm text-surface-500 italic">Sin contenido</p>
        )}
      </StepCard>

      <StepConnector active />

      {/* Paso 3: Revisor */}
      <StepCard
        index={3}
        title="Llama 3 (Groq)"
        subtitle="Revisor de Rendimiento — Comentarios sobre la optimización"
        icon={<Bot className="w-4 h-4 text-purple-400" />}
        borderColor="border-purple-700/40"
        glowColor="#a855f7"
        isExpanded={expanded.review}
        onToggle={() => toggle('review')}
      >
        {result.llama_review ? (
          <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-wrap">
            {result.llama_review}
          </p>
        ) : (
          <p className="text-sm text-surface-500 italic">Sin contenido</p>
        )}
      </StepCard>

      <StepConnector active />

      {/* Paso 4: Auditor Final */}
      <StepCard
        index={4}
        title="DeepSeek Chat"
        subtitle="Auditor Final — Dictamen estructurado completo"
        icon={<CheckCircle className="w-4 h-4 text-orange-400" />}
        borderColor="border-orange-600/50"
        glowColor="#f97316"
        isExpanded={expanded.final}
        onToggle={() => toggle('final')}
      >
        {result.final_result ? (
          <div className="flex flex-col gap-4">
            <div className="bg-surface-950/80 rounded-xl p-4 border border-surface-700/50">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Diagnóstico
                </h4>
              </div>
              <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-wrap">
                {parsedFinal.diagnosis || result.final_result}
              </p>
            </div>
            <div className="bg-surface-950/80 rounded-xl p-4 border border-surface-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Estrategia
                </h4>
              </div>
              <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-wrap">
                {parsedFinal.strategy}
              </p>
            </div>
            <div className="bg-surface-950/80 rounded-xl p-4 border border-surface-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Braces className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  SQL Optimizado
                </h4>
              </div>
              <pre className="text-sm text-emerald-300 font-mono whitespace-pre-wrap leading-relaxed max-h-[25vh] overflow-y-auto">
                {parsedFinal.optimizedSql}
              </pre>
            </div>
          </div>
        ) : (
          <p className="text-sm text-surface-500 italic">Sin contenido</p>
        )}
      </StepCard>

      <div className="mt-5 pt-4 border-t border-surface-700/50">
        <div className="flex flex-wrap gap-3">
          <MetricCard
            icon={<Clock className="w-4 h-4" />}
            label="Tiempo Total"
            value={`${result.time.toFixed(2)}s`}
          />
          <MetricCard
            icon={<FileText className="w-4 h-4" />}
            label="Tokens"
            value={`~${result.tokens.toLocaleString()}`}
          />
        </div>
      </div>
    </div>
  )
}