import { Router } from "express";
import { RagService } from "../services/ragService";
import { auditController } from "../controllers/auditController";

export function createAuditRoutes(ragService: RagService): Router {
  const router = Router();
  router.post("/api/audit", auditController(ragService));
  return router;
}
