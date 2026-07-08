import os

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

from services.model_registry import register_model


def _build_gemini() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.2,
    )


def _build_deepseek() -> ChatOpenAI:
    api_key = os.getenv("DEEPSEEK_API_KEY") or os.getenv("OPENAI_API_KEY")
    base_url = (
        "https://api.deepseek.com/v1"
        if os.getenv("DEEPSEEK_API_KEY")
        else "https://openrouter.ai/api/v1"
    )
    model = (
        "deepseek-chat"
        if os.getenv("DEEPSEEK_API_KEY")
        else "deepseek/deepseek-chat"
    )
    return ChatOpenAI(
        model=model,
        api_key=api_key,
        base_url=base_url,
        temperature=0.2,
    )


def _build_groq_llama() -> ChatOpenAI:
    return ChatOpenAI(
        model="llama3-70b-8192",
        api_key=os.getenv("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1",
        temperature=0.2,
    )


def _build_openrouter() -> ChatOpenAI:
    return ChatOpenAI(
        model=os.getenv("OPENROUTER_MODEL", "mistralai/mistral-7b-instruct"),
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
        temperature=0.2,
    )


def register_all_models() -> None:
    register_model("gemini-2.5-flash", _build_gemini)
    register_model("deepseek-chat", _build_deepseek)
    register_model("groq-llama-3-70b", _build_groq_llama)
    register_model("openrouter", _build_openrouter)
