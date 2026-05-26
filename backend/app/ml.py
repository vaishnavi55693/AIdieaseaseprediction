from __future__ import annotations

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


def _clinical_snapshot(payload: dict, bmi: float) -> dict:
    bp = float(payload["blood_pressure"])
    glucose = float(payload["glucose_level"])
    cholesterol = float(payload["cholesterol"])
    age = int(payload["age"])
    smoking = bool(payload["smoking"])
    alcohol = bool(payload["alcohol"])
    activity = payload["physical_activity"].lower()

    return {
        "age": age,
        "bp": bp,
        "glucose": glucose,
        "cholesterol": cholesterol,
        "bmi": bmi,
        "smoking": smoking,
        "alcohol": alcohol,
        "activity": activity,
        "activity_score": {"low": 1.0, "moderate": 0.55, "high": 0.2}.get(activity, 0.55),
        "chest_pain": bool(payload["chest_pain"]),
        "fatigue": bool(payload["fatigue"]),
        "shortness_of_breath": bool(payload["shortness_of_breath"]),
        "frequent_urination": bool(payload["frequent_urination"]),
        "male": payload["gender"].lower() == "male",
        "age_band": "senior" if age >= 60 else "mid" if age >= 45 else "young",
        "bp_elevated": bp >= 130,
        "bp_high": bp >= 140,
        "glucose_prediabetes": glucose >= 110,
        "glucose_high": glucose >= 126,
        "chol_borderline": cholesterol >= 200,
        "chol_high": cholesterol >= 240,
        "bmi_overweight": bmi >= 25,
        "bmi_obese": bmi >= 30,
        "bmi_underweight": bmi < 18.5,
    }


def _score_bp(snapshot: dict, moderate_weight: float, high_weight: float) -> float:
    if snapshot["bp_high"]:
        return high_weight
    if snapshot["bp_elevated"]:
        return moderate_weight
    return 0.0


def _score_glucose(snapshot: dict, moderate_weight: float, high_weight: float) -> float:
    if snapshot["glucose_high"]:
        return high_weight
    if snapshot["glucose_prediabetes"]:
        return moderate_weight
    return 0.0


def _score_chol(snapshot: dict, moderate_weight: float, high_weight: float) -> float:
    if snapshot["chol_high"]:
        return high_weight
    if snapshot["chol_borderline"]:
        return moderate_weight
    return 0.0


def _score_bmi(snapshot: dict, overweight_weight: float, obese_weight: float, underweight_weight: float = 0.0) -> float:
    if snapshot["bmi_obese"]:
        return obese_weight
    if snapshot["bmi_overweight"]:
        return overweight_weight
    if snapshot["bmi_underweight"]:
        return underweight_weight
    return 0.0


def _top_contributing_factors(contributions: list[tuple[str, float]]) -> list[str]:
    meaningful = [item for item in contributions if item[1] > 0]
    ordered = sorted(meaningful, key=lambda item: item[1], reverse=True)
    return [label for label, _ in ordered[:4]]


def _severity_badge(probability: float) -> str:
    if probability >= 85:
        return "Critical"
    if probability >= 70:
        return "Severe"
    if probability >= 50:
        return "Elevated"
    if probability >= 30:
        return "Watchlist"
    return "Stable"


def _risk_level(probability: float) -> str:
    if probability >= 70:
        return "High Risk"
    if probability >= 40:
        return "Medium Risk"
    return "Low Risk"


def _confidence_score(probability: float, contributions: list[tuple[str, float]], snapshot: dict) -> float:
    signal_strength = len([score for _, score in contributions if score > 0]) * 4.2
    symptom_strength = sum(
        1
        for key in ("chest_pain", "fatigue", "shortness_of_breath", "frequent_urination")
        if snapshot[key]
    ) * 3.5
    confidence = 72 + min(14, signal_strength) + min(10, symptom_strength)
    if probability >= 75:
        confidence += 3
    return round(min(96, max(74, confidence)), 1)


def _overall_summary(results: list[dict], health_score: float) -> str:
    if not results:
        return "No prediction summary is available yet."
    top = max(results, key=lambda item: item["probability"])
    if health_score >= 80:
        return (
            f"Your overall wellness profile is reassuring, with {top['disease']} currently showing the highest monitored risk "
            f"at {top['probability']:.1f}%."
        )
    if health_score >= 55:
        return (
            f"Your health profile shows moderate concern, led by {top['disease']} risk. Focus on the highlighted factors "
            f"to improve your next screening result."
        )
    return (
        f"Your profile needs timely attention. {top['disease']} is the most critical detected risk, driven by the current "
        f"clinical and lifestyle indicators."
    )


