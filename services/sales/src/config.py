from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Securely loads environment variables without exposing fallbacks in code."""
    database_url: str
    nats_url: str

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()