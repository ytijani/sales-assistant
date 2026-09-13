from langchain_core.language_models.chat_models import BaseChatModel
from langchain_groq import ChatGroq
from pydantic import SecretStr

from app.config import settings




def get_llm() -> BaseChatModel:
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY is required when llm_provider='groq'")
    return ChatGroq(
    model="openai/gpt-oss-20b",
    temperature=0,
    api_key=SecretStr(settings.groq_api_key or ""),
    reasoning_effort="low"
    )
    
    