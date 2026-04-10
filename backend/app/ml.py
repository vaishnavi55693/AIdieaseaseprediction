import json
from pathlib import Path
from typing import Dict, List

import joblib
import numpy as np

from app.config import MODELS_DIR


DISEASES = {
    "Heart Disease": ["logistic_regression", "random_forest", "decision_tree", "svm"],
    "Diabetes": ["logistic_regression", "random_forest", "decision_tree", "svm"],
    "Kidney Disease": ["logistic_regression", "random_forest", "decision_tree", "svm"],
    "Lung Disease": ["logistic_regression", "random_forest", "decision_tree", "svm"],
    "Liver Disease": ["logistic_regression", "random_forest", "decision_tree", "svm"],
}

MODEL_CACHE: Dict[str, Dict[str, object]] = {}
METADATA_CACHE: Dict[str, dict] = {}


def _artifact_name(disease: str, algorithm: str) -> str:
    safe_disease = disease.lower().replace(" ", "_")
    return f"{safe_disease}_{algorithm}.joblib"


def load_metadata() -> dict:
    global METADATA_CACHE
    if METADATA_CACHE:
        return METADATA_CACHE
    metadata_file = MODELS_DIR / "model_metrics.json"
    if metadata_file.exists():
        METADATA_CACHE = json.loads(metadata_file.read_text(encoding="utf-8"))
    else:
        METADATA_CACHE = {}
    return METADATA_CACHE


def load_models() -> Dict[str, Dict[str, object]]:
    global MODEL_CACHE
    if MODEL_CACHE:
        return MODEL_CACHE

    model_map: Dict[str, Dict[str, object]] = {}
    for disease, algorithms in DISEASES.items():
        disease_models: Dict[str, object] = {}
        for algorithm in algorithms:
            artifact = MODELS_DIR / _artifact_name(disease, algorithm)
            if artifact.exists():
                try:
                    disease_models[algorithm] = joblib.load(artifact)
                except Exception:
                    continue
        model_map[disease] = disease_models

    MODEL_CACHE = model_map
    return MODEL_CACHE


def build_feature_vector(payload: dict) -> List[float]:
    bmi = payload["weight_kg"] / ((payload["height_cm"] / 100) ** 2)
    gender_flag = 1 if payload["gender"].lower() == "male" else 0
    activity_map = {"low": 0, "moderate": 1, "high": 2}
    return [
        payload["age"],
        gender_flag,
        round(bmi, 2),
        payload["blood_pressure"],
        payload["glucose_level"],
        payload["cholesterol"],
        int(payload["smoking"]),
        int(payload["alcohol"]),
        activity_map.get(payload["physical_activity"].lower(), 1),
        int(payload["chest_pain"]),
        int(payload["fatigue"]),
        int(payload["shortness_of_breath"]),
        int(payload["frequent_urination"]),
    ]


def predict_all(payload: dict) -> dict:
    features = build_feature_vector(payload)
    bmi = features[2]
    feature_array = np.array(features).reshape(1, -1)
    models = load_models()

    results = []
    for disease, disease_models in models.items():
        algorithm_results = []
        probabilities = []
        heuristic = heuristic_probability(disease, payload, bmi)
        for algorithm, model in disease_models.items():
            try:
                probability = float(model.predict_proba(feature_array)[0][1]) * 100
                algorithm_results.append({"algorithm": algorithm.replace("_", " ").title(), "probability": round(probability, 2)})
                probabilities.append(probability)
            except Exception:
                continue

        if not probabilities:
            algorithm_results = [{"algorithm": "Fallback Health Heuristic", "probability": heuristic}]
            probabilities = [heuristic]
            average_probability = heuristic
        else:
            model_average = sum(probabilities) / len(probabilities)
            average_probability = round(max(model_average, heuristic), 2)
            algorithm_results.append({"algorithm": "Risk Override Heuristic", "probability": round(heuristic, 2)})

        if average_probability >= 70:
            risk_level = "High Risk"
        elif average_probability >= 40:
            risk_level = "Medium Risk"
        else:
            risk_level = "Low Risk"

        health_score = round(max(5, 100 - average_probability), 2)
        recommendations = generate_recommendations(disease, payload, average_probability)
        results.append(
            {
                "disease": disease,
                "probability": average_probability,
                "risk_level": risk_level,
                "health_score": health_score,
                "algorithms": algorithm_results,
                "recommendations": recommendations,
            }
        )

    overall_health_score = calculate_overall_health_score(results)
    return {
        "bmi": round(bmi, 2),
        "overall_health_score": overall_health_score,
        "overall_status": classify_health_score(overall_health_score),
        "results": results,
    }


