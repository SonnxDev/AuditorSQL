import { Request, Response } from "express";
import { RagService } from "../services/ragService";

export function auditController(ragService: RagService) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { model, sql, target } = req.body;

      if (!sql || !target) {
        res.status(400).json({
          error: "Faltan campos requeridos: sql y target son obligatorios.",
        });
        return;
      }

      const modelName = model || "gemini-2.5-flash";
      const result = await ragService.auditSql(modelName, sql, target);

      res.json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error interno del motor RAG";
      console.error("[AuditController]", message);
      res.status(500).json({ error: message });
    }
  };
}
