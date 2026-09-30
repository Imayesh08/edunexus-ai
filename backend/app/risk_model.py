from pathlib import Path
import joblib
import pandas as pd

FEATURES = ["attendance_pct", "internal_marks", "quiz_average",
            "assignment_score", "previous_gpa", "lms_activity"]
LABELS = {0: "low", 1: "medium", 2: "high"}

class RiskModel:
    def __init__(self, path):
        self.path = Path(path)
        self.model = joblib.load(self.path) if self.path.exists() else None

    def predict(self, student):
        if self.model is None:
            raise RuntimeError("Risk model missing. Run `python train_model.py` first.")
        row = pd.DataFrame([{k: float(student[k]) for k in FEATURES}], columns=FEATURES)
        probs = self.model.predict_proba(row)[0]
        pred = int(self.model.predict(row)[0])
        return {
            "risk_level": LABELS[pred],
            "risk_probabilities": {LABELS[int(c)]: round(float(p), 4)
                                   for c, p in zip(self.model.classes_, probs)},
            "model_note": "Synthetic demo model only; not validated for real student decisions."
        }
