# AuditorSQL — Documento de Contexto para IA

## Descripción General

Plataforma web full-stack para auditoría y optimización de consultas SQL, impulsada por **IA Agentiva** con **RAG (Retrieval-Augmented Generation)**. El usuario envía una consulta SQL, el backend recupera contexto desde un vector store FAISS (construido a partir de un PDF con reglas de optimización) y consulta uno o varios **LLMs** para producir diagnóstico, estrategia y SQL optimizado.

Soporta 3 modos de auditoría:
- **Simple**: un solo LLM a elección
- **Comparativo**: múltiples LLMs en paralelo (benchmark)
- **Multiagente**: 4 LLMs en cadena secuencial (Gemini → Qwen → Llama → DeepSeek)

---

## Stack Tecnológico

### Frontend
React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 4 + lucide-react + recharts

### Backend
Python 3.14 + FastAPI + LangChain + FAISS-CPU + HuggingFace Embeddings (locales, sin API keys)

### Modelos Soportados
| ID | Proveedor | API Key |
|---|---|---|
| `gemini-2.5-flash` | Google Gemini | `GEMINI_API_KEY` |
| `deepseek-chat` | DeepSeek vía OpenRouter | `OPENAI_API_KEY` |
| `qwen-2.5-coder` | HuggingFace (Qwen) | `HUGGINGFACEHUB_API_TOKEN` |
| `groq-llama-3` | Groq (Llama 3) | `GROQ_API_KEY` |

> Los embeddings son 100% locales con `paraphrase-multilingual-MiniLM-L12-v2` vía `HuggingFaceEmbeddings`. Sin rate limits, sin cuotas.

---

## Estructura del Proyecto

```
AuditorSQL/
├── backend/
│   ├── main.py                           # FastAPI app, CORS, lifespan, registro de modelos
│   ├── routes/
│   │   └── audit_routes.py               # POST /api/audit/single, /compare, /multiagent
│   ├── services/
│   │   ├── model_registry.py             # Registry pattern: register_model(), build_model(), list_models()
│   │   ├── model_providers.py            # Fábricas de cada LLM (Gemini, DeepSeek, Qwen, Groq)
│   │   ├── rag_service.py                # Ingesta RAG, retrieve, execute_single_audit, execute_comparative_audit
│   │   └── multiagent_service.py        # Pipeline secuencial multiagente (4 pasos)
│   ├── src/
│   │   ├── data/reglas_sql.pdf           # PDF fuente con reglas de optimización SQL
│   │   └── faiss_index/                  # Índice FAISS (index.faiss + index.pkl)
│   ├── .env / .env.template
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── App.tsx                        # Shell con tabs: Auditoría Simple / Comparación de Agentes
│       ├── layouts/AppLayout.tsx          # Navbar + wrapper surface-950
│       ├── pages/
│       │   ├── SimpleAudit.tsx            # Vista simple + toggle multiagente
│       │   └── CompareAudit.tsx           # Vista comparativa
│       ├── components/
│       │   ├── AuditForm.tsx              # Formulario compartido (model select, sql, target, schema)
│       │   ├── ResultPanel.tsx            # SQL optimizado + Diagnóstico + Estrategia + Métricas + RAG
│       │   ├── MultiagentStepper.tsx      # Línea de tiempo visual del pipeline multiagente
│       │   ├── MetricCard.tsx             # Tarjeta de métrica (icono + label + valor)
│       │   ├── RagSources.tsx             # Acordeón colapsable de fragmentos RAG
│       │   ├── CompareCards.tsx           # N tarjetas lado a lado (una por modelo)
│       │   ├── CompareChart.tsx           # BarCharts dinámicos (recharts) por modelo
│       │   └── RagCompareTable.tsx        # Tabla colapsable de contexto RAG
│       ├── services/api.ts                # API calls tipadas
│       ├── types/index.ts                 # Interfaces compartidas
│       └── utils.ts                       # parseResult() para extraer DIAGNÓSTICO/ESTRATEGIA/SQL
│
└── GEMINI_CONTEXT.md
```

---

## Pipeline RAG

### Ingesta (al iniciar el backend)

```
reglas_sql.pdf
  → PyPDFLoader (aload asíncrono)
  → Filtro de páginas administrativas (índice, cambios, certificados)
  → RecursiveCharacterTextSplitter (chunk_size=750, overlap=150)
  → HuggingFaceEmbeddings("paraphrase-multilingual-MiniLM-L12-v2") — LOCAL, sin API
  → FAISS.from_documents / add_documents
  → save_local() cada 50 chunks
```

- Reanudación inteligente: si el índice ya existe, lee `ntotal` y salta los chunks ya procesados.
- Embeddings locales = sin rate limits, sin time.sleep(), sin try-except de 429.

