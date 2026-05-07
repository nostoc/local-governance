from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

app = FastAPI(title="NGO Oracle")

analyzer = SentimentIntensityAnalyzer()


class ReportRequest(BaseModel):
    report_id: Optional[str] = None
    text: str
    category: Optional[str] = None
    location: Optional[str] = None
    media_hashes: List[str] = []


@app.get("/")
def root():
    return {"oracle": "NGO_ORACLE", "status": "running"}


@app.post("/analyze")
def analyze_report(report: ReportRequest):
    text = report.text.lower()

    civic_keywords = [
        "road", "pothole", "garbage", "waste", "streetlight",
        "water", "drainage", "sewage", "bridge", "traffic",
        "public", "park", "flood", "damage", "broken",
        "canal", "street", "school", "hospital"
    ]

    matches = [word for word in civic_keywords if word in text]
    sentiment = analyzer.polarity_scores(text)

    if len(matches) >= 1:
        vote = "ACCEPT"
        confidence = 0.82
        explanation = "CIVIC_ISSUE_DETECTED"
    elif sentiment["compound"] <= -0.4:
        vote = "REVIEW"
        confidence = 0.62
        explanation = "NEGATIVE_BUT_CIVIC_CONTEXT_UNCLEAR"
    else:
        vote = "REVIEW"
        confidence = 0.55
        explanation = "CIVIC_RELEVANCE_UNCLEAR"

    return {
        "oracle_id": "NGO_ORACLE",
        "vote": vote,
        "confidence": confidence,
        "model_name": "vader-plus-civic-keywords",
        "model_version": "1.0.0",
        "explanation_code": explanation,
        "details": {
            "matched_civic_keywords": matches,
            "sentiment": sentiment
        }
    }