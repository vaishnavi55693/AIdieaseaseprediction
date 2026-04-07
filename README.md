# AI Health Predictor

Full stack AI multi-disease prediction platform with:

- React + Tailwind frontend
- FastAPI backend
- SQLite database
- Scikit-learn training pipeline
- Recharts analytics dashboard

## Folder structure

```text
frontend/
backend/
models/
dataset/
database/
```

## Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python ..\dataset\generate_synthetic_data.py
python ..\models\train_models.py
uvicorn main:app --reload
```

Backend runs on `http://127.0.0.1:8000`.

You can also use:

```bash
cd backend
npm install
npm run dev
```

`npm run dev` in `backend` simply starts the FastAPI server for convenience.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://127.0.0.1:5173`.

## Included features

- JWT authentication with signup, login, role handling, and logout
- Dashboard with disease cards, welcome hero, quick stats, and quick predict
- Prediction form with BMI auto-calculation
- Ensemble predictions across heart, diabetes, kidney, lung, and liver risk
- Results dashboard with risk cards, bar chart, pie chart, and recommendations
- Prediction history page
- Profile page
- SQLite persistence for users, predictions, models, history, and roles

## Notes

- The training pipeline generates synthetic datasets locally, then trains Logistic Regression, Random Forest,
  Decision Tree, and SVM models for each disease.
- If model artifacts are missing, the backend still starts, but prediction confidence will be empty until models are trained.
