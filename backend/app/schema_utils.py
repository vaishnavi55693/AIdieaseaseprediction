from sqlalchemy import inspect, text

from app.database import engine


def ensure_schema() -> None:
    inspector = inspect(engine)

    if "users" in inspector.get_table_names():
        user_columns = {column["name"] for column in inspector.get_columns("users")}
        with engine.begin() as connection:
            if "age" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN age INTEGER"))
            if "gender" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN gender VARCHAR(20)"))
            if "height_cm" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN height_cm FLOAT"))
            if "weight_kg" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN weight_kg FLOAT"))
            if "medical_history" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN medical_history TEXT"))
            if "updated_at" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN updated_at DATETIME"))

    if "predictions" in inspector.get_table_names():
        prediction_columns = {column["name"] for column in inspector.get_columns("predictions")}
        with engine.begin() as connection:
            if "prediction_group_id" not in prediction_columns:
                connection.execute(text("ALTER TABLE predictions ADD COLUMN prediction_group_id VARCHAR(80)"))
            if "overall_health_score" not in prediction_columns:
                connection.execute(text("ALTER TABLE predictions ADD COLUMN overall_health_score FLOAT"))
