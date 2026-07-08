export interface SimpleAuditResult {
  model: string
  result: string
  time: number
  tokens: number
  sources: string[]
}

export interface CompareAgentResult {
  result: string
  time: number
  tokens: number
  rag_utilizado?: boolean
}

export interface CompareAuditResult {
  results: Record<string, CompareAgentResult>
  models: string[]
  sources: string[]
}

export interface AuditFormData {
  model: string
  sql: string
  target: string
}

export interface MultiAgentResult {
  gemini_plan: string
  qwen_sql: string
  llama_review: string
  final_result: string
  time: number
  tokens: number
}
