from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent
MODELS_DIR = ROOT_DIR / "models"
DATASET_DIR = ROOT_DIR / "dataset"
DATABASE_DIR = ROOT_DIR / "database"


class Settings(BaseSettings):
    app_name: str = "AI Health Predictor"
    secret_key: str = "change-this-secret-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    database_url: str = f"sqlite:///{(DATABASE_DIR / 'health_predictor.db').as_posix()}"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
DATABASE_DIR.mkdir(parents=True, exist_ok=True)
