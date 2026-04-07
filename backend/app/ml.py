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
