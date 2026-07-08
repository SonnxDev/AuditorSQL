# AuditorSQL — Documento de Contexto para IA

## Descripción General

Plataforma web full-stack para auditoría y optimización de consultas SQL, impulsada por **IA Agentiva** con **RAG (Retrieval-Augmented Generation)**. El usuario envía una consulta SQL, el backend recupera contexto desde un vector store FAISS (construido a partir de un PDF con reglas de optimización) y consulta uno o varios **LLMs** para producir diagnóstico, estrategia y SQL optimizado.

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
| `deepseek-chat` | DeepSeek / OpenRouter | `DEEPSEEK_API_KEY` o `OPENAI_API_KEY` |
| `groq-llama-3-70b` | Groq (gratis) | `GROQ_API_KEY` |
| `openrouter` | OpenRouter (200+ modelos) | `OPENAI_API_KEY` |

> Los embeddings son 100% locales con `paraphrase-multilingual-MiniLM-L12-v2` vía `HuggingFaceEmbeddings`. Sin rate limits, sin cuotas.

---

## Estructura del Proyecto

```
AuditorSQL/
├── backend/
│   ├── main.py                           # FastAPI app, CORS, lifespan, registro de modelos
│   ├── routes/
│   │   └── audit_routes.py               # POST /api/audit/single, /api/audit/compare
│   ├── services/
│   │   ├── model_registry.py              # Registry pattern: register_model(), build_model(), list_models()
│   │   ├── model_providers.py             # Fábricas de cada LLM (Gemini, DeepSeek, Groq, OpenRouter)
│   │   └── rag_service.py                # Ingesta RAG, retrieve, execute_single_audit, execute_comparative_audit
│   ├── src/
│   │   ├── data/reglas_sql.pdf            # PDF fuente con reglas de optimización SQL
│   │   └── faiss_index/                   # Índice FAISS (index.faiss + index.pkl)
│   ├── .env / .env.template
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── App.tsx                        # Shell con tabs: Auditoría Simple / Comparación de Agentes
│       ├── layouts/AppLayout.tsx          # Navbar + wrapper surface-950
│       ├── pages/
│       │   ├── SimpleAudit.tsx            # Vista 1: form → ResultPanel
│       │   └── CompareAudit.tsx           # Vista 2: form → CompareCards + CompareChart + RagCompareTable
│       ├── components/
│       │   ├── AuditForm.tsx              # Formulario compartido (model select, sql, target, schema)
│       │   ├── ResultPanel.tsx            # SQL optimizado + Diagnóstico + Estrategia + Métricas + RAG
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
  → FAISS similarity search (top-4, k=4)
  → Prompt: contexto + sql + target
  → LLM Chain (modelo elegido vía registry)
  → Respuesta: DIAGNÓSTICO / ESTRATEGIA / SQL OPTIMIZADO
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
3. Opcional: agregar color y nombre visible en `CompareCards.tsx` (diccionarios `MODEL_COLORS` y `formatModelName`).
4. Opcional: agregar `API_KEY` al `.env.template`.

El endpoint `/api/audit/compare` lo incluirá automáticamente. El frontend lo renderizará sin cambios (itera sobre `models[]`).

---

## Prompt Template

```
Eres un Arquitecto de Bases de Datos Senior especializado en optimización SQL.
...
DIAGNÓSTICO: [texto]
ESTRATEGIA: [texto]
SQL OPTIMIZADO: [código SQL]
```

El frontend parsea con regex para extraer cada sección.

---

## Temas Clave

- **Zero rate limits**: embeddings con HuggingFace local, LLMs vía API pero sin esperas entre lotes.
- **Model Registry**: new model = new factory function + `register_model()`. No tocar routes ni service.
- **Frontend dinámico**: `CompareCards` y `CompareChart` iteran sobre `models[]`, se adaptan a cualquier cantidad de agentes.
- **Schema DDL**: campo definido en Pydantic pero no usado en la lógica actual (placeholder).
- **Sin base de datos**: el único estado persistente es el índice FAISS en disco.
- **Sin tests**: no hay framework de testing implementado.
