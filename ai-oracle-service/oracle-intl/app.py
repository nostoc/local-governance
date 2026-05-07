from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(title="International Oracle")


class ReportRequest(BaseModel):
    report_id: Optional[str] = None
    text: str
    category: Optional[str] = None
    location: Optional[str] = None
    media_hashes: List[str] = []


@app.get("/")
def root():
    return {"oracle": "INTL_ORACLE", "status": "running"}


@app.post("/analyze")
def analyze_report(report: ReportRequest):
    text = report.text.lower()

    spam_keywords = [
        "buy now", "free money", "click here", "promotion",
        "lottery", "crypto giveaway", "earn fast", "limited offer"
    ]

    matches = [word for word in spam_keywords if word in text]
    repeated_chars = any(char * 6 in text for char in "abcdefghijklmnopqrstuvwxyz")
    too_short = len(text.split()) < 4

    if matches or repeated_chars:
        vote = "REJECT"
        confidence = 0.90
        explanation = "SPAM_PATTERN_DETECTED"
    elif too_short:
        vote = "REVIEW"
        confidence = 0.60
        explanation = "REPORT_TOO_SHORT"
    else:
        vote = "ACCEPT"
        confidence = 0.80
        explanation = "NO_SPAM_PATTERN_DETECTED"

    return {
        "oracle_id": "INTL_ORACLE",
        "vote": vote,
        "confidence": confidence,
        "model_name": "rule-based-spam-detector",
        "model_version": "1.0.0",
        "explanation_code": explanation,
        "details": {
            "matched_keywords": matches,
            "repeated_chars": repeated_chars,
            "too_short": too_short
        }
    }