import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import path from "path";

export interface AuditResult {
  diagnosis: string;
  strategy: string;
  optimizedSql: string;
  executionTime: number;
}

export class RagService {
  private vectorStore: MemoryVectorStore | null = null;

  async ingestDocument(filePath?: string): Promise<void> {
    const resolvedPath = path.resolve(
      process.cwd(),
      filePath ?? "src/data/manual_sql.pdf"
    );

    const loader = new PDFLoader(resolvedPath);
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.splitDocuments(docs);

    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "gemini-embedding-001",
      apiKey: process.env.GEMINI_API_KEY,
    });

    this.vectorStore = await MemoryVectorStore.fromDocuments(
      chunks,
      embeddings
    );
  }

  async auditSql(
    modelName: string,
    sql: string,
    target: string
  ): Promise<AuditResult> {
    if (!this.vectorStore) {
      throw new Error(
        "Vector store no inicializado. Ejecuta ingestDocument primero."
      );
    }

    const start = performance.now();

    const retriever = this.vectorStore.asRetriever(4);
    const relevantDocs = await retriever.invoke(sql);
    const context = relevantDocs
      .map((d) => d.pageContent)
      .join("\n\n");

    const model = new ChatGoogleGenerativeAI({
      model: modelName,
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.2,
    });

    const prompt = PromptTemplate.fromTemplate(
      `Eres un Arquitecto de Bases de Datos Senior especializado en optimización SQL.
Debes auditar la consulta proporcionada usando el contexto técnico disponible.

Contexto relevante:
{context}

Consulta SQL original:
{sql}

Objetivo de la auditoría:
{target}

Responde ÚNICAMENTE con el siguiente formato exacto, sin añadir texto adicional:

DIAGNÓSTICO: [Explica problemas de rendimiento, legibilidad y seguridad]

ESTRATEGIA: [Describe paso a paso la optimización aplicada]

SQL OPTIMIZADO: [Consulta corregida y optimizada]`
    );

    const chain = prompt.pipe(model);
    const response = await chain.invoke({ context, sql, target });

    const executionTime = performance.now() - start;
    const content =
      typeof response.content === "string"
        ? response.content
        : response.content.map((c) => ("text" in c ? c.text : "")).join("");

    return this.parseResponse(content, executionTime);
  }

  private parseResponse(content: string, executionTime: number): AuditResult {
    const diagnosis = RagService.extractSection(content, "DIAGNÓSTICO");
    const strategy = RagService.extractSection(content, "ESTRATEGIA");
    const optimizedSql = RagService.extractSection(content, "SQL OPTIMIZADO");

    return { diagnosis, strategy, optimizedSql, executionTime };
  }

  private static extractSection(text: string, sectionName: string): string {
    const escaped = sectionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `${escaped}:\\s*([\\s\\S]*?)(?=\\n[\\wÀ-ÿ]+:|$)`,
      "i"
    );
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  }
}
