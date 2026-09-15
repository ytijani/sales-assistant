"""
Central place for config. Nothing else in the app should call
os.environ directly — import `settings` from here instead, so every
required variable is documented in one spot.
"""

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict


# LangChain/LangGraph reads LangSmith configuration directly from the process
# environment, so load local development secrets before either client is built.
load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    agent_database_url: str | None = None
    groq_api_key: str | None = None
    groq_model: str | None = None


settings = Settings()