### Recuperación + Generación (por request)

```
SQL del usuario
  → FAISS similarity search (k=5, MMR)
  → Prompt: contexto + sql + target
  → LLM Chain (modelo elegido vía registry)
  → Respuesta: DIAGNÓSTICO / ESTRATEGIA / SQL OPTIMIZADO / USO_DE_RAG
```

---

## Pipeline Multiagente

El pipeline secuencial (`execute_multiagent_pipeline` en `multiagent_service.py`) encadena 4 modelos:

1. **Paso 1 — Planificador (Gemini 2.5 Flash)**: Recibe RAG + SQL + objetivo. Genera un plan estratégico.
2. **Paso 2 — Desarrollador (Qwen 2.5 Coder)**: Recibe SQL original + plan. Genera SQL optimizado puro.
3. **Paso 3 — Revisor (Groq Llama 3)**: Recibe el SQL de Qwen. Devuelve comentarios breves de rendimiento.
4. **Paso 4 — Auditor Final (DeepSeek Chat)**: Recibe todo el historial + RAG. Emite dictamen estructurado (Diagnóstico, Estrategia, SQL Optimizado).

El cómputo de tokens es acumulativo: suma input + output de cada paso individual.

Respuesta del endpoint `/api/audit/multiagent`:
```json
{
  "gemini_plan": "...",
  "qwen_sql": "...",
  "llama_review": "...",
  "final_result": "DIAGNÓSTICO:...\nESTRATEGIA:...\nSQL OPTIMIZADO:...",
  "time": 12.34,
  "tokens": 5678
}
```

---

## Endpoints

### `POST /api/audit/single`
```json
{ "model": "gemini-2.5-flash", "sql": "SELECT ...", "target": "...", "schema_ddl": null }
→ { "model": "...", "result": "DIAGNÓSTICO:...", "time": 1.23, "tokens": 500, "sources": [...] }
```

### `POST /api/audit/compare`
```json
{ "sql": "SELECT ...", "target": "...", "models": ["gemini-2.5-flash", "deepseek-chat"] }
→ { "results": { "gemini-2.5-flash": {...}, "deepseek-chat": {...} }, "models": [...], "sources": [...] }
```

- Si `models` se omite, corre **todos los modelos registrados**.
- Todos los modelos se ejecutan en paralelo vía `asyncio.gather`.

### `POST /api/audit/multiagent`
```json
{ "sql": "SELECT ...", "target": "..." }
→ { "gemini_plan": "...", "qwen_sql": "...", "llama_review": "...", "final_result": "...", "time": 12.34, "tokens": 5678 }
```

---

## Model Registry — Cómo agregar un nuevo LLM

El patrón **registry** permite agregar modelos sin modificar `rag_service.py` ni las rutas:

```python
# services/model_providers.py

def _build_mi_modelo() -> SomeLLM:
    return SomeLLM(model="...", api_key=os.getenv("MI_API_KEY"), ...)

register_model("mi-modelo-id", _build_mi_modelo)
```

Requisitos:
1. La fábrica debe retornar un objeto compatible con LangChain (`BaseLLM` o `BaseChatModel`).
2. Registrarlo con `register_model("id", factory_function)`.
3. Opcional: agregar color y nombre visible en `CompareCards.tsx` y `CompareChart.tsx` (diccionarios `MODEL_COLORS`).
4. Opcional: agregar `API_KEY` al `.env.template`.

El endpoint `/api/audit/compare` lo incluirá automáticamente. El frontend lo renderizará sin cambios (itera sobre `models[]`).

---

## Prompt Template

El prompt base para auditoría simple y comparativa:

```
Eres un Ingeniero de Base de Datos Senior y un Auditor SQL implacable.
...
DIAGNÓSTICO: [texto]
ESTRATEGIA: [texto]
SQL OPTIMIZADO: [código SQL]
USO_DE_RAG: [SI o NO]
```

El frontend parsea con regex para extraer cada sección.

Para el pipeline multiagente se usan 4 prompts especializados (PLANNER_PROMPT, DEVELOPER_PROMPT, REVIEWER_PROMPT, FINAL_AUDITOR_PROMPT) definidos en `multiagent_service.py`.

---

## Temas Clave

- **Zero rate limits**: embeddings con HuggingFace local, LLMs vía API pero sin esperas entre lotes.
- **Model Registry**: new model = new factory function + `register_model()`. No tocar routes ni service.
- **Frontend dinámico**: `CompareCards` y `CompareChart` iteran sobre `models[]`, se adaptan a cualquier cantidad de agentes.
- **Schema DDL**: campo definido en Pydantic pero no usado en la lógica actual (placeholder).
- **Sin base de datos**: el único estado persistente es el índice FAISS en disco.
- **Sin tests**: no hay framework de testing implementado.