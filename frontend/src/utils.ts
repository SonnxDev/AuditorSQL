export interface ParsedResult {
  diagnosis: string
  strategy: string
  optimizedSql: string
}

export function parseResult(text: string): ParsedResult {
  const diag = text.match(
    /DIAGNÓSTICO:\s*([\s\S]*?)(?=ESTRATEGIA:|$)/,
  )?.[1]?.trim() || ''
  const strat = text.match(
    /ESTRATEGIA:\s*([\s\S]*?)(?=SQL OPTIMIZADO:|$)/,
  )?.[1]?.trim() || ''
  const sqlOpt = text.match(/SQL OPTIMIZADO:\s*([\s\S]*)/)?.[1]?.trim() || text
  return { diagnosis: diag, strategy: strat, optimizedSql: sqlOpt }
}
