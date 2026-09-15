from langchain_core.language_models.chat_models import BaseChatModel
from langchain_groq import ChatGroq
from pydantic import SecretStr

from app.config import settings




def get_llm() -> BaseChatModel:
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY is required in .env")
    if not settings.groq_model:
        raise ValueError("GROQ_MODEL is required in .env (e.g. GROQ_MODEL=llama-3.3-70b-versatile)")

    kwargs: dict = {
        "model": settings.groq_model,
        "temperature": 0,
        "api_key": SecretStr(settings.groq_api_key),
    }

    # Only pass reasoning_effort to models that support it (e.g. gpt-oss, deepseek-r1)
    if any(m in settings.groq_model.lower() for m in ("gpt-oss", "r1")):
        kwargs["reasoning_effort"] = "low"

    return ChatGroq(**kwargs)
    
    