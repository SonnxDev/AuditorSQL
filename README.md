# AuditorSQL

Plataforma web full-stack para auditoria y optimizacion de consultas SQL, impulsada por **IA Agentiva** con tecnica **RAG (Retrieval-Augmented Generation)**.

## Arquitectura

```
AuditorSQL/
├── backend/                  # Motor de IA y RAG (Python + FastAPI + LangChain)
│   ├── main.py               # Servidor FastAPI (puerto 3001)
│   ├── services/
│   │   └── rag_service.py    # Logica RAG: ingesta, recuperacion y generacion
│   ├── routes/
│   │   └── audit_routes.py   # Endpoints /api/audit/single y /api/audit/compare
│   ├── src/data/             # PDFs/manuales fuente
│   ├── .env / .env.template
│   └── requirements.txt
│
└── frontend/                 # Interfaz desktop web (Vite + React + Tailwind)
    ├── src/
    │   ├── components/
    │   │   └── AuditorPanel.jsx   # Pantalla dividida: input SQL y resultados
    │   ├── services/
    │   │   └── api.js             # Capa de comunicacion con FastAPI
    │   ├── App.jsx                # Layout principal con Navbar
    │   ├── index.css              # Estilos globales y tema Tailwind
    │   └── main.tsx               # Punto de entrada
    └── package.json
```

## Stack Tecnologico

| Capa       | Tecnologia                          |
|------------|-------------------------------------|
| Frontend   | React 19, Vite, Tailwind CSS 4      |
| Backend    | Python 3.10+, FastAPI, Uvicorn      |
| IA / RAG   | LangChain, Google Gemini, DeepSeek  |
| Vector DB  | FAISS (en disco)                    |
| Documentos | PDFs tecnicos parseados con PyPDF   |

## Endpoints de la API

| Metodo | Ruta                    | Descripcion                                |
|--------|------------------------|--------------------------------------------|
| POST   | `/api/audit/single`    | Auditoria con un solo modelo (Gemini o DeepSeek) |
| POST   | `/api/audit/compare`   | Benchmark comparativo entre ambos modelos  |
| GET    | `/health`              | Health check del servidor                  |

> La documentacion interactiva (Swagger UI) esta disponible en `http://localhost:3001/docs`

## Requisitos

- Python >= 3.10
- pip
- Node.js >= 18

## Inicio rapido

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
