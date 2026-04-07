from datetime import datetime
from typing import Any, Dict, List

from pydantic import BaseModel, Field, field_validator


class SignupRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=8, max_length=64)
    confirm_password: str = Field(min_length=8, max_length=64)
    role: str = "user"

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized.split("@")[-1]:
            raise ValueError("Enter a valid email address.")
        return normalized

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, value: str, info):
        if info.data.get("password") != value:
            raise ValueError("Passwords do not match.")
        return value


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=120)
    password: str

    @field_validator("email")
    @classmethod
    def login_email(cls, value: str) -> str:
        return value.strip().lower()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    age: int | None = None
    gender: str | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    medical_history: str | None = None

    class Config:
        from_attributes = True


class PredictionInput(BaseModel):
    age: int = Field(ge=1, le=120)
    gender: str
    height_cm: float = Field(ge=50, le=250)
    weight_kg: float = Field(ge=10, le=300)
    blood_pressure: float = Field(ge=60, le=250)
    glucose_level: float = Field(ge=20, le=400)
    cholesterol: float = Field(ge=50, le=500)
    smoking: bool
    alcohol: bool
    physical_activity: str
    chest_pain: bool
    fatigue: bool
    shortness_of_breath: bool
    frequent_urination: bool


class AlgorithmResult(BaseModel):
    algorithm: str
    probability: float


class DiseasePrediction(BaseModel):
    disease: str
    probability: float
    risk_level: str
    health_score: float
    algorithms: List[AlgorithmResult]
    recommendations: List[str]


class PredictionResponse(BaseModel):
    prediction_group_id: str
    bmi: float
    overall_health_score: float
    overall_status: str
    generated_at: datetime
    results: List[DiseasePrediction]


class PredictionHistoryItem(BaseModel):
    id: int
    disease_type: str
    risk_score: float
    risk_level: str
    health_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class DiseaseHistoryResult(BaseModel):
    disease: str
    risk_score: float
    risk_level: str


class PredictionHistoryGroup(BaseModel):
    prediction_group_id: str
    date: datetime
    health_score: float
    health_status: str
    disease_results: List[DiseaseHistoryResult]


class DashboardSummary(BaseModel):
    welcome_message: str
    quick_stats: Dict[str, Any]
    previous_predictions: List[PredictionHistoryGroup]
    top_risks: List[Dict[str, Any]]
    charts: Dict[str, Any]


class UserProfileUpdate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    age: int | None = Field(default=None, ge=1, le=120)
    gender: str | None = None
    height_cm: float | None = Field(default=None, ge=50, le=250)
    weight_kg: float | None = Field(default=None, ge=10, le=300)
    medical_history: str | None = Field(default=None, max_length=2000)


TokenResponse.model_rebuild()
