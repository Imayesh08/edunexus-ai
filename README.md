# EduNexus AI — Full-stack implementation starter

This project contains a FastAPI backend and a React/Vite frontend dashboard.

## Start the backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
python train_model.py
uvicorn app.main:app --reload
```
Start local MongoDB separately before testing database endpoints. Configure `OPENAI_API_KEY` in `backend/.env` for the API-based RAG tutor.

## Start the frontend (new terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open the local URL printed by Vite (normally http://localhost:5173).

## Current scope
The frontend provides Overview, Students, Learning Gaps, Study Plans, AI Tutor, and Faculty Support screens. It calls the backend routes directly. The model uses synthetic data for prototype testing only. The frontend uses synthetic fallback records when the API has no student records.

Important: authentication and role-based authorization are not yet implemented. Do not use real student records until security, institutional approval, and data protection controls are added. Human review is required for academic risk and intervention decisions.