def _risk_trend_summary(results: list[dict], health_score: float) -> str:
    if not results:
        return "No trend summary available."
    high = len([item for item in results if item["risk_level"] == "High Risk"])
    medium = len([item for item in results if item["risk_level"] == "Medium Risk"])
    if health_score >= 80:
        return f"Low overall risk trend. {medium} areas remain on observation and {high} are currently high risk."
    if health_score >= 55:
        return f"Moderate risk trend detected with {medium} medium-risk and {high} high-risk disease areas."
    return f"Escalated risk trend detected with {high} high-risk disease areas requiring closer attention."


def _wellness_badge(score: float) -> str:
    if score >= 85:
        return "Resilient"
    if score >= 70:
        return "Balanced"
    if score >= 55:
        return "Attention Needed"
    return "Critical Watch"


def _build_disease_summary(disease: str, probability: float, factors: list[str]) -> str:
    if not factors:
        return f"{disease} risk is currently being driven more by general profile inputs than strong specific red flags."
    joined = ", ".join(factors[:3]).lower()
    if probability >= 70:
        return f"Your {disease.lower()} profile indicates elevated risk due to {joined}."
    if probability >= 40:
        return f"Your {disease.lower()} profile shows moderate concern, mainly influenced by {joined}."
    return f"Your {disease.lower()} risk remains comparatively low, though {joined} are still worth monitoring."


def _generate_recommendations(disease: str, payload: dict, snapshot: dict, probability: float) -> List[str]:
    base = []
    if disease == "Heart Disease":
        base.extend(
            [
                "Reduce sodium-heavy packaged foods and monitor blood pressure weekly.",
                "Increase moderate cardio activity such as brisk walking for 30 minutes most days.",
                "Schedule a cardiovascular screening if chest discomfort or breathlessness continues.",
            ]
        )
    elif disease == "Diabetes":
        base.extend(
            [
                "Reduce refined sugar and large late-night carbohydrate portions.",
                "Aim for daily walking or post-meal activity to improve glucose response.",
                "Consider periodic fasting glucose or HbA1c screening with a clinician.",
            ]
        )
    elif disease == "Kidney Disease":
        base.extend(
            [
                "Keep blood pressure and blood sugar controlled to protect kidney function.",
                "Stay hydrated consistently and avoid unnecessary painkiller overuse.",
                "Review renal markers if fatigue or blood pressure concerns persist.",
            ]
        )
    elif disease == "Liver Disease":
        base.extend(
            [
                "Limit alcohol and reduce fried or highly processed foods.",
                "Support liver health with weight control and regular movement.",
                "Discuss liver function testing if digestive symptoms or fatigue continue.",
            ]
        )
    elif disease == "Lung Disease":
        base.extend(
            [
                "Avoid smoking and second-hand smoke exposure wherever possible.",
                "Build respiratory capacity with walking, breathing exercises, and posture care.",
                "Seek medical review if breathlessness or persistent cough continues.",
            ]
        )

    if snapshot["smoking"] and not any("smoking" in item.lower() for item in base):
        base.insert(0, "Stopping smoking would significantly improve your long-term risk profile.")
    if snapshot["glucose_high"] and disease != "Diabetes":
        base.append("Your glucose level also deserves follow-up, as it can worsen multiple disease risks.")
    if snapshot["bp_high"] and disease != "Heart Disease":
        base.append("Bringing blood pressure into range will likely improve several disease scores together.")

    if probability < 35:
        base = base[:2] + ["Maintain current healthy habits and repeat screening after major lifestyle changes."]
    return base[:4]


