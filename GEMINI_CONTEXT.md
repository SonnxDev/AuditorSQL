# AuditorSQL — Documento de Contexto para IA

## Descripción General

AuditorSQL es una plataforma web full-stack para auditoría y optimización de consultas SQL, impulsada por **IA Agentiva** con técnica **RAG (Retrieval-Augmented Generation)**. Permite al usuario pegar una consulta SQL, enviarla al backend donde se recupera contexto relevante desde un vector store (construido a partir de un PDF con reglas de optimización SQL), y luego consulta un **LLM** (Gemini o DeepSeek) para producir un diagnóstico, una estrategia de optimización y el SQL optimizado.

---

## Stack Tecnológico Completo

### Frontend

| Tecnología | Versión | Propósito |
|---|---|---|
| React | ^19.2.7 | Framework de UI |
| TypeScript | ~6.0.2 | Tipado estático |
| Vite | ^8.1.0 | Build tool / dev server |
| Tailwind CSS | ^4.3.1 | Framework de utilidades CSS |
| @tailwindcss/vite | ^4.3.1 | Plugin de Tailwind para Vite |
| @vitejs/plugin-react | ^6.0.2 | Plugin de React para Vite (Oxc) |
| lucide-react | ^1.22.0 | Librería de iconos |
| recharts | ^3.9.2 | Librería de gráficos (AnalyticsDashboard) |
| oxlint | ^1.69.0 | Linter (dev) |

### Backend

| Tecnología | Versión | Propósito |
|---|---|---|
| Python | 3.14.0 | Runtime |
| FastAPI | última | Framework web REST API |
| uvicorn | última | Servidor ASGI |
| pydantic | última | Validación de requests/responses |
| python-dotenv | última | Carga de variables de entorno (.env) |
| LangChain | última | Framework de orquestación LLM |
| langchain-community | última | Integraciones comunitarias (PDF, FAISS, embeddings) |
| langchain-google-genai | última | Integración con Google Gemini |
| langchain-openai | última | Integración con API compatible OpenAI (DeepSeek) |
| PyPDF | última | Parseo de PDFs |
| faiss-cpu | última | Búsqueda de similitud vectorial |

### LLMs / IA

| Modelo | API | Provider | Propósito |
|---|---|---|---|
| gemini-2.5-flash | Google GenAI | Google | Chat / auditoría principal |
| gemini-embedding-001 | Google GenAI | Google | Embeddings para RAG |
| deepseek-chat | api.deepseek.com/v1 | DeepSeek | Chat / auditoría secundaria |
| deepseek/deepseek-chat | openrouter.ai/api/v1 | OpenRouter | Fallback para DeepSeek |

---

## Arquitectura del Proyecto

```
AuditorSQL/
├── backend/                          # Motor de IA y RAG (Python + FastAPI + LangChain)
│   ├── main.py                       # Servidor FastAPI (puerto 3001)
│   ├── services/
│   │   └── rag_service.py            # Lógica RAG: ingesta, recuperación y generación
│   ├── routes/
│   │   ├── __init__.py
│   │   └── audit_routes.py           # Endpoints POST /api/audit/single y /api/audit/compare
│   ├── src/
│   │   ├── data/
│   │   │   └── reglas_sql.pdf        # PDF fuente con reglas de optimización SQL
│   │   └── faiss_index/
│   │       ├── index.faiss           # Índice vectorial FAISS (binario)
│   │       └── index.pkl             # Metadatos del índice (pickle)
│   ├── .env                          # Variables de entorno (API keys)
│   ├── .env.template                 # Plantilla de variables de entorno
│   └── requirements.txt              # Dependencias Python
│
├── frontend/                         # Interfaz desktop web (Vite + React + Tailwind)
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuditorPanel.jsx      # Pantalla principal: input SQL y resultados
│   │   │   └── AnalyticsDashboard.tsx # Dashboard de benchmarks (no integrado aún)
│   │   ├── services/
│   │   │   └── api.js                # Capa de comunicación con FastAPI
│   │   ├── App.jsx                   # Layout principal con Navbar
│   │   ├── index.css                 # Estilos globales y tema Tailwind oscuro
│   │   └── main.tsx                  # Punto de entrada React
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts                # Configuración de Vite + React + Tailwind
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   └── tsconfig.node.json
│
├── README.md
└── GEMINI_CONTEXT.md                 # Este documento
```

