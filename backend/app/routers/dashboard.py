from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models import ModelRegistry, Prediction, User
from app.schemas import DashboardSummary


router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
def summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    predictions = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .all()
    )

    grouped_predictions = defaultdict(list)
    for prediction in predictions:
        key = prediction.prediction_group_id or prediction.created_at.isoformat()
        grouped_predictions[key].append(prediction)

    previous_predictions = []
    for group_id, items in grouped_predictions.items():
        overall_score = round(sum(item.overall_health_score or item.health_score for item in items) / len(items), 2)
        previous_predictions.append(
            {
                "prediction_group_id": group_id,
                "date": max(item.created_at for item in items),
                "health_score": overall_score,
                "health_status": "Good Health" if overall_score >= 80 else "Moderate Risk" if overall_score >= 50 else "High Risk",
                "disease_results": [
                    {"disease": item.disease_type, "risk_score": item.risk_score, "risk_level": item.risk_level}
                    for item in sorted(items, key=lambda entry: entry.risk_score, reverse=True)
                ],
            }
        )
    previous_predictions = sorted(previous_predictions, key=lambda item: item["date"], reverse=True)[:6]

    disease_peak_scores = defaultdict(float)
    for prediction in predictions:
        disease_peak_scores[prediction.disease_type] = max(disease_peak_scores[prediction.disease_type], prediction.risk_score)

    top_risks = [
        {"disease": disease, "risk_score": round(score, 2)}
        for disease, score in sorted(disease_peak_scores.items(), key=lambda item: item[1], reverse=True)
    ][:5]

    avg_health_score = round(sum(item.health_score for item in predictions) / len(predictions), 2) if predictions else 92.0
    grouped_ordered = sorted(previous_predictions, key=lambda item: item["date"])
    return DashboardSummary(
        welcome_message="Welcome to AI Health Predictor",
        quick_stats={
            "total_predictions": len(predictions),
            "average_health_score": avg_health_score,
            "high_risk_count": len([item for item in predictions if item.risk_level == "High Risk"]),
            "quick_predict_label": "Check Health Status",
            "health_status": "Good Health" if avg_health_score >= 80 else "Moderate Risk" if avg_health_score >= 50 else "High Risk",
        },
        previous_predictions=previous_predictions,
        top_risks=top_risks,
        charts={
            "risk_bar_chart": top_risks,
            "health_score_progress": [
                {"label": item["date"].strftime("%b %d"), "health_score": item["health_score"]}
                for item in grouped_ordered
            ],
            "prediction_history_chart": [
                {"label": item["date"].strftime("%b %d"), "high_risk_count": len([d for d in item["disease_results"] if d["risk_level"] == "High Risk"])}
                for item in grouped_ordered
            ],
        },
    )


@router.get("/admin/overview")
def admin_overview(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return {
        "users": db.query(User).count(),
        "predictions": db.query(Prediction).count(),
        "registered_models": db.query(ModelRegistry).count(),
    }
