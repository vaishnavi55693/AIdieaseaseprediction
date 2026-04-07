import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import MODELS_DIR
from app.database import SessionLocal
from app.ml import DISEASES, load_metadata
from app.models import ModelRegistry, Role


def seed_defaults() -> None:
    db: Session = SessionLocal()
    try:
        for role_name in ["admin", "user"]:
            if not db.query(Role).filter(Role.name == role_name).first():
                db.add(Role(name=role_name))
        db.commit()

        metadata = load_metadata()
        for disease, algorithms in DISEASES.items():
            for algorithm in algorithms:
                artifact_path = (MODELS_DIR / f"{disease.lower().replace(' ', '_')}_{algorithm}.joblib").as_posix()
                existing = (
                    db.query(ModelRegistry)
                    .filter(ModelRegistry.disease_name == disease, ModelRegistry.algorithm == algorithm)
                    .first()
                )
                if existing:
                    continue
                metrics = metadata.get(disease, {}).get(algorithm, {"accuracy": None})
                db.add(
                    ModelRegistry(
                        disease_name=disease,
                        algorithm=algorithm.replace("_", " ").title(),
                        artifact_path=artifact_path,
                        metrics_json=json.dumps(metrics),
                    )
                )
        db.commit()
    finally:
        db.close()
