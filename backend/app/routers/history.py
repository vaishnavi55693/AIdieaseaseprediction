from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Prediction, User
from app.routers.predictions import build_grouped_history
from app.schemas import PredictionHistoryGroup


router = APIRouter()


@router.get("/history", response_model=list[PredictionHistoryGroup])
def history_feed(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .all()
    )
    return build_grouped_history(records)
