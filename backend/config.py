from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "HazardWatch API"
    DEBUG: bool = False
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "hazardwatch"
    GROQ_API_KEY: str = ""
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
