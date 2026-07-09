# AuditorSQL

Plataforma web full-stack para auditoría y optimización de consultas SQL, impulsada por **IA Agentiva** con **RAG (Retrieval-Augmented Generation)**. Soporta 4 modelos LLM en 3 modos de auditoría: simple, comparativo y multiagente.

## Stack Tecnológico

| Capa       | Tecnología                                         |
|------------|----------------------------------------------------|
| Frontend   | React 19, TypeScript 6, Vite 8, Tailwind CSS 4     |
| Backend    | Python 3.10+, FastAPI, Uvicorn                     |
| IA / RAG   | LangChain, Google Gemini, DeepSeek, Qwen, Groq     |
| Vector DB  | FAISS (en disco, embeddings locales)               |
| Documentos | PDFs técnicos parseados con PyPDF                  |

## Endpoints de la API

| Método | Ruta                     | Descripción                                                   |
|--------|--------------------------|---------------------------------------------------------------|
| POST   | `/api/audit/single`      | Auditoría con un solo modelo a elegir                         |
| POST   | `/api/audit/compare`     | Benchmark comparativo entre múltiples modelos en paralelo     |
| POST   | `/api/audit/multiagent`  | Pipeline secuencial de 4 modelos (Gemini → Qwen → Llama → DeepSeek) |
| GET    | `/health`                | Health check del servidor                                     |

> Documentación interactiva (Swagger UI) en `http://localhost:3001/docs`

## Modelos Soportados

| ID               | Proveedor              | API Key                     |
|------------------|------------------------|-----------------------------|
| `gemini-2.5-flash` | Google Gemini        | `GEMINI_API_KEY`            |
| `deepseek-chat`    | DeepSeek vía OpenRouter | `OPENAI_API_KEY`          |
| `qwen-2.5-coder`   | HuggingFace (Qwen)    | `HUGGINGFACEHUB_API_TOKEN`  |
| `groq-llama-3`     | Groq (Llama 3)        | `GROQ_API_KEY`              |

## Modo Multiagente

El pipeline multiagente ejecuta 4 modelos en cadena:

1. **Planificador (Gemini 2.5 Flash)** — Lee el RAG y el SQL, genera un plan estratégico.
2. **Desarrollador (Qwen 2.5 Coder)** — Escribe el SQL optimizado siguiendo el plan.
3. **Revisor (Llama 3 / Groq)** — Revisa rendimiento y devuelve comentarios breves.
4. **Auditor Final (DeepSeek Chat)** — Emite dictamen estructurado (Diagnóstico, Estrategia, SQL Optimizado).

Se activa desde el frontend con el toggle "Pipeline Autónomo (Multiagente)".

## Requisitos

- Python >= 3.10
- pip
- Node.js >= 18

## Inicio rápido

```bash
# Backend
cd backend
cp .env.template .env   # Configurar API keys (ver sección de modelos)
pip install -r requirements.txt
python main.py

# Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

El backend arranca en `http://localhost:3001` y el frontend en `http://localhost:5173`.

### Variables de entorno (`.env`)

```env
PORT=3001
OPENAI_API_KEY=sk-or-tu-openrouter-key    # DeepSeek vía OpenRouter
GEMINI_API_KEY=tu-gemini-key              # Gemini 2.5 Flash
GROQ_API_KEY=tu-groq-key                  # Llama 3 (Groq)
HUGGINGFACEHUB_API_TOKEN=tu-hf-token      # Qwen 2.5 Coder
```

## Arquitectura

```
AuditorSQL/
├── backend/                        # Motor de IA y RAG
│   ├── main.py                     # FastAPI app, CORS, lifespan
│   ├── routes/
│   │   └── audit_routes.py         # Endpoints single / compare / multiagent
│   ├── services/
│   │   ├── model_registry.py       # Registry pattern (register / build / list)
│   │   ├── model_providers.py      # Fábricas de cada LLM
│   │   ├── rag_service.py          # Ingesta FAISS, retrieve, auditorías
│   │   └── multiagent_service.py   # Pipeline secuencial multiagente
│   ├── src/
│   │   ├── data/reglas_sql.pdf     # PDF fuente con reglas de optimización
│   │   └── faiss_index/            # Índice FAISS (index.faiss + index.pkl)
│   ├── .env / .env.template
│   └── requirements.txt
│
├── frontend/                       # Interfaz web
│   └── src/
│       ├── App.tsx                 # Tabs: Simple / Comparación de Agentes
│       ├── layouts/AppLayout.tsx
│       ├── pages/
│       │   ├── SimpleAudit.tsx     # Vista simple + multiagente
│       │   └── CompareAudit.tsx    # Vista comparativa
│       ├── components/
│       │   ├── AuditForm.tsx
│       │   ├── ResultPanel.tsx
│       │   ├── MultiagentStepper.tsx
│       │   ├── CompareCards.tsx
│       │   ├── CompareChart.tsx
│       │   └── ...
│       ├── services/api.ts
│       ├── types/index.ts
│       └── utils.ts
│
└── GEMINI_CONTEXT.md               # Documento de contexto para asistentes IA
```