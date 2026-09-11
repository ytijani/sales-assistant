"""
Central place for config. Nothing else in the app should call
os.environ directly — import `settings` from here instead, so every
required variable is documented in one spot.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Required starting now — the DB layer is wired in.
    agent_database_url: str = ""
    groq_api_key:str = ""


settings = Settings()