from app.database import Base, engine
from app.schema_utils import ensure_schema
from app.seed import seed_defaults
from app.routers import auth, dashboard, history, predictions
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


Base.metadata.create_all(bind=engine)
ensure_schema()
seed_defaults()

app = FastAPI(
    title="AI Health Predictor API",
    version="1.0.0",
    description="Authentication, prediction, and analytics APIs for the AI multi-disease prediction platform.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(history.router, prefix="/api", tags=["History"])


@app.get("/")
def root() -> dict:
    return {
        "message": "AI Health Predictor API is running",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health")
def health_check() -> dict:
    return {"status": "ok"}