---

## Pipeline RAG (Recuperación y Generación)

### Fase de Ingesta (al iniciar el backend)

```
reglas_sql.pdf
       │
       ▼
 PyPDFLoader (carga asíncrona)
       │
       ▼
 Filtro de páginas administrativas
   (índice, registro de cambios, certificados, etc.)
       │
       ▼
 RecursiveCharacterTextSplitter
   chunk_size=750, chunk_overlap=150
   separators=["\n\n", "\n", " ", ""]
       │
       ▼
 GoogleGenerativeAIEmbeddings
   (gemini-embedding-001)
       │
       ▼
 FAISS.from_documents(all_chunks, embeddings)
       │
       ├── Guardado en disco (src/faiss_index/)
       └── Mantenido en memoria (self.vector_store)
```

### Fase de Recuperación y Generación (por cada solicitud de auditoría)

```
Consulta SQL del usuario
       │
       ▼
 vector_store.as_retriever(search_kwargs={"k": 4})
   (búsqueda de similitud FAISS)
       │
       ▼
 Top 4 chunks de documento más relevantes
       │
       ▼
 Plantilla de Prompt Supervisado
   {context}  ← chunks recuperados unidos con "\n\n"
   {sql}      ← SQL original del usuario
   {target}   ← objetivo de auditoría
       │
       ▼
 LLM Chain (prompt_template | model)
   ├── Gemini 2.5 Flash (single o compare)
   └── DeepSeek Chat (compare)
       │
       ▼
 Respuesta estructurada:
   DIAGNÓSTICO
   ESTRATEGIA
   SQL OPTIMIZADO
```

### Prompt Template Utilizado

```
Eres un Arquitecto de Bases de Datos Senior especializado en optimización SQL.
Debes auditar la consulta proporcionada usando el contexto técnico disponible.

Contexto relevante:
{context}

Consulta SQL original:
{sql}

Objetivo de la auditoría:
{target}

Responde ÚNICAMENTE con el siguiente formato exacto, sin añadir texto adicional:

DIAGNÓSTICO: [Explica problemas de rendimiento, legibilidad y seguridad]

ESTRATEGIA: [Describe paso a paso la optimización aplicada]

SQL OPTIMIZADO: [Consulta corregida y optimizada]
```

---

## Endpoints de la API

### `GET /health`

Health check del servidor.

**Respuesta:**
```json
{
  "status": "ok",
  "service": "AuditorSQL Backend - RAG Engine"
}
```

### `POST /api/audit/single`

Auditoría con un solo modelo (Gemini o DeepSeek).

**Request body:**
```json
{
  "model": "gemini-2.5-flash",
  "sql": "SELECT * FROM users WHERE ...",
  "target": "Optimizar tiempo de respuesta, identificar índices faltantes",
  "schema_ddl": null
}
```

| Campo | Tipo | Obligatorio | Default | Descripción |
|---|---|---|---|---|
| `model` | string | No | `gemini-2.5-flash` | Modelo a usar |
| `sql` | string | Sí | — | Consulta SQL a auditar |
| `target` | string | No | `Optimizar rendimiento general` | Objetivo de la auditoría |
| `schema_ddl` | string? | No | `null` | Placeholder (no usado actualmente) |

**Respuesta:**
```json
{
  "model": "gemini-2.5-flash",
  "result": "DIAGNÓSTICO: ...\n\nESTRATEGIA: ...\n\nSQL OPTIMIZADO: ...",
  "time": 2.3456,
  "tokens": 512,
  "sources": ["chunk1...", "chunk2...", "chunk3...", "chunk4..."]
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `model` | string | Modelo que generó la respuesta |
| `result` | string | Texto completo con DIAGNÓSTICO, ESTRATEGIA y SQL OPTIMIZADO |
| `time` | float | Tiempo de ejecución en segundos |
| `tokens` | int | Tokens estimados (longitud/4) |
| `sources` | string[] | Hasta 4 chunks de contexto recuperados vía RAG |

### `POST /api/audit/compare`

Benchmark comparativo entre Gemini y DeepSeek.

**Request body:**
```json
{
  "sql": "SELECT * FROM users WHERE ...",
  "target": "Optimizar tiempo de respuesta, identificar índices faltantes",
  "schema_ddl": null
}
```

**Respuesta:**
```json
{
  "gemini": {
    "result": "DIAGNÓSTICO: ...",
    "time": 2.3456,
    "tokens": 512
  },
  "deepseek": {
    "result": "DIAGNÓSTICO: ...",
    "time": 3.1234,
    "tokens": 480
  },
  "sources": ["chunk1...", "chunk2...", "chunk3...", "chunk4..."]
}
```

> La documentación interactiva (Swagger UI) está disponible en `http://localhost:3001/docs`

