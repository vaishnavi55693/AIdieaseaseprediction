import json
import uuid
from io import BytesIO
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.ml import predict_all
from app.models import History, Prediction, User
from app.schemas import PredictionHistoryGroup, PredictionHistoryItem, PredictionInput, PredictionResponse


router = APIRouter()


@router.post("/check", response_model=PredictionResponse)
def check_health(payload: PredictionInput, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prediction_group_id = str(uuid.uuid4())
    generated_at = datetime.utcnow()
    prediction_output = predict_all(payload.model_dump())

    for result in prediction_output["results"]:
        prediction = Prediction(
            user_id=current_user.id,
            prediction_group_id=prediction_group_id,
            disease_type=result["disease"],
            risk_score=result["probability"],
            risk_level=result["risk_level"],
            health_score=result["health_score"],
            overall_health_score=prediction_output["overall_health_score"],
            features_json=json.dumps(payload.model_dump()),
            model_breakdown_json=json.dumps(result["algorithms"]),
            recommendations=json.dumps(result["recommendations"]),
            created_at=generated_at,
        )
        db.add(prediction)
        db.flush()
        db.add(
            History(
                user_id=current_user.id,
                prediction_id=prediction.id,
                details=json.dumps({"prediction_group_id": prediction_group_id, "disease": result["disease"]}),
                created_at=generated_at,
            )
        )

    db.commit()
    return PredictionResponse(
        prediction_group_id=prediction_group_id,
        bmi=prediction_output["bmi"],
        overall_health_score=prediction_output["overall_health_score"],
        overall_status=prediction_output["overall_status"],
        generated_at=generated_at,
        results=prediction_output["results"],
    )


@router.get("/history", response_model=list[PredictionHistoryItem])
def prediction_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .limit(50)
        .all()
    )
    return records


@router.get("/history/grouped", response_model=list[PredictionHistoryGroup])
def grouped_prediction_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .all()
    )
    return build_grouped_history(records)


@router.get("/latest")
def latest_prediction(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    latest_created_at = (
        db.query(Prediction.created_at)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .first()
    )
    if not latest_created_at:
        raise HTTPException(status_code=404, detail="No predictions found")

    records = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id, Prediction.created_at == latest_created_at[0])
        .order_by(Prediction.risk_score.desc())
        .all()
    )

    bmi = 0
    if records:
        payload = json.loads(records[0].features_json)
        bmi = round(payload["weight_kg"] / ((payload["height_cm"] / 100) ** 2), 2)

    return {
        "prediction_group_id": records[0].prediction_group_id if records else None,
        "bmi": bmi,
        "overall_health_score": round(sum(item.overall_health_score or item.health_score for item in records) / len(records), 2),
        "overall_status": health_status_from_records(records),
        "generated_at": latest_created_at[0],
        "results": [
            {
                "disease": item.disease_type,
                "probability": item.risk_score,
                "risk_level": item.risk_level,
                "health_score": item.health_score,
                "algorithms": json.loads(item.model_breakdown_json),
                "recommendations": json.loads(item.recommendations),
            }
            for item in records
        ],
    }


@router.get("/report/latest")
def download_latest_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    latest_created_at = (
        db.query(Prediction.created_at)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .first()
    )
    if not latest_created_at:
        raise HTTPException(status_code=404, detail="No predictions found")
    records = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id, Prediction.created_at == latest_created_at[0])
        .order_by(Prediction.risk_score.desc())
        .all()
    )
    report_stream = build_pdf_report(current_user, records)
    return StreamingResponse(
        report_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="ai-health-report.pdf"'},
    )


@router.get("/report/{prediction_group_id}")
def download_group_report(prediction_group_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id, Prediction.prediction_group_id == prediction_group_id)
        .order_by(Prediction.risk_score.desc())
        .all()
    )
    if not records:
        raise HTTPException(status_code=404, detail="Prediction report not found")
    report_stream = build_pdf_report(current_user, records)
    return StreamingResponse(
        report_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="ai-health-report-{prediction_group_id}.pdf"'},
    )


def health_status_from_records(records: list[Prediction]) -> str:
    overall_score = round(sum(item.overall_health_score or item.health_score for item in records) / len(records), 2)
    if overall_score >= 80:
        return "Good Health"
    if overall_score >= 50:
        return "Moderate Risk"
    return "High Risk"


