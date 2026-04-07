from pathlib import Path

import numpy as np
import pandas as pd


ROOT_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = ROOT_DIR / "dataset"
DATASET_DIR.mkdir(parents=True, exist_ok=True)

DISEASE_CONFIG = {
    "heart_disease": [0.022, 0.06, 0.08, 0.03, 0.01, 0.02, 0.5, 0.18, -0.12, 0.4, 0.12, 0.24, 0.04],
    "diabetes": [0.014, 0.02, 0.03, 0.018, 0.09, 0.015, 0.18, 0.1, -0.14, 0.08, 0.1, 0.05, 0.42],
    "kidney_disease": [0.012, 0.01, 0.025, 0.035, 0.028, 0.022, 0.12, 0.08, -0.08, 0.05, 0.16, 0.09, 0.2],
    "lung_disease": [0.015, 0.02, 0.015, 0.016, 0.014, 0.01, 0.62, 0.08, -0.1, 0.12, 0.18, 0.48, 0.03],
    "liver_disease": [0.012, 0.015, 0.02, 0.02, 0.03, 0.05, 0.1, 0.55, -0.1, 0.04, 0.11, 0.08, 0.07],
}

FEATURE_COLUMNS = [
    "age",
    "gender",
    "bmi",
    "blood_pressure",
    "glucose_level",
    "cholesterol",
    "smoking",
    "alcohol",
    "physical_activity",
    "chest_pain",
    "fatigue",
    "shortness_of_breath",
    "frequent_urination",
]


def sigmoid(value):
    return 1 / (1 + np.exp(-value))


def create_base_dataframe(samples: int = 1600) -> pd.DataFrame:
    rng = np.random.default_rng(42)
    frame = pd.DataFrame(
        {
            "age": rng.integers(18, 85, size=samples),
            "gender": rng.integers(0, 2, size=samples),
            "bmi": rng.normal(26, 4.8, size=samples).clip(16, 42),
            "blood_pressure": rng.normal(128, 18, size=samples).clip(85, 220),
            "glucose_level": rng.normal(112, 35, size=samples).clip(65, 320),
            "cholesterol": rng.normal(195, 42, size=samples).clip(100, 420),
            "smoking": rng.integers(0, 2, size=samples),
            "alcohol": rng.integers(0, 2, size=samples),
            "physical_activity": rng.integers(0, 3, size=samples),
            "chest_pain": rng.integers(0, 2, size=samples),
            "fatigue": rng.integers(0, 2, size=samples),
            "shortness_of_breath": rng.integers(0, 2, size=samples),
            "frequent_urination": rng.integers(0, 2, size=samples),
        }
    )
    return frame


def create_disease_dataset(disease_name: str, weights: list[float]) -> None:
    rng = np.random.default_rng(abs(hash(disease_name)) % (2**32))
    base = create_base_dataframe()
    logit = -9.5
    for feature, weight in zip(FEATURE_COLUMNS, weights):
        logit += base[feature] * weight
    logit += rng.normal(0, 0.6, size=len(base))
    probability = sigmoid(logit)

    # Use a disease-specific percentile threshold so every dataset keeps both classes.
    threshold = float(np.quantile(probability, 0.62))
    target = (probability >= threshold).astype(int)

    if target.min() == target.max():
        ranked_indices = np.argsort(probability)
        split_index = len(ranked_indices) // 2
        target = np.zeros(len(base), dtype=int)
        target[ranked_indices[split_index:]] = 1

    base["target"] = target
    output = DATASET_DIR / f"{disease_name}.csv"
    base.to_csv(output, index=False)


if __name__ == "__main__":
    for disease_name, weights in DISEASE_CONFIG.items():
        create_disease_dataset(disease_name, weights)
    print(f"Synthetic datasets generated in {DATASET_DIR}")
