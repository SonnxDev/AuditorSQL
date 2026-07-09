"""
Servicio RAG (Retrieval-Augmented Generation) para AuditorSQL.

Gestiona la ingesta de documentos PDF en un vector store FAISS con embeddings
locales de HuggingFace, la recuperación de contexto relevante y la ejecución
de auditorías individuales o comparativas contra múltiples modelos LLM.
"""

import asyncio
import glob
import os
import time
from typing import Any

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings

from services.model_registry import build_model, list_models

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
folder_path = os.path.join(BASE_DIR, "src", "data")
index_path = os.path.join(BASE_DIR, "src", "faiss_index")

ADMIN_FILTERS = [
    "Índice de Contenidos",
    "Registro de Cambios",
    "Certificado ISO",
    "Paola Juárez",
    "Historial de Revisiones",
    "Oficina Técnica para la Gestión",
]

SUPER_PROMPT_TEMPLATE = """Eres un Ingeniero de Base de Datos Senior y un Auditor SQL implacable. A continuación, se te proporcionará un CONTEXTO extraído de un manual de bases de datos. TU DEBER ES EVALUAR ESTE CONTEXTO. Si el contexto proporcionado NO es directamente útil o relevante para optimizar o corregir la consulta SQL del usuario, TIENES ESTRICTAMENTE PROHIBIDO usarlo. En ese caso, IGNORA EL CONTEXTO POR COMPLETO y utiliza tu propio conocimiento experto para resolver el problema.

Contexto proporcionado:
{context}

Consulta SQL a auditar:
{sql}

Objetivo de la auditoría:
{target}

Responde ÚNICAMENTE con el siguiente formato exacto, sin añadir texto adicional. Es obligatorio que el último campo indique si usaste el contexto o no.

DIAGNÓSTICO: [Explica problemas de rendimiento, legibilidad y seguridad]

ESTRATEGIA: [Describe paso a paso la optimización aplicada]

SQL OPTIMIZADO: [Consulta corregida y optimizada]

USO_DE_RAG: [Responde estrictamente "SI" o "NO"]"""


def _is_admin_page(text: str) -> bool:
    """Determina si una página del PDF es administrativa y debe omitirse."""
    return any(kw in text for kw in ADMIN_FILTERS)


def _estimate_tokens(text: str) -> int:
    """Estima la cantidad de tokens a partir del largo del texto."""
    return max(1, round(len(text) / 4))


