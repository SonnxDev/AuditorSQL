"""
Punto de entrada del servidor FastAPI para AuditorSQL.

Inicializa la aplicación, configura CORS, registra los modelos LLM,
ingesta el documento PDF en el vector store FAISS durante el lifespan,
y monta las rutas de auditoría bajo el prefijo /api.
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.audit_routes import create_audit_router
from services.model_providers import register_all_models
from services.rag_service import RagService

load_dotenv()

register_all_models()
rag_service = RagService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[AuditorSQL] Ingiriendo documentos PDF...")
    await rag_service.ingest_document()
    print("[AuditorSQL] Vector store cargado en memoria.")
    yield


app = FastAPI(title="AuditorSQL Backend - RAG Engine", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    """Health check del servidor."""
    return {"status": "ok", "service": "AuditorSQL Backend - RAG Engine"}


app.include_router(create_audit_router(rag_service), prefix="/api")

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "3001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)