---

## Flujo de Datos (Extremo a Extremo)

```
Usuario escribe SQL en textarea
    │
    ▼
AuditorPanel.jsx: setLoading(true), llama auditSingleQuery(sql)
    │
    ▼
api.js: POST fetch() a http://127.0.0.1:3001/api/audit/single
    │
    ▼
FastAPI routes/audit_routes.py: valida body con Pydantic
    │
    ▼
rag_service.execute_single_audit():
    1. FAISS similarity search (top-4 chunks, sql como query)
    2. Construye prompt con contexto + sql + target
    3. Invoca ChatGoogleGenerativeAI (gemini-2.5-flash)
       o ChatOpenAI (deepseek-chat)
    4. Retorna {model, result, time, tokens, sources}
    │
    ▼
Respuesta JSON al frontend
    │
    ▼
AuditorPanel.jsx:
    - parseResult() extrae DIAGNÓSTICO, ESTRATEGIA, SQL OPTIMIZADO (regex)
    - Muestra: bloque SQL optimizado, tarjetas de diagnóstico/estrategia,
      métricas (tiempo + tokens), snippets de fuentes RAG
```

---

## Configuración

### Backend (.env)

```
PORT=3001
OPENAI_API_KEY=sk-your-openai-key          # Fallback para DeepSeek vía OpenRouter
GEMINI_API_KEY=your-gemini-api-key          # Obligatoria: embeddings + chat Gemini
DEEPSEEK_API_KEY=your-deepseek-key          # Opcional: DeepSeek nativo
```

- Si `DEEPSEEK_API_KEY` está definida: se usa `https://api.deepseek.com/v1` con modelo `deepseek-chat`
- Si no: se usa `https://openrouter.ai/api/v1` con modelo `deepseek/deepseek-chat` (requiere `OPENAI_API_KEY`)

### Frontend (vite.config.ts)

- Vite + React plugin (Oxc) + Tailwind CSS v4 plugin
- Sin archivo PostCSS separado (Tailwind v4 se integra vía plugin)
- Tema oscuro con paleta de colores `surface-*` personalizada en `index.css`

### CORS

```python
allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"]
```

---

## Detalles Técnicos Relevantes

### Chunking del PDF
- `RecursiveCharacterTextSplitter` con `chunk_size=750` y `chunk_overlap=150`
- Separadores: `["\n\n", "\n", " ", ""]`
- Páginas filtradas por palabras clave (índice, registro de cambios, certificados, etc.)

### Fallback del Vector Store
Si la ingesta FAISS falla (ej. error de API de embeddings), se usa un mock con `FakeEmbeddings(size=768)` y un solo `Document(page_content="mock")` para mantener el sistema funcionando sin crash.

### Cálculo de Tokens
- Aproximado: `max(1, round(len(text) / 4))` — asume ~4 caracteres por token.

### Modelos Ejecutados en Paralelo
El endpoint `/api/audit/compare` ejecuta Gemini y DeepSeek simultáneamente usando `asyncio.gather`.

### Placeholders No Implementados
- `schema_ddl` en los request models está definido pero no se utiliza en la lógica actual.
- `AnalyticsDashboard.tsx` existe en frontend pero no está importado ni integrado.

### Ausencia de Base de Datos
No se utiliza ninguna base de datos. El único estado persistente son los archivos del índice FAISS en disco.

### Sin Tests
El proyecto no cuenta con framework de testing ni en backend ni en frontend.

---

## Formato de Respuesta del LLM

El LLM debe responder estrictamente con este formato (sin texto adicional):

```
DIAGNÓSTICO: [texto]

ESTRATEGIA: [texto]

SQL OPTIMIZADO: [código SQL]
```

El frontend parsea esta respuesta con una expresión regular para extraer cada sección.
