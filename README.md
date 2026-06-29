# AuditorSQL

Plataforma web full-stack para auditoría y optimización de consultas SQL, impulsada por **IA Agentiva** con técnica **RAG (Retrieval-Augmented Generation)**.

## Arquitectura

```
AuditorSQL/
├── backend/              # Motor de IA y RAG (Python + FastAPI + LangChain)
│   ├── main.py           # Servidor FastAPI (puerto 3001)
│   ├── services/
│   │   └── rag_service.py   # Lógica RAG: ingesta, recuperación y generación
│   ├── routes/
│   │   └── audit_routes.py  # Endpoints /api/audit/single y /api/audit/compare
│   ├── src/data/         # PDFs/manuales fuente
│   ├── .env / .env.template
│   └── requirements.txt
│
└── frontend/             # Interfaz desktop web (Vite + React + TypeScript + Tailwind)
    ├── src/
    │   ├── components/
    │   │   └── AnalyticsDashboard.tsx  # Gráficos recharts (tiempo, tokens)
    │   ├── App.tsx       # Split screen, tabs, fetch API
    │   └── main.tsx
    └── package.json
```

## Stack Tecnológico

| Capa       | Tecnología                          |
|------------|-------------------------------------|
| Frontend   | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Backend    | Python 3.10+, FastAPI, Uvicorn      |
| IA / RAG   | LangChain, Google Gemini, DeepSeek  |
| Vector DB  | InMemoryVectorStore (en memoria)    |
| Documentos | PDFs técnicos parseados con PyPDF / pypdf |

## Endpoints de la API

| Método | Ruta                    | Descripción                                |
|--------|------------------------|--------------------------------------------|
| POST   | `/api/audit/single`    | Auditoría con un solo modelo (Gemini o DeepSeek) |
| POST   | `/api/audit/compare`   | Benchmark comparativo entre ambos modelos  |
| GET    | `/health`              | Health check del servidor                  |

> La documentación interactiva (Swagger UI) está disponible en `http://localhost:3001/docs`

## Flujo RAG

1. **Ingesta** → PDFs se parsean con PyPDFLoader y se fragmentan en chunks.
2. **Filtro** → Se descartan fragmentos administrativos ("Índice de Contenidos", "Registro de Cambios", etc.).
3. **Indexación** → Cada chunk se vectoriza con `gemini-embedding-001` y se almacena en `InMemoryVectorStore`.
4. **Consulta** → El usuario envía una consulta SQL y un objetivo desde el frontend.
5. **Recuperación** → Se buscan los 4 chunks más relevantes por similitud coseno.
6. **Generación** → El LLM responde con el contexto recuperado y se devuelven las *fuentes* utilizadas.

## Requisitos

- Python >= 3.10
- pip
- Node.js >= 18 (solo para el frontend)

## Inicio rápido

```bash
# Backend
cd backend
cp .env.template .env   # Configurar API keys (GEMINI_API_KEY obligatoria)
pip install -r requirements.txt
python main.py

# Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

El backend arranca en `http://localhost:3001` y el frontend en `http://localhost:5173`.