class RagService:
    """Servicio principal de RAG: ingesta, recuperación y auditoría."""

    def __init__(self) -> None:
        self.vector_store: FAISS | None = None
        self.prompt_template = PromptTemplate.from_template(SUPER_PROMPT_TEMPLATE)

    async def ingest_document(self) -> None:
        """Ingesta documentos PDF en el vector store FAISS.

        Si ya existe un índice, lo reanuda saltando los chunks ya procesados.
        Procesa los PDFs en lotes de 50 chunks, guardando cada lote en disco.
        """
        embeddings = HuggingFaceEmbeddings(
            model_name="paraphrase-multilingual-MiniLM-L12-v2",
        )

        faiss_index_file = os.path.join(index_path, "index.faiss")
        ntotal = 0
        if os.path.exists(faiss_index_file):
            self.vector_store = FAISS.load_local(
                index_path, embeddings, allow_dangerous_deserialization=True
            )
            ntotal = self.vector_store.index.ntotal
            print(f"[AuditorSQL] Índice existente con {ntotal} vectores. Reanudando ingesta...")

        pdf_paths = glob.glob(os.path.join(folder_path, "*.pdf"))
        if not pdf_paths:
            raise FileNotFoundError(
                f"No se encontraron archivos PDF en '{folder_path}'."
            )

        all_chunks: list[Any] = []

        for pdf_path in pdf_paths:
            loader = PyPDFLoader(pdf_path)
            docs = await loader.aload()

            cleaned = [doc for doc in docs if not _is_admin_page(doc.page_content)]

            splitter = RecursiveCharacterTextSplitter(
                chunk_size=750,
                chunk_overlap=150,
                separators=["\n\n", "\n", " ", ""],
            )
            chunks = splitter.split_documents(cleaned)
            all_chunks.extend(chunks)

        BATCH_SIZE = 50
        remaining_chunks = all_chunks[ntotal:]
        total_chunks = len(remaining_chunks)

        if total_chunks == 0:
            print("[AuditorSQL] Todos los chunks ya están procesados.")
            return

        total_batches = (total_chunks + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"[AuditorSQL] Procesando {total_chunks} chunks nuevos en {total_batches} lotes de {BATCH_SIZE}...")

        for i in range(0, total_chunks, BATCH_SIZE):
            batch = remaining_chunks[i:i + BATCH_SIZE]
            batch_num = i // BATCH_SIZE + 1

            if self.vector_store is None:
                self.vector_store = FAISS.from_documents(batch, embeddings)
            else:
                self.vector_store.add_documents(batch)

            self.vector_store.save_local(index_path)
            print(f"[AuditorSQL] Lote {batch_num}/{total_batches} procesado y guardado ({len(batch)} chunks).")

        print(f"[AuditorSQL] Ingesta completa. Índice FAISS en {index_path}.")

    async def _retrieve_context(self, sql: str) -> dict[str, Any]:
        """Recupera los fragmentos más relevantes del vector store.

        Args:
            sql: Consulta SQL usada como query de búsqueda.

        Returns:
            dict con 'context' (texto concatenado) y 'sources' (lista de fragmentos).
        """
        if self.vector_store is None:
            raise RuntimeError(
                "Vector store no inicializado. Ejecuta ingest_document primero."
            )

        retriever = self.vector_store.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 5, "fetch_k": 20},
        )
        relevant_docs = await retriever.ainvoke(sql)

        context = "\n\n".join(d.page_content for d in relevant_docs)
        sources = [d.page_content for d in relevant_docs]

        return {"context": context, "sources": sources}

    async def execute_single_audit(
        self, model_name: str, sql: str, target: str
    ) -> dict[str, Any]:
        """Ejecuta una auditoría con un solo modelo LLM.

        Recupera contexto RAG, construye la cadena LLM y devuelve
        el resultado con métricas de tiempo y tokens.
        """
        start = time.perf_counter()

        retrieved = await self._retrieve_context(sql)
        model = build_model(model_name)
        chain = self.prompt_template | model
        response = await chain.ainvoke({
            "context": retrieved["context"],
            "sql": sql,
            "target": target,
        })

        elapsed = time.perf_counter() - start
        result = response.content if isinstance(response.content, str) else ""
        tokens = _estimate_tokens(result)

        return {
            "model": model_name,
            "result": result,
            "time": round(elapsed, 4),
            "tokens": tokens,
            "sources": retrieved["sources"],
        }

    async def execute_comparative_audit(
        self,
        sql: str,
        target: str,
        models: list[str] | None = None,
    ) -> dict[str, Any]:
        """Ejecuta una auditoría comparativa con múltiples modelos en paralelo.

        Cada modelo recibe el mismo contexto RAG y se ejecuta via asyncio.gather.
        El resultado incluye si cada modelo usó o no el contexto RAG.
        """
        if models is None:
            models = list_models()

        retrieved = await self._retrieve_context(sql)

        async def _run_model(name: str) -> tuple[str, dict[str, Any]]:
            model = build_model(name)
            chain = self.prompt_template | model
            start = time.perf_counter()
            response = await chain.ainvoke({
                "context": retrieved["context"],
                "sql": sql,
                "target": target,
            })
            elapsed = time.perf_counter() - start
            result = response.content if isinstance(response.content, str) else ""
            tokens = _estimate_tokens(result)
            rag_utilizado = "USO_DE_RAG: SI" in result.upper()
            result_limpio = result.split("USO_DE_RAG:")[0].strip()
            return name, {
                "result": result_limpio,
                "time": round(elapsed, 4),
                "tokens": tokens,
                "rag_utilizado": rag_utilizado,
            }

        results = await asyncio.gather(*[_run_model(m) for m in models])

        return {
            "results": dict(results),
            "models": models,
            "sources": retrieved["sources"],
        }