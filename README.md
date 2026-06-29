# AuditorSQL

Plataforma web full-stack para auditoría y optimización de consultas SQL, impulsada por **IA Agentiva** con técnica **RAG (Retrieval-Augmented Generation)**.

## Arquitectura

```
AuditorSQL/
├── backend/          # Motor de IA y RAG (Node.js + TypeScript + LangChain)
│   ├── src/
│   │   ├── controllers/    # Handlers HTTP
│   │   ├── routes/         # Definición de rutas Express
│   │   ├── services/       # Lógica de LangChain y RAG
│   │   ├── data/           # PDFs/manuales fuente
│   │   └── vector_store/   # Índices FAISS locales
│   ├── .env / .env.template
│   └── package.json
│
└── frontend/         # Interfaz desktop web (Vite + React + TypeScript + Tailwind)
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── hooks/
    │   └── services/
    └── package.json
```

## Stack Tecnológico

| Capa       | Tecnología                          |
|------------|-------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS |
| Backend    | Node.js, Express, TypeScript        |
| IA / RAG   | LangChain, OpenAI / Google GenAI    |
| Vector DB  | FAISS (local, sin dependencias cloud) |
| Documentos | PDFs técnicos parseados con pdf-parse |

## Flujo RAG

1. **Ingesta** → PDFs se parsean y fragmentan en chunks.
2. **Indexación** → Cada chunk se vectoriza y almacena en FAISS.
3. **Consulta** → El usuario envía una query SQL o pregunta.
4. **Recuperación** → Se buscan los chunks más relevantes por similitud coseno.
5. **Generación** → El LLM responde con el contexto recuperado (auditoría/optimización).

## Requisitos

- Node.js >= 18
- npm >= 9

## Inicio rápido

```bash
# Backend
cd backend
cp .env.template .env   # Configurar API keys
npm install
npm run dev

# Frontend (otra terminal)
cd frontend
npm install
npm run dev
```
