from app.agents import LearningGapAgent, RecommendationAgent

def test_gap_detection():
    result = LearningGapAgent().run([{"topic":"PCA","score":40},
      {"topic":"Regression","score":55},{"topic":"Clustering","score":91}])
    assert [x["topic"] for x in result["weak_topics"]] == ["PCA","Regression"]
    assert result["strong_topics"][0]["topic"] == "Clustering"

def test_recommendations_prioritize_low_score():
    result = RecommendationAgent().run([{"topic":"PCA","score":40},
      {"topic":"Regression","score":70}], hours=6)
    assert result["study_plan"][0]["topic"] == "PCA"
    assert result["weekly_hours"] == 6
