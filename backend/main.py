import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.audit_routes import create_audit_router
from services.rag_service import RagService

load_dotenv()

app = FastAPI(title="AuditorSQL Backend - RAG Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_service = RagService()


@app.on_event("startup")
async def startup():
    print("[AuditorSQL] Ingiriendo documento PDF...")
    await rag_service.ingest_document()
    print("[AuditorSQL] Vector store cargado en memoria.")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "AuditorSQL Backend - RAG Engine"}


app.include_router(create_audit_router(rag_service), prefix="/api")

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "3001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
