import asyncio
import os
import time
from typing import Any

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_openai import ChatOpenAI


ADMIN_FILTERS = [
    "Índice de Contenidos",
    "Registro de Cambios",
    "Certificado ISO",
    "Paola Juárez",
]

SUPER_PROMPT_TEMPLATE = """Eres un Arquitecto de Bases de Datos Senior especializado en optimización SQL.
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

SQL OPTIMIZADO: [Consulta corregida y optimizada]"""


def _is_admin_page(text: str) -> bool:
    return any(kw in text for kw in ADMIN_FILTERS)


def _estimate_tokens(text: str) -> int:
    return max(1, round(len(text) / 4))


def _build_deepseek_model() -> ChatOpenAI:
    api_key = os.getenv("DEEPSEEK_API_KEY") or os.getenv("OPENAI_API_KEY")
    base_url = (
        "https://api.deepseek.com/v1"
        if os.getenv("DEEPSEEK_API_KEY")
        else "https://openrouter.ai/api/v1"
    )
    model = "deepseek-chat" if os.getenv("DEEPSEEK_API_KEY") else "deepseek/deepseek-chat"
    return ChatOpenAI(
        model=model,
        api_key=api_key,
        base_url=base_url,
        temperature=0.2,
    )


def _build_model(model_name: str) -> Any:
    if model_name == "gemini-2.5-flash":
        return ChatGoogleGenerativeAI(
            model=model_name,
            api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.2,
        )
    if model_name == "deepseek-chat":
        return _build_deepseek_model()
    raise ValueError(f"Modelo no soportado: {model_name}")


class RagService:
    def __init__(self) -> None:
        self.vector_store: InMemoryVectorStore | None = None
        self.prompt_template = PromptTemplate.from_template(SUPER_PROMPT_TEMPLATE)

    async def ingest_document(self, file_path: str | None = None) -> None:
        resolved = file_path or "src/data/manual_sql.pdf"

        loader = PyPDFLoader(resolved)
        docs = await loader.aload()

        cleaned = [doc for doc in docs if not _is_admin_page(doc.page_content)]

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=150,
        )
        chunks = splitter.split_documents(cleaned)

        embeddings = GoogleGenerativeAIEmbeddings(
            model="gemini-embedding-001",
            google_api_key=os.getenv("GEMINI_API_KEY"),
        )

        self.vector_store = await InMemoryVectorStore.afrom_documents(
            chunks, embeddings
        )

    async def _retrieve_context(self, sql: str) -> dict[str, Any]:
        if self.vector_store is None:
            raise RuntimeError(
                "Vector store no inicializado. Ejecuta ingest_document primero."
            )

        retriever = self.vector_store.as_retriever(search_kwargs={"k": 4})
        relevant_docs = await retriever.ainvoke(sql)

        context = "\n\n".join(d.page_content for d in relevant_docs)
        sources = [d.page_content for d in relevant_docs]

        return {"context": context, "sources": sources}

    async def execute_single_audit(
        self, model_name: str, sql: str, target: str
    ) -> dict[str, Any]:
        start = time.perf_counter()

        retrieved = await self._retrieve_context(sql)
        model = _build_model(model_name)
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
        self, sql: str, target: str
    ) -> dict[str, Any]:
        retrieved = await self._retrieve_context(sql)

        gemini_model = _build_model("gemini-2.5-flash")
        deepseek_model = _build_model("deepseek-chat")

        gemini_chain = self.prompt_template | gemini_model
        deepseek_chain = self.prompt_template | deepseek_model

        async def _run(chain: Any) -> dict[str, Any]:
            start = time.perf_counter()
            response = await chain.ainvoke({
                "context": retrieved["context"],
                "sql": sql,
                "target": target,
            })
            elapsed = time.perf_counter() - start
            result = response.content if isinstance(response.content, str) else ""
            tokens = _estimate_tokens(result)
            return {
                "result": result,
                "time": round(elapsed, 4),
                "tokens": tokens,
            }

        gemini_result, deepseek_result = await asyncio.gather(
            _run(gemini_chain), _run(deepseek_chain)
        )

        return {
            "gemini": gemini_result,
            "deepseek": deepseek_result,
            "sources": retrieved["sources"],
        }
