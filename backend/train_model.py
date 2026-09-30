from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from app.risk_model import FEATURES

def main():
    rng = np.random.default_rng(42)
    n = 1200
    df = pd.DataFrame({
        "attendance_pct":rng.uniform(35,100,n),
        "internal_marks":rng.uniform(20,100,n),
        "quiz_average":rng.uniform(15,100,n),
        "assignment_score":rng.uniform(20,100,n),
        "previous_gpa":rng.uniform(3,10,n),
        "lms_activity":rng.uniform(0,100,n)})
    score = (.24*df.attendance_pct + .26*df.internal_marks + .18*df.quiz_average +
             .16*df.assignment_score + .10*df.previous_gpa*10 + .06*df.lms_activity)
    y = np.where(score >= 72, 0, np.where(score >= 55, 1, 2))
    Xtr, Xte, ytr, yte = train_test_split(df[FEATURES], y, test_size=.2,
                                          random_state=42, stratify=y)
    clf = RandomForestClassifier(n_estimators=200,max_depth=10,class_weight="balanced",random_state=42)
    clf.fit(Xtr,ytr)
    pred = clf.predict(Xte)
    path = Path("artifacts/risk_model.joblib")
    path.parent.mkdir(parents=True,exist_ok=True)
    joblib.dump(clf,path)
    print(f"Saved model to {path}")
    print(f"Synthetic holdout accuracy (not real-world performance): {accuracy_score(yte,pred):.3f}")
    print(classification_report(yte,pred,target_names=["low","medium","high"],zero_division=0))
    print("Confusion matrix:\n",confusion_matrix(yte,pred))

if __name__ == "__main__": main()
