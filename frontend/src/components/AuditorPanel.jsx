import { useState } from 'react';
import { Loader2, AlertCircle, Clock, Copy, Check, FileText } from 'lucide-react';
import { auditSingleQuery } from '../services/api';

function parseResult(text) {
  const diag = text.match(/DIAGNÓSTICO:\s*([\s\S]*?)(?=ESTRATEGIA:|$)/)?.[1]?.trim() || '';
  const strat = text.match(/ESTRATEGIA:\s*([\s\S]*?)(?=SQL OPTIMIZADO:|$)/)?.[1]?.trim() || '';
  const sqlOpt = text.match(/SQL OPTIMIZADO:\s*([\s\S]*)/)?.[1]?.trim() || text;
  return { diagnosis: diag, strategy: strat, optimizedSql: sqlOpt };
}

export default function AuditorPanel() {
  const [sql, setSql] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAudit = async () => {
    if (!sql.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await auditSingleQuery(sql);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(parseResult(result.result).optimizedSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  const parsed = result ? parseResult(result.result) : null;

  return (
    <div className="flex h-[calc(100vh-60px)]">
      {/* LEFT PANEL */}
      <aside className="w-[35%] min-w-[320px] border-r border-gray-800 p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-1">Consulta SQL Original</h2>
          <p className="text-[11px] text-slate-500">Escribe o pega la consulta que deseas auditar.</p>
        </div>

        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          placeholder="SELECT * FROM users WHERE ..."
          rows={10}
          className="w-full flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-slate-100 font-mono placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
        />

        <button
          onClick={handleAudit}
          disabled={loading || !sql.trim()}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-emerald-900/30"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          {loading ? 'Analizando...' : 'Auditar Consulta'}
        </button>

        {error && (
          <div className="flex items-start gap-3 text-red-400 text-sm p-3 bg-red-950/40 rounded-lg border border-red-900/50">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </aside>

      {/* RIGHT PANEL */}
      <main className="flex-1 p-6 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-full text-slate-500 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-sm">La IA está analizando la consulta...</span>
          </div>
        )}

        {!loading && !result && !error && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
            <FileText className="w-10 h-10 text-slate-700" />
            <p className="text-sm">Escribe una consulta SQL y presiona "Auditar Consulta".</p>
          </div>
        )}

        {result && parsed && !loading && (
          <div className="flex flex-col gap-6">
            {/* Optimized Code */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Código Optimizado
                </h3>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <pre className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-sm text-emerald-300 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[40vh] overflow-y-auto">
                {parsed.optimizedSql}
              </pre>
            </section>

            {/* Diagnosis & Strategy */}
            <div className="grid grid-cols-2 gap-4">
              {parsed.diagnosis && (
                <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800">
                  <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                    Diagnóstico
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {parsed.diagnosis}
                  </p>
                </div>
              )}
              {parsed.strategy && (
                <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800">
                  <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                    Estrategia
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {parsed.strategy}
                  </p>
                </div>
              )}
            </div>

            {/* Metrics */}
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Métricas de Rendimiento
              </h3>
              <div className="flex items-center gap-6 bg-gray-900/40 rounded-xl px-5 py-4 border border-gray-800 w-fit">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-400">Tiempo:</span>
                  <span className="text-slate-100 font-mono font-medium">
                    {result.time.toFixed(2)}s
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-400">Tokens:</span>
                  <span className="text-slate-100 font-mono font-medium">
                    ~{result.tokens}
                  </span>
                </div>
              </div>
            </section>

            {/* RAG Sources */}
            {result.sources?.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Fuentes Técnicas (RAG)
                </h3>
                <div className="flex flex-col gap-2">
                  {result.sources.map((src, i) => (
                    <div
                      key={i}
                      className="text-xs text-slate-500 bg-gray-900/40 rounded-lg px-4 py-3 border border-gray-800/50 leading-relaxed"
                    >
                      <span className="text-slate-600 font-mono mr-2">[{i + 1}]</span>
                      {src.length > 400 ? `${src.slice(0, 400)}...` : src}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
            <AlertCircle className="w-10 h-10 text-red-500/60" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}
