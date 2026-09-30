from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import get_db, close_client
from app.risk_model import RiskModel
from app.agents import PerformanceAgent, RiskAgent, LearningGapAgent, RecommendationAgent, FacultySupportAgent, RAGTutorAgent
from app.rag import RAGService
from app.schemas import StudentCreate, GapRequest, RecommendationRequest, TutorRequest, FeedbackCreate, InterventionCreate

model = RiskModel(settings.model_path)
performance_agent = PerformanceAgent()
risk_agent = RiskAgent(model)
gap_agent = LearningGapAgent()
recommendation_agent = RecommendationAgent()
faculty_agent = FacultySupportAgent()
rag = RAGService()
tutor_agent = RAGTutorAgent(rag)

app = FastAPI(title="EduNexus AI", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.allowed_origins,
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def root():
    return {"name":"EduNexus AI","status":"running","docs":"/docs"}

@app.get("/health")
def health():
    return {"status":"ok","risk_model_loaded":model.model is not None}

@app.get("/api/students")
def list_students():
    try:
        rows = list(get_db().students.find({}, {"_id":0}).limit(500))
        return {"count":len(rows),"students":rows}
    except RuntimeError as e: raise HTTPException(503, str(e))

@app.post("/api/students", status_code=201)
def create_student(payload: StudentCreate):
    record = payload.model_dump()
    try:
        db = get_db()
        if db.students.find_one({"student_id":record["student_id"]}):
            raise HTTPException(409, "student_id already exists")
        prediction = risk_agent.run(record)
        record["risk_level"] = prediction["risk_level"]
        record["created_at"] = datetime.now(timezone.utc).isoformat()
        db.students.insert_one(record)
        return {"student":record,"risk_prediction":prediction}
    except RuntimeError as e: raise HTTPException(503, str(e))

@app.get("/api/students/{student_id}")
def get_student(student_id: str):
    try: student = get_db().students.find_one({"student_id":student_id},{"_id":0})
    except RuntimeError as e: raise HTTPException(503, str(e))
    if not student: raise HTTPException(404, "Student not found")
    return student

@app.post("/api/predict-risk")
def predict_risk(payload: StudentCreate):
    try: return risk_agent.run(payload.model_dump())
    except RuntimeError as e: raise HTTPException(503, str(e))

@app.post("/api/learning-gaps")
def learning_gaps(payload: GapRequest):
    result = gap_agent.run([x.model_dump() for x in payload.topic_scores])
    result["student_id"] = payload.student_id
    return result

@app.post("/api/recommendations")
def recommendations(payload: RecommendationRequest):
    return recommendation_agent.run([x.model_dump() for x in payload.topic_scores], payload.available_hours_per_week)

@app.post("/api/analyze")
def analyze(payload: dict):
    if "student" not in payload or "topic_scores" not in payload:
        raise HTTPException(422, "Expected student and topic_scores")
    try:
        student = payload["student"]
        perf = performance_agent.run(student)
        risk = risk_agent.run(student)
        gaps = gap_agent.run(payload["topic_scores"])
        plan = recommendation_agent.run(payload["topic_scores"])
        faculty = faculty_agent.run(student, risk, gaps)
        return {"student_id":student["student_id"],"performance":perf,"risk":risk,
                "learning_gaps":gaps,"recommendation":plan,"faculty_support":faculty,
                "agents_executed":[performance_agent.name,risk_agent.name,gap_agent.name,
                    recommendation_agent.name,faculty_agent.name]}
    except (KeyError, RuntimeError, TypeError) as e: raise HTTPException(422, str(e))

@app.post("/api/tutor/knowledge-base")
def add_knowledge(payload: dict):
    docs = payload.get("documents")
    if not isinstance(docs,list) or not docs: raise HTTPException(422, "Provide non-empty documents list")
    try: return rag.add_documents(docs)
    except RuntimeError as e: raise HTTPException(503, str(e))
    except Exception as e: raise HTTPException(502, f"Knowledge indexing failed: {e}")

@app.post("/api/tutor/ask")
def ask_tutor(payload: TutorRequest):
    try: return tutor_agent.run(payload.question, payload.course)
    except RuntimeError as e: raise HTTPException(503, str(e))
    except Exception as e: raise HTTPException(502, f"Tutor request failed: {e}")

@app.post("/api/feedback", status_code=201)
def feedback(payload: FeedbackCreate):
    record = {**payload.model_dump(),"created_at":datetime.now(timezone.utc).isoformat()}
    try:
        get_db().feedback.insert_one(record)
        return {"saved":True,"feedback":record}
    except RuntimeError as e: raise HTTPException(503, str(e))

@app.post("/api/interventions", status_code=201)
def intervention(payload: InterventionCreate):
    record = {**payload.model_dump(),"created_at":datetime.now(timezone.utc).isoformat()}
    try:
        get_db().interventions.insert_one(record)
        return {"saved":True,"intervention":record,"human_review_required":True}
    except RuntimeError as e: raise HTTPException(503, str(e))

@app.get("/api/faculty/at-risk")
def at_risk():
    try:
        rows = list(get_db().students.find({"risk_level":{"$in":["medium","high"]}},{"_id":0}).limit(500))
        return {"count":len(rows),"students":rows}
    except RuntimeError as e: raise HTTPException(503, str(e))

@app.on_event("shutdown")
def shutdown():
    close_client()
