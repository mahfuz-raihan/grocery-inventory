from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str = "fallback_secret_key_change_me_in_env"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    default_admin_email: Optional[str] = None
    default_admin_password: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()