from fastapi import FastAPI
from pydantic import BaseModel

from shared.moderation import analyze_text

app = FastAPI()


class ReportData(BaseModel):
    report_id: str
    text: str


@app.post("/moderate/text")
def moderate_text(report: ReportData):
    result = analyze_text(report.text)

    return {
        "report_id": report.report_id,
        "trust_score": result["trust_score"],
        "is_spam": result["is_spam"],
    }
