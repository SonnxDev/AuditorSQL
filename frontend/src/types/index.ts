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
