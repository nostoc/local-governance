import os
import json
import hashlib
import requests
from collections import Counter
from typing import Optional, List, Dict
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from eth_account import Account
from eth_account.messages import encode_defunct

load_dotenv()

app = FastAPI(title="AI Oracle Aggregator")

AGGREGATOR_PRIVATE_KEY = os.getenv("AGGREGATOR_PRIVATE_KEY")
ORACLE_API_KEY = os.getenv("ORACLE_API_KEY", "change-this-secret")

ORACLE_URLS = {
    "gov": "http://oracle-gov:8001/analyze",
    "intl": "http://oracle-intl:8002/analyze",
    "ngo": "http://oracle-ngo:8003/analyze"
}


class ReportRequest(BaseModel):
    report_id: Optional[str] = None
    text: str
    category: Optional[str] = None
    location: Optional[str] = None
    timestamp: Optional[str] = None
    media_hashes: List[str] = []
    ticket_hash: Optional[str] = None
    citizen_public_key: Optional[str] = None
    citizen_signature: Optional[str] = None


def canonical_json(data: dict) -> str:
    return json.dumps(data, sort_keys=True, separators=(",", ":"))


def sha256_hash(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def hash_dict(data: dict) -> str:
    return sha256_hash(canonical_json(data))


def sign_hash(message_hash: str) -> str:
    if not AGGREGATOR_PRIVATE_KEY:
        return ""

    message = encode_defunct(text=message_hash)
    signed = Account.sign_message(message, private_key=AGGREGATOR_PRIVATE_KEY)
    return signed.signature.hex()


def aggregate_votes(votes: List[Dict]):
    vote_values = [v["vote"] for v in votes]
    counter = Counter(vote_values)

    if counter["ACCEPT"] >= 2:
        final_decision = "ACCEPT"
    elif counter["REJECT"] >= 2:
        final_decision = "REJECT"
    else:
        final_decision = "REVIEW"

    selected_confidences = [
        v["confidence"] for v in votes if v["vote"] == final_decision
    ]

    if selected_confidences:
        final_confidence = sum(selected_confidences) / len(selected_confidences)
    else:
        final_confidence = sum(v["confidence"] for v in votes) / len(votes)

    return final_decision, round(final_confidence, 4)


@app.get("/")
def root():
    return {
        "service": "AI_ORACLE_AGGREGATOR",
        "status": "running",
        "oracle_workers": list(ORACLE_URLS.keys())
    }


@app.post("/moderate/report")
def moderate_report(
    report: ReportRequest,
    x_api_key: Optional[str] = Header(default=None)
):
    if x_api_key != ORACLE_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    if not report.text.strip():
        raise HTTPException(status_code=400, detail="Report text cannot be empty")

    report_dict = report.model_dump()
    report_hash = hash_dict(report_dict)

    oracle_votes = []

    for oracle_name, oracle_url in ORACLE_URLS.items():
        try:
            response = requests.post(oracle_url, json=report_dict, timeout=5)
            response.raise_for_status()
            oracle_votes.append(response.json())
        except Exception as e:
            oracle_votes.append({
                "oracle_id": oracle_name.upper() + "_ORACLE",
                "vote": "REVIEW",
                "confidence": 0.0,
                "model_name": "unavailable",
                "model_version": "unknown",
                "explanation_code": "ORACLE_UNAVAILABLE",
                "details": {"error": str(e)}
            })

    final_decision, final_confidence = aggregate_votes(oracle_votes)

    decision_data = {
        "report_hash": report_hash,
        "final_decision": final_decision,
        "final_confidence": final_confidence,
        "oracle_votes": oracle_votes
    }

    decision_hash = hash_dict(decision_data)
    aggregator_signature = sign_hash(decision_hash)

    return {
        "final_decision": final_decision,
        "final_confidence": final_confidence,
        "report_hash": report_hash,
        "decision_hash": decision_hash,
        "oracle_votes": oracle_votes,
        "aggregator_signature": aggregator_signature
    }