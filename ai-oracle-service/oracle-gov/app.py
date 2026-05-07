from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(title="Government Oracle")


class ReportRequest(BaseModel):
    report_id: Optional[str] = None
    text: str
    category: Optional[str] = None
    location: Optional[str] = None
    media_hashes: List[str] = []


@app.get("/")
def root():
    return {"oracle": "GOV_ORACLE", "status": "running"}


@app.post("/analyze")
def analyze_report(report: ReportRequest):
    text = report.text.lower()

    toxic_keywords = [
        "kill", "bomb", "attack", "hate", "terrorist",
        "idiot", "stupid", "racist", "threat"
    ]

    matches = [word for word in toxic_keywords if word in text]

    if len(matches) >= 2:
        vote = "REJECT"
        confidence = 0.88
        explanation = "TOXIC_LANGUAGE_DETECTED"
    elif len(matches) == 1:
        vote = "REVIEW"
        confidence = 0.65
        explanation = "POSSIBLE_TOXIC_LANGUAGE"
    else:
        vote = "ACCEPT"
        confidence = 0.78
        explanation = "NO_TOXIC_LANGUAGE_DETECTED"

    return {
        "oracle_id": "GOV_ORACLE",
        "vote": vote,
        "confidence": confidence,
        "model_name": "keyword-toxicity-prototype",
        "model_version": "1.0.0",
        "explanation_code": explanation,
        "details": {
            "matched_keywords": matches
        }
    }