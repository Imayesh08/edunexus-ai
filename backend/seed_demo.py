from app.database import get_db
from app.config import settings
from app.risk_model import RiskModel

def main():
    db = get_db()
    model = RiskModel(settings.model_path)
    rows = [
      {"student_id":"DEMO001","name":"Aarav Demo","course":"AI Systems Engineering","attendance_pct":92,"internal_marks":84,"quiz_average":88,"assignment_score":91,"previous_gpa":8.4,"lms_activity":80},
      {"student_id":"DEMO002","name":"Bhavya Demo","course":"AI Systems Engineering","attendance_pct":72,"internal_marks":61,"quiz_average":58,"assignment_score":67,"previous_gpa":6.8,"lms_activity":55},
      {"student_id":"DEMO003","name":"Charan Demo","course":"AI Systems Engineering","attendance_pct":48,"internal_marks":38,"quiz_average":32,"assignment_score":45,"previous_gpa":4.8,"lms_activity":22}]
    for row in rows:
        row["risk_level"] = model.predict(row)["risk_level"]
        db.students.update_one({"student_id":row["student_id"]},{"$set":row},upsert=True)
    print("Inserted/updated 3 synthetic demo students.")
if __name__ == "__main__": main()
