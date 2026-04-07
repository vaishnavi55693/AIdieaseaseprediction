import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier


ROOT_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = ROOT_DIR / "dataset"
MODELS_DIR = ROOT_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

DISEASE_MAP = {
    "heart_disease": "Heart Disease",
    "diabetes": "Diabetes",
    "kidney_disease": "Kidney Disease",
    "lung_disease": "Lung Disease",
    "liver_disease": "Liver Disease",
}


def build_models():
    return {
        "logistic_regression": Pipeline(
            [("scaler", StandardScaler()), ("model", LogisticRegression(max_iter=300))]
        ),
        "random_forest": RandomForestClassifier(n_estimators=220, random_state=42),
        "decision_tree": DecisionTreeClassifier(max_depth=6, random_state=42),
        "svm": Pipeline([("scaler", StandardScaler()), ("model", SVC(probability=True, random_state=42))]),
    }


def train_for_dataset(dataset_key: str, display_name: str) -> dict:
    dataset_path = DATASET_DIR / f"{dataset_key}.csv"
    frame = pd.read_csv(dataset_path)
    x = frame.drop(columns=["target"])
    y = frame["target"]
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42, stratify=y)

    metrics = {}
    for algorithm, model in build_models().items():
        model.fit(x_train, y_train)
        predictions = model.predict(x_test)
        probabilities = model.predict_proba(x_test)[:, 1]

        metrics[algorithm] = {
            "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
            "f1_score": round(float(f1_score(y_test, predictions)), 4),
            "roc_auc": round(float(roc_auc_score(y_test, probabilities)), 4),
        }

        artifact_path = MODELS_DIR / f"{dataset_key}_{algorithm}.joblib"
        joblib.dump(model, artifact_path)

    return {display_name: metrics}


if __name__ == "__main__":
    all_metrics = {}
    for dataset_key, display_name in DISEASE_MAP.items():
        all_metrics.update(train_for_dataset(dataset_key, display_name))

    metrics_path = MODELS_DIR / "model_metrics.json"
    metrics_path.write_text(json.dumps(all_metrics, indent=2), encoding="utf-8")
    print(f"Training complete. Metrics saved to {metrics_path}")
