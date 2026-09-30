from typing import Literal
from pydantic import BaseModel, Field, ConfigDict

class StudentCreate(BaseModel):
    student_id: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=120)
    course: str = Field(min_length=1, max_length=120)
    attendance_pct: float = Field(ge=0, le=100)
    internal_marks: float = Field(ge=0, le=100)
    quiz_average: float = Field(ge=0, le=100)
    assignment_score: float = Field(ge=0, le=100)
    previous_gpa: float = Field(ge=0, le=10)
    lms_activity: float = Field(ge=0, le=100)

class TopicScore(BaseModel):
    topic: str = Field(min_length=1, max_length=160)
    score: float = Field(ge=0, le=100)

class GapRequest(BaseModel):
    student_id: str
    topic_scores: list[TopicScore] = Field(min_length=1)

class RecommendationRequest(BaseModel):
    student_id: str
    topic_scores: list[TopicScore] = Field(default_factory=list)
    available_hours_per_week: float = Field(default=5, gt=0, le=80)

class TutorRequest(BaseModel):
    question: str = Field(min_length=3, max_length=3000)
    course: str = Field(min_length=1, max_length=120)

class FeedbackCreate(BaseModel):
    student_id: str
    recommendation_id: str | None = None
    rating: int = Field(ge=1, le=5)
    comments: str = Field(default="", max_length=2000)

class InterventionCreate(BaseModel):
    student_id: str
    faculty_id: str
    action: str = Field(min_length=3, max_length=2000)
    outcome: Literal["planned", "in_progress", "completed"] = "planned"
    notes: str = ""
