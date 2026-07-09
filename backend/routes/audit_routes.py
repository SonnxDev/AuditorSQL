"""
Rutas HTTP para los endpoints de auditoría de AuditorSQL.

Define los modelos Pydantic de request y los tres endpoints:
- POST /audit/single  → auditoría con un modelo
- POST /audit/compare → auditoría comparativa (paralelo)
- POST /audit/multiagent → pipeline multiagente (secuencial)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.multiagent_service import execute_multiagent_pipeline
from services.rag_service import RagService


class SingleAuditRequest(BaseModel):
    model: str = "gemini-2.5-flash"
    sql: str
    target: str
    schema_ddl: str | None = None


class ComparativeAuditRequest(BaseModel):
    sql: str
    target: str
    models: list[str] | None = None
    schema_ddl: str | None = None


class MultiAgentRequest(BaseModel):
    sql: str
    target: str
    schema_ddl: str | None = None


def create_audit_router(rag_service: RagService) -> APIRouter:
    """Crea y retorna un router con los endpoints de auditoría.

    Args:
        rag_service: Instancia compartida de RagService inyectada desde main.py.

    Returns:
        APIRouter configurado con las rutas de auditoría.
    """
    router = APIRouter()

    @router.post("/audit/single")
    async def single_audit(body: SingleAuditRequest):
        if not body.sql or not body.target:
            raise HTTPException(
                status_code=400,
                detail="Faltan campos requeridos: sql y target son obligatorios.",
            )
        try:
            return await rag_service.execute_single_audit(
                body.model, body.sql, body.target
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.post("/audit/compare")
    async def comparative_audit(body: ComparativeAuditRequest):
        if not body.sql or not body.target:
            raise HTTPException(
                status_code=400,
                detail="Faltan campos requeridos: sql y target son obligatorios.",
            )
        try:
            return await rag_service.execute_comparative_audit(
                body.sql, body.target, body.models
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.post("/audit/multiagent")
    async def multiagent_audit(body: MultiAgentRequest):
        if not body.sql or not body.target:
            raise HTTPException(
                status_code=400,
                detail="Faltan campos requeridos: sql y target son obligatorios.",
            )
        try:
            return await execute_multiagent_pipeline(
                body.sql, body.target, rag_service
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    return router