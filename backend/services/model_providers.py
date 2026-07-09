"""
Fábricas de modelos LLM.

Cada función construye y retorna una instancia de LangChain ChatModel
configurada con su API key, modelo y temperatura. Todas se registran
al final mediante register_all_models().
"""

import os

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from langchain_openai import ChatOpenAI

from services.model_registry import register_model


def _build_gemini() -> ChatGoogleGenerativeAI:
    """Gemini 2.5 Flash vía Google Generative AI."""
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.2,
    )


def _build_deepseek() -> ChatOpenAI:
    """DeepSeek Chat vía OpenRouter (usa OPENAI_API_KEY)."""
    return ChatOpenAI(
        model="deepseek/deepseek-chat",
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
        temperature=0.2,
    )


def _build_groq_llama_8b() -> ChatGroq:
    """Llama 3.1 8B Instant vía Groq."""
    return ChatGroq(
        model="llama-3.1-8b-instant",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0,
    )


def _build_qwen() -> ChatHuggingFace:
    """Qwen 2.5 Coder 7B Instruct vía HuggingFace Inference Endpoints."""
    return ChatHuggingFace(
        llm=HuggingFaceEndpoint(
            repo_id="Qwen/Qwen2.5-Coder-7B-Instruct",
            huggingfacehub_api_token=os.getenv("HUGGINGFACEHUB_API_TOKEN"),
            temperature=0,
            max_new_tokens=8192,
        )
    )


def register_all_models() -> None:
    """Registra todas las fábricas en el modelo registry."""
    register_model("gemini-2.5-flash", _build_gemini)
    register_model("deepseek-chat", _build_deepseek)
    register_model("qwen-2.5-coder", _build_qwen)
    register_model("groq-llama-3", _build_groq_llama_8b)