def weighted_risk_scores(payload: dict) -> dict:
    """
    Lightweight, transparent risk scoring (0-100) based on the same input
    fields used by the frontend form. This is used by the API endpoint that
    returns a simplified risk object for each disease.
    """
    height_cm = float(payload.get("height_cm") or 0)
    weight_kg = float(payload.get("weight_kg") or 0)
    age = int(payload.get("age") or 0)
    bp = float(payload.get("blood_pressure") or 0)
    glucose = float(payload.get("glucose_level") or 0)
    cholesterol = float(payload.get("cholesterol") or 0)

    smoking = bool(payload.get("smoking"))
    alcohol = bool(payload.get("alcohol"))
    chest_pain = bool(payload.get("chest_pain"))
    fatigue = bool(payload.get("fatigue"))
    shortness_of_breath = bool(payload.get("shortness_of_breath"))
    frequent_urination = bool(payload.get("frequent_urination"))

    bmi = 0.0
    if height_cm > 0:
        bmi = weight_kg / ((height_cm / 100) ** 2)

    high_bp = bp >= 140
    high_chol = cholesterol >= 200
    high_bmi = bmi > 25
    diabetes_flag = glucose > 120

    heart = 0
    if age > 45:
        heart += 15
    if high_bp:
        heart += 20
    if high_chol:
        heart += 20
    if smoking:
        heart += 20
    if chest_pain:
        heart += 25

    diabetes = 0
    if glucose > 120:
        diabetes += 30
    if bmi > 25:
        diabetes += 20
    if age > 40:
        diabetes += 15
    if frequent_urination:
        diabetes += 20
    if fatigue:
        diabetes += 15

    kidney = 0
    if high_bp:
        kidney += 25
    if diabetes_flag:
        kidney += 25
    if age > 50:
        kidney += 20
    if fatigue:
        kidney += 15

    lung = 0
    if smoking:
        lung += 30
    if shortness_of_breath:
        lung += 25
    if fatigue:
        lung += 15

    liver = 0
    if alcohol:
        liver += 30
    if high_bmi:
        liver += 20
    if fatigue:
        liver += 15

    def clamp(value: float) -> int:
        return int(min(100, max(0, round(value))))

    return {
        "heart": clamp(heart),
        "diabetes": clamp(diabetes),
        "kidney": clamp(kidney),
        "lung": clamp(lung),
        "liver": clamp(liver),
    }


def weighted_health_score(risks: dict) -> int:
    values = [float(risks.get(key, 0)) for key in ("heart", "diabetes", "kidney", "lung", "liver")]
    average_risk = sum(values) / len(values) if values else 0.0
    return int(round(max(0, min(100, 100 - average_risk))))


def heuristic_probability(disease: str, payload: dict, bmi: float) -> float:
    score = 12.0
    score += max(payload["age"] - 30, 0) * 0.9
    score += max(payload["blood_pressure"] - 120, 0) * 0.85
    score += max(payload["glucose_level"] - 100, 0) * 0.75
    score += max(payload["cholesterol"] - 180, 0) * 0.22
    score += max(bmi - 24, 0) * 3.4
    score += 16 if payload["smoking"] else 0
    score += 13 if payload["alcohol"] else 0
    score += 10 if payload["fatigue"] else 0
    score += 16 if payload["shortness_of_breath"] else 0
    score += 18 if payload["chest_pain"] else 0
    score += 16 if payload["frequent_urination"] else 0
    score -= {"low": 0, "moderate": 5, "high": 12}.get(payload["physical_activity"].lower(), 3)

    disease_adjustments = {
        "Heart Disease": (payload["blood_pressure"] - 118) * 0.45 + (20 if payload["chest_pain"] else 0) + (10 if payload["smoking"] else 0),
        "Diabetes": (payload["glucose_level"] - 105) * 0.55 + (18 if payload["frequent_urination"] else 0),
        "Kidney Disease": (payload["blood_pressure"] - 122) * 0.3 + (14 if payload["fatigue"] else 0) + (payload["glucose_level"] - 110) * 0.18,
        "Lung Disease": (24 if payload["smoking"] else 0) + (22 if payload["shortness_of_breath"] else 0),
        "Liver Disease": (22 if payload["alcohol"] else 0) + (payload["cholesterol"] - 185) * 0.18,
    }
    score += disease_adjustments.get(disease, 0)
    return round(float(max(5, min(score, 95))), 2)


def calculate_overall_health_score(results: List[dict]) -> float:
    if not results:
        return 100.0
    average_probability = sum(item["probability"] for item in results) / len(results)
    return round(max(0.0, min(100.0, 100.0 - average_probability)), 2)


def classify_health_score(score: float) -> str:
    if score >= 80:
        return "Good Health"
    if score >= 50:
        return "Moderate Risk"
    return "High Risk"


def generate_recommendations(disease: str, payload: dict, probability: float) -> List[str]:
    items = ["Maintain regular checkups and keep tracking your vitals."]
    if probability >= 70:
        items.insert(0, f"Book a medical consultation soon for {disease.lower()} screening.")
    elif probability >= 40:
        items.insert(0, f"Adopt a focused prevention plan for {disease.lower()} and retest regularly.")
    else:
        items.insert(0, f"Current {disease.lower()} risk looks manageable. Stay consistent with healthy habits.")

    if payload["smoking"]:
        items.append("Reduce or stop smoking to improve long-term cardiovascular and respiratory health.")
    if payload["glucose_level"] > 140:
        items.append("Monitor sugar intake and discuss glucose control with a clinician.")
    if payload["blood_pressure"] > 140:
        items.append("Track blood pressure over the next few weeks and reduce sodium intake.")
    return items[:3]
