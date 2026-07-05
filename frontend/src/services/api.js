const API_BASE = 'http://127.0.0.1:3001';

export async function auditSingleQuery(sqlCode) {
  const response = await fetch(`${API_BASE}/api/audit/single`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemini-2.5-flash',
      sql: sqlCode,
      target: 'Optimizar tiempo de respuesta, identificar índices faltantes',
    }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Error HTTP ${response.status}`);
  }
  return response.json();
}
