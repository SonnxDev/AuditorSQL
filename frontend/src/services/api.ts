import type { SimpleAuditResult, CompareAuditResult } from '../types'

const API_BASE = 'http://127.0.0.1:3001'

export async function auditSingleQuery(
  sql: string,
  model: string,
  target: string,
  schemaDdl?: string,
): Promise<SimpleAuditResult> {
  const response = await fetch(`${API_BASE}/api/audit/single`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, sql, target, schema_ddl: schemaDdl || null }),
  })
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.error || `Error HTTP ${response.status}`)
  }
  return response.json()
}

export async function auditCompareQuery(
  sql: string,
  target: string,
  schemaDdl?: string,
): Promise<CompareAuditResult> {
  const response = await fetch(`${API_BASE}/api/audit/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, target, schema_ddl: schemaDdl || null }),
  })
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.error || `Error HTTP ${response.status}`)
  }
  return response.json()
}
