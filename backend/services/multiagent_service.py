"""
Pipeline secuencial multiagente para auditoría SQL.

Ejecuta 4 modelos LLM en cadena:
  1. Planificador (Gemini) — genera un plan estratégico con ayuda del RAG.
  2. Desarrollador (Qwen) — escribe el SQL optimizado según el plan.
  3. Revisor (Llama 3) — comenta brevemente el rendimiento del SQL.
  4. Auditor Final (DeepSeek) — emite el dictamen estructurado final.

Cada prompt del pipeline está diseñado para una tarea específica.
El cómputo de tokens es acumulativo (input + output de cada paso).
"""

import time

from langchain_core.messages import HumanMessage

from services.model_registry import build_model


PLANNER_PROMPT = """Eres un Arquitecto de Bases de Datos Senior. Se te ha dado un CONTEXTO con reglas de optimización y la consulta SQL del usuario.

CONTEXTO:
{context}

SQL ORIGINAL:
{sql}

OBJETIVO:
{target}

Analiza el contexto y el SQL. Genera un plan de acción estratégico detallado (máximo 3 párrafos) que servirá como guía para optimizar esta consulta. Céntrate en:
- Índices faltantes o subutilizados
- Reescribir JOINs o subconsultas problemáticas
- Sugerencias de filtrado y particionado
- Cualquier otra oportunidad de mejora

Devuelve ÚNICAMENTE el plan de acción, sin texto adicional.
PLAN DE ACCIÓN:"""


DEVELOPER_PROMPT = """Eres un desarrollador SQL experto. Recibes un SQL original y un plan de acción estratégico. Tu tarea es escribir la consulta SQL optimizada siguiendo el plan al pie de la letra.

SQL ORIGINAL:
{sql}

PLAN DE ACCIÓN:
{plan}

Devuelve ÚNICAMENTE el SQL optimizado, sin explicaciones ni bloques markdown. Solo el código SQL puro.
SQL OPTIMIZADO:"""


REVIEWER_PROMPT = """Eres un revisor de bases de datos. Recibes una consulta SQL propuesta y debes hacer una revisión rápida de rendimiento.

SQL OPTIMIZADO:
{sql}

Devuelve comentarios breves (máximo 3 líneas) sobre posibles problemas de rendimiento, seguridad o legibilidad. Si todo está bien, indícalo.
REVISIÓN:"""


FINAL_AUDITOR_PROMPT = """Eres un Auditor SQL Senior. Recibes el historial completo de un proceso de optimización multiagente.

PLAN DE ACCIÓN:
{plan}

SQL OPTIMIZADO (por Qwen):
{qwen_sql}

REVISIÓN (por Groq Llama):
{llama_review}

CONTEXTO RAG:
{context}

SQL ORIGINAL:
{sql}

OBJETIVO:
{target}

Evalúa todo el proceso y emite el dictamen final usando EXACTAMENTE el siguiente formato:

DIAGNÓSTICO: [Explica problemas de rendimiento, legibilidad y seguridad]

ESTRATEGIA: [Describe paso a paso la optimización aplicada]

SQL OPTIMIZADO: [Consulta corregida y optimizada final]"""


def _estimate_tokens(text: str) -> int:
    """Estima la cantidad de tokens a partir de caracteres (~4 chars/token)."""
    return max(1, round(len(text) / 4))


async def execute_multiagent_pipeline(
    sql: str,
    target: str,
    rag_service,
) -> dict:
    """Ejecuta el pipeline multiagente completo de forma secuencial.

    Args:
        sql: Consulta SQL original a auditar.
        target: Objetivo de la auditoría.
        rag_service: Instancia de RagService con el vector store cargado.

    Returns:
        dict con las salidas de cada paso (gemini_plan, qwen_sql, llama_review,
        final_result) más tiempo total y tokens acumulados.
    """
    overall_start = time.perf_counter()

    retrieved = await rag_service._retrieve_context(sql)
    context = retrieved["context"]

    total_tokens = 0

    plan = ""
    qwen_sql = ""
    llama_review = ""

    # Paso 1: Planificador (Gemini)
    planner = build_model("gemini-2.5-flash")
    prompt_1 = PLANNER_PROMPT.format(context=context, sql=sql, target=target)
    plan_response = await planner.ainvoke(prompt_1)
    plan = plan_response.content if isinstance(plan_response.content, str) else ""
    total_tokens += _estimate_tokens(prompt_1) + _estimate_tokens(plan)

    # Paso 2: Desarrollador (Qwen)
    developer = build_model("qwen-2.5-coder")
    prompt_2 = DEVELOPER_PROMPT.format(sql=sql, plan=plan)
    dev_response = await developer.ainvoke(prompt_2)
    qwen_sql = dev_response.content if isinstance(dev_response.content, str) else ""
    total_tokens += _estimate_tokens(prompt_2) + _estimate_tokens(qwen_sql)

    # Paso 3: Revisor (Groq Llama)
    reviewer = build_model("groq-llama-3")
    prompt_3 = REVIEWER_PROMPT.format(sql=qwen_sql)
    review_response = await reviewer.ainvoke(prompt_3)
    llama_review = review_response.content if isinstance(review_response.content, str) else ""
    total_tokens += _estimate_tokens(prompt_3) + _estimate_tokens(llama_review)

    # Paso 4: Auditor Final (DeepSeek)
    final_auditor = build_model("deepseek-chat")
    prompt_4 = FINAL_AUDITOR_PROMPT.format(
        plan=plan,
        qwen_sql=qwen_sql,
        llama_review=llama_review,
        context=context,
        sql=sql,
        target=target,
    )
    final_response = await final_auditor.ainvoke(prompt_4)
    final_result = final_response.content if isinstance(final_response.content, str) else ""
    total_tokens += _estimate_tokens(prompt_4) + _estimate_tokens(final_result)

    elapsed = round(time.perf_counter() - overall_start, 4)

    return {
        "gemini_plan": plan,
        "qwen_sql": qwen_sql,
        "llama_review": llama_review,
        "final_result": final_result,
        "time": elapsed,
        "tokens": total_tokens,
    }