def _disease_assessment(disease: str, payload: dict, snapshot: dict, model_probability: float | None) -> dict:
    age = snapshot["age"]
    bp = snapshot["bp"]
    glucose = snapshot["glucose"]
    chol = snapshot["cholesterol"]
    bmi = snapshot["bmi"]

    if disease == "Heart Disease":
        contributions = [
            ("Elevated blood pressure", _score_bp(snapshot, 14, 24)),
            ("High cholesterol", _score_chol(snapshot, 12, 20)),
            ("Smoking history", 18 if snapshot["smoking"] else 0),
            ("Chest pain symptoms", 22 if snapshot["chest_pain"] else 0),
            ("Age-related cardiovascular exposure", 10 if age >= 50 else 4 if age >= 40 else 0),
            ("Low physical activity", 10 if snapshot["activity"] == "low" else 4 if snapshot["activity"] == "moderate" else 0),
            ("Elevated BMI", _score_bmi(snapshot, 7, 13)),
            ("Shortness of breath", 12 if snapshot["shortness_of_breath"] else 0),
        ]
        base = 6
    elif disease == "Diabetes":
        contributions = [
            ("Raised glucose level", _score_glucose(snapshot, 18, 32)),
            ("Frequent urination pattern", 18 if snapshot["frequent_urination"] else 0),
            ("Elevated BMI", _score_bmi(snapshot, 14, 22)),
            ("Age-related metabolic exposure", 8 if age >= 45 else 3 if age >= 35 else 0),
            ("Fatigue pattern", 10 if snapshot["fatigue"] else 0),
            ("Low physical activity", 11 if snapshot["activity"] == "low" else 5 if snapshot["activity"] == "moderate" else 0),
            ("Borderline cholesterol", _score_chol(snapshot, 4, 8)),
        ]
        base = 5
    elif disease == "Kidney Disease":
        contributions = [
            ("Elevated blood pressure", _score_bp(snapshot, 16, 24)),
            ("Raised glucose level", _score_glucose(snapshot, 10, 20)),
            ("Fatigue burden", 14 if snapshot["fatigue"] else 0),
            ("Age-related renal exposure", 12 if age >= 55 else 5 if age >= 45 else 0),
            ("Smoking history", 7 if snapshot["smoking"] else 0),
            ("High BMI", _score_bmi(snapshot, 6, 11)),
        ]
        base = 5
    elif disease == "Liver Disease":
        contributions = [
            ("Alcohol exposure", 22 if snapshot["alcohol"] else 0),
            ("Elevated BMI", _score_bmi(snapshot, 13, 20)),
            ("High cholesterol", _score_chol(snapshot, 8, 13)),
            ("Fatigue burden", 10 if snapshot["fatigue"] else 0),
            ("Raised glucose level", _score_glucose(snapshot, 6, 10)),
            ("Low physical activity", 8 if snapshot["activity"] == "low" else 3 if snapshot["activity"] == "moderate" else 0),
        ]
        base = 6
    else:
        contributions = [
            ("Smoking history", 26 if snapshot["smoking"] else 0),
            ("Shortness of breath", 22 if snapshot["shortness_of_breath"] else 0),
            ("Fatigue burden", 10 if snapshot["fatigue"] else 0),
            ("Low physical activity", 8 if snapshot["activity"] == "low" else 3 if snapshot["activity"] == "moderate" else 0),
            ("Age-related respiratory exposure", 8 if age >= 55 else 4 if age >= 45 else 0),
            ("Chest pain symptoms", 6 if snapshot["chest_pain"] else 0),
        ]
        base = 5

    heuristic_probability = round(min(96, max(4, base + sum(score for _, score in contributions))), 1)
    if model_probability is None:
        probability = heuristic_probability
    else:
        probability = round(min(96, max(4, (heuristic_probability * 0.8) + (model_probability * 0.2))), 1)

    confidence = _confidence_score(probability, contributions, snapshot)
    factors = _top_contributing_factors(contributions)
    risk_level = _risk_level(probability)
    health_score = round(max(5, 100 - probability), 1)
    severity = _severity_badge(probability)
    recommendations = _generate_recommendations(disease, payload, snapshot, probability)
    summary = _build_disease_summary(disease, probability, factors)

    return {
        "disease": disease,
        "probability": probability,
        "confidence": confidence,
        "risk_level": risk_level,
        "severity_badge": severity,
        "health_score": health_score,
        "contributing_factors": factors,
        "recommendations": recommendations,
        "summary": summary,
        "raw_contributions": contributions,
        "heuristic_probability": heuristic_probability,
    }