def build_grouped_history(records: list[Prediction]) -> list[PredictionHistoryGroup]:
    grouped: dict[str, list[Prediction]] = {}
    for record in records:
        key = record.prediction_group_id or record.created_at.isoformat()
        grouped.setdefault(key, []).append(record)

    history_items = []
    for group_id, items in grouped.items():
        ordered_items = sorted(items, key=lambda item: item.risk_score, reverse=True)
        overall_score = round(sum(item.overall_health_score or item.health_score for item in items) / len(items), 2)
        history_items.append(
            PredictionHistoryGroup(
                prediction_group_id=group_id,
                date=max(item.created_at for item in items),
                health_score=overall_score,
                health_status=health_status_from_records(items),
                disease_results=[
                    {"disease": item.disease_type, "risk_score": item.risk_score, "risk_level": item.risk_level}
                    for item in ordered_items
                ],
            )
        )
    return sorted(history_items, key=lambda item: item.date, reverse=True)[:20]


def build_pdf_report(user: User, records: list[Prediction]) -> BytesIO:
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
    except ModuleNotFoundError as exc:
        return build_basic_pdf_report(user, records)

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("AI Health Predictor Medical Report", styles["Title"]),
        Spacer(1, 12),
        Paragraph(f"Patient: {user.full_name}", styles["Heading3"]),
        Paragraph(f"Email: {user.email}", styles["BodyText"]),
        Paragraph(f"Generated on: {max(item.created_at for item in records).strftime('%Y-%m-%d %H:%M')}", styles["BodyText"]),
        Spacer(1, 12),
    ]

    overall_score = round(sum(item.overall_health_score or item.health_score for item in records) / len(records), 2)
    story.extend(
        [
            Paragraph(f"Overall Health Score: {overall_score}", styles["Heading2"]),
            Paragraph(f"Overall Status: {health_status_from_records(records)}", styles["BodyText"]),
            Spacer(1, 12),
        ]
    )

    table_rows = [["Disease", "Risk %", "Risk Level", "Recommendations"]]
    for item in records:
        recommendations = ", ".join(json.loads(item.recommendations))
        table_rows.append([item.disease_type, f"{item.risk_score:.1f}", item.risk_level, recommendations])

    table = Table(table_rows, colWidths=[110, 70, 90, 220])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ]
        )
    )
    story.append(table)
    doc.build(story)
    buffer.seek(0)
    return buffer


def build_basic_pdf_report(user: User, records: list[Prediction]) -> BytesIO:
    lines = [
        "AI Health Predictor Medical Report",
        f"Patient: {user.full_name}",
        f"Email: {user.email}",
        f"Generated: {max(item.created_at for item in records).strftime('%Y-%m-%d %H:%M')}",
    ]

    overall_score = round(sum(item.overall_health_score or item.health_score for item in records) / len(records), 2)
    lines.append(f"Overall Health Score: {overall_score}")
    lines.append(f"Overall Status: {health_status_from_records(records)}")
    lines.append("")

    for item in records:
        lines.append(f"{item.disease_type}: {item.risk_score:.1f}% ({item.risk_level})")
        for recommendation in json.loads(item.recommendations):
            lines.append(f"- {recommendation}")
        lines.append("")

    pdf_bytes = simple_text_pdf(lines)
    buffer = BytesIO(pdf_bytes)
    buffer.seek(0)
    return buffer


def simple_text_pdf(lines: list[str]) -> bytes:
    content_lines = ["BT", "/F1 12 Tf", "50 780 Td", "14 TL"]
    first = True
    for line in lines:
        safe_line = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        if first:
            content_lines.append(f"({safe_line}) Tj")
            first = False
        else:
            content_lines.append("T*")
            content_lines.append(f"({safe_line}) Tj")
    content_lines.append("ET")
    stream = "\n".join(content_lines).encode("latin-1", errors="replace")

    objects = []
    objects.append(b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj")
    objects.append(b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj")
    objects.append(b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj")
    objects.append(f"4 0 obj << /Length {len(stream)} >> stream\n".encode("latin-1") + stream + b"\nendstream endobj")
    objects.append(b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj")

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objects:
        offsets.append(len(pdf))
        pdf.extend(obj)
        pdf.extend(b"\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))
    pdf.extend(
        f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF".encode("latin-1")
    )
    return bytes(pdf)
