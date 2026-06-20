from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Centralized Configuration Manager.
    Pydantic automatically reads these from the .env file and validates them.
    """
    database_url: str
    nats_url: str
    app_env: str = "development"
    debug: bool = False

    # Tell Pydantic to look for the .env file in the root directory
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"  # Ignores extra variables in the .env like POSTGRES_USER
    )

# Create a global instance to be imported across the application
settings = Settings()