def _generate_model_breakdown(disease_models: Dict[str, object], feature_array: np.ndarray) -> tuple[list[dict], float | None]:
    algorithm_results = []
    probabilities = []
    for algorithm, model in disease_models.items():
        try:
            probability = float(model.predict_proba(feature_array)[0][1]) * 100
            probabilities.append(probability)
            algorithm_results.append({"algorithm": algorithm.replace("_", " ").title(), "probability": round(probability, 2)})
        except Exception:
            continue
    if not probabilities:
        return algorithm_results, None
    return algorithm_results, round(sum(probabilities) / len(probabilities), 2)


def predict_all(payload: dict) -> dict:
    features = build_feature_vector(payload)
    bmi = features[2]
    feature_array = np.array(features).reshape(1, -1)
    models = load_models()
    snapshot = _clinical_snapshot(payload, bmi)

    results = []
    for disease, disease_models in models.items():
        algorithm_results, model_probability = _generate_model_breakdown(disease_models, feature_array)
        assessment = _disease_assessment(disease, payload, snapshot, model_probability)
        if algorithm_results:
            algorithm_results.append(
                {"algorithm": "Clinical Reasoning Layer", "probability": round(assessment["heuristic_probability"], 2)}
            )
        else:
            algorithm_results = [{"algorithm": "Clinical Reasoning Layer", "probability": round(assessment["heuristic_probability"], 2)}]

        results.append(
            {
                "disease": assessment["disease"],
                "probability": assessment["probability"],
                "confidence": assessment["confidence"],
                "risk_level": assessment["risk_level"],
                "severity_badge": assessment["severity_badge"],
                "health_score": assessment["health_score"],
                "algorithms": algorithm_results,
                "contributing_factors": assessment["contributing_factors"],
                "recommendations": assessment["recommendations"],
                "summary": assessment["summary"],
            }
        )

    overall_health_score = calculate_overall_health_score(results)
    most_critical = max(results, key=lambda item: item["probability"]) if results else None
    return {
        "bmi": round(bmi, 2),
        "overall_health_score": overall_health_score,
        "overall_status": classify_health_score(overall_health_score),
        "wellness_badge": _wellness_badge(overall_health_score),
        "risk_trend_summary": _risk_trend_summary(results, overall_health_score),
        "ai_summary": _overall_summary(results, overall_health_score),
        "most_critical_risk": most_critical,
        "results": results,
    }


def weighted_risk_scores(payload: dict) -> dict:
    assessment = predict_all(payload)
    keyed = {}
    for item in assessment["results"]:
        if item["disease"] == "Heart Disease":
            keyed["heart"] = item
        elif item["disease"] == "Diabetes":
            keyed["diabetes"] = item
        elif item["disease"] == "Kidney Disease":
            keyed["kidney"] = item
        elif item["disease"] == "Lung Disease":
            keyed["lung"] = item
        elif item["disease"] == "Liver Disease":
            keyed["liver"] = item
    return keyed


def weighted_health_score(risks: dict) -> int:
    values = [float(risks.get(key, {}).get("probability", 0)) for key in ("heart", "diabetes", "kidney", "lung", "liver")]
    average_risk = sum(values) / len(values) if values else 0.0
    return int(round(max(0, min(100, 100 - average_risk))))


def heuristic_probability(disease: str, payload: dict, bmi: float) -> float:
    snapshot = _clinical_snapshot(payload, bmi)
    return _disease_assessment(disease, payload, snapshot, None)["heuristic_probability"]


def calculate_overall_health_score(results: List[dict]) -> float:
    if not results:
        return 100.0
    weighted_sum = 0.0
    total_weight = 0.0
    disease_weights = {
        "Heart Disease": 1.15,
        "Diabetes": 1.1,
        "Kidney Disease": 1.0,
        "Liver Disease": 0.95,
        "Lung Disease": 1.0,
    }
    for item in results:
        weight = disease_weights.get(item["disease"], 1.0)
        weighted_sum += item["probability"] * weight
        total_weight += weight
    average_probability = weighted_sum / total_weight if total_weight else 0
    return round(max(0.0, min(100.0, 100.0 - average_probability)), 2)


def classify_health_score(score: float) -> str:
    if score >= 82:
        return "Good Health"
    if score >= 58:
        return "Moderate Risk"
    return "High Risk"


def generate_recommendations(disease: str, payload: dict, probability: float) -> List[str]:
    bmi = payload["weight_kg"] / ((payload["height_cm"] / 100) ** 2)
    snapshot = _clinical_snapshot(payload, bmi)
    return _generate_recommendations(disease, payload, snapshot, probability)
