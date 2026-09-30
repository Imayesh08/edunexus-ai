# EduNexus AI backend starter

Implements the first backend milestone from the PPT: FastAPI, local MongoDB, Random Forest risk prediction, six agent modules, topic-wise gap detection, study-plan recommendations, RAG tutoring, feedback, and faculty interventions.

## Setup (Mac)
Use Python 3.11 or 3.12 if possible.

```bash
cd edunexus-ai/backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
python train_model.py
```

Edit `.env` and add your API key to `OPENAI_API_KEY`. Keep `.env private; never commit it.

Start local MongoDB if installed with Homebrew:
```bash
brew services start mongodb-community
```
If that service name is not found, check `brew services list` and use the service name for the installed MongoDB version.

Seed synthetic demo students (MongoDB must be running):
```bash
python seed_demo.py
```

Start the API:
```bash
uvicorn app.main:app --reload
```
Visit http://127.0.0.1:8000/docs and http://127.0.0.1:8000/health.

Run tests:
```bash
pytest -q
```

## Quick API checks
In `/docs`, use `POST /api/predict-risk` with:
```json
{
  "student_id":"DEMO004","name":"Devi Demo","course":"AI Systems Engineering",
  "attendance_pct":68,"internal_marks":55,"quiz_average":60,
  "assignment_score":65,"previous_gpa":6.2,"lms_activity":45
}
```
For `POST /api/learning-gaps`:
```json
{"student_id":"DEMO004","topic_scores":[
 {"topic":"PCA","score":42},{"topic":"Random Forest","score":76},
 {"topic":"Model Evaluation","score":88}]}
```
For `POST /api/recommendations`:
```json
{"student_id":"DEMO004","available_hours_per_week":5,"topic_scores":[
 {"topic":"PCA","score":42},{"topic":"Random Forest","score":76},
 {"topic":"Model Evaluation","score":88}]}
```

## RAG knowledge base
With `OPENAI_API_KEY` configured, POST `/api/tutor/knowledge-base`:
```json
{"documents":[{"id":"unit1-001","course":"AI Systems Engineering",
"source":"faculty-approved-notes","text":"PCA is a dimensionality reduction method..."}]}
```
Then POST `/api/tutor/ask`:
```json
{"course":"AI Systems Engineering","question":"What is PCA and why is it used?"}
```
Course name must match the indexed metadata exactly. Only add material you are allowed to use.

## Scope and limitations
The model is trained on synthetic records with rule-generated labels solely to prove the pipeline works. Its metrics do not establish real-world predictive quality. Before real deployment, use approved, de-identified institutional data, evaluate recall/precision and calibration, set thresholds with faculty, and maintain human review. This starter does not yet include authentication/authorization or the React frontend. Do not store real student data until access controls and institutional approval are in place.
