from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

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


def create_audit_router(rag_service: RagService) -> APIRouter:
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

    return router
