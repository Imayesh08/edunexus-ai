from uuid import uuid4

class PerformanceAgent:
    name = "performance_agent"
    def run(self, s):
        score = (.25*s["internal_marks"] + .20*s["quiz_average"] +
                 .20*s["assignment_score"] + .20*s["attendance_pct"] +
                 .15*s["previous_gpa"]*10)
        return {"agent": self.name, "performance_index": round(score, 2),
                "lms_activity": s["lms_activity"]}

class RiskAgent:
    name = "risk_agent"
    def __init__(self, model): self.model = model
    def run(self, s): return {"agent": self.name, **self.model.predict(s)}

class LearningGapAgent:
    name = "learning_gap_agent"
    def run(self, scores, threshold=60):
        weak = sorted([x for x in scores if x["score"] < threshold], key=lambda x:x["score"])
        strong = sorted([x for x in scores if x["score"] >= 80], key=lambda x:-x["score"])
        practice = [x for x in scores if threshold <= x["score"] < 80]
        return {"agent": self.name, "threshold": threshold, "weak_topics": weak,
                "strong_topics": strong, "topics_to_practice": practice}

class RecommendationAgent:
    name = "recommendation_agent"
    def run(self, scores, hours=5):
        ordered = sorted(scores, key=lambda x:x["score"])[:4]
        if not ordered:
            tasks = [{"topic":"Current syllabus", "activity":"Take a diagnostic quiz",
                      "hours":round(hours,1)}]
        else:
            per_topic = round(hours / len(ordered), 1)
            tasks = [{"topic":x["topic"], "current_score":x["score"],
                      "activity":"Review fundamentals and complete guided practice"
                      if x["score"] < 60 else "Revise key concepts and complete mixed practice",
                      "hours":per_topic} for x in ordered]
        return {"agent":self.name, "recommendation_id":str(uuid4()),
                "weekly_hours":hours, "study_plan":tasks,
                "review_note":"Use faculty-approved resources and student feedback."}

class FacultySupportAgent:
    name = "faculty_support_agent"
    def run(self, student, risk, gaps):
        level = risk["risk_level"]
        actions = (["Review records and consider timely faculty support."]
                   if level == "high" else
                   ["Schedule a check-in and monitor the next assessment."]
                   if level == "medium" else
                   ["Continue routine monitoring and reinforce strong topics."])
        if gaps["weak_topics"]:
            actions.append("Offer support for: " + ", ".join(x["topic"] for x in gaps["weak_topics"]))
        return {"agent":self.name, "student_id":student.get("student_id"),
                "risk_level":level, "suggested_actions":actions,
                "requires_human_review":True}


class RAGTutorAgent:
    name = "rag_tutor_agent"
    def __init__(self, rag_service):
        self.rag_service = rag_service
    def run(self, question, course):
        return {"agent": self.name, **self.rag_service.answer(question, course)}
