import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { RagService } from "./services/ragService";
import { createAuditRoutes } from "./routes/auditRoutes";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

async function bootstrap(): Promise<void> {
  const ragService = new RagService();

  try {
    console.log("[AuditorSQL] Ingiriendo documento PDF...");
    await ragService.ingestDocument();
    console.log("[AuditorSQL] Vector store cargado en memoria.");
  } catch (error) {
    console.error("[AuditorSQL] ERROR al ingerir PDF:", error);
    process.exit(1);
  }

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "AuditorSQL Backend - RAG Engine" });
  });

  app.use(createAuditRoutes(ragService));

  app.listen(PORT, () => {
    console.log(`[AuditorSQL] Backend corriendo en http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("[AuditorSQL] Error fatal:", error);
  process.exit(1);
});