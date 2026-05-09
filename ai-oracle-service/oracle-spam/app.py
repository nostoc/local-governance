import re
from typing import Any, Dict, List

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Oracle 2 - Spam and Abuse Oracle")


class MediaItem(BaseModel):
    file_name: str
    mime_type: str
    sha256: str
    base64: str
    size_bytes: int


class OracleRequest(BaseModel):
    metadata: Dict[str, Any]
    media: List[MediaItem] = []
    text_hash: str
    media_hashes: List[str] = []
    report_hash: str
    request_hash: str


SPAM_PHRASES = [
    "buy now",
    "free money",
    "click here",
    "limited offer",
    "earn fast",
    "crypto giveaway",
    "lottery winner",
    "work from home",
    "guaranteed income",
    "subscribe now",
]

PROMOTIONAL_WORDS = [
    "discount",
    "promotion",
    "offer",
    "sale",
    "coupon",
    "deal",
    "sponsor",
]

URL_REGEX = re.compile(r"(https?://|www\.)", re.IGNORECASE)


@app.get("/")
def root():
    return {"oracle_id": "ORACLE_2_SPAM_ABUSE", "status": "running"}


def repeated_character_pattern(text: str) -> bool:
    return bool(re.search(r"(.)\1{6,}", text))


def excessive_symbols(text: str) -> bool:
    symbol_count = sum(1 for char in text if char in "!@#$%^&*_=+~")
    return symbol_count > 10


def analyze_spam(text: str) -> Dict[str, Any]:
    lower = text.lower().strip()
    words = [w for w in re.split(r"\s+", lower) if w]

    word_count = len(words)
    url_count = len(URL_REGEX.findall(lower))

    matched_spam_phrases = [phrase for phrase in SPAM_PHRASES if phrase in lower]
    matched_promotional_words = [word for word in PROMOTIONAL_WORDS if word in lower]

    repeated_chars = repeated_character_pattern(lower)
    symbols = excessive_symbols(lower)

    reasons = []
    score = 0.0

    if word_count < 5:
        reasons.append("TOO_SHORT")
        score += 0.35

    if matched_spam_phrases:
        reasons.append("SPAM_PHRASE_DETECTED")
        score += 0.80

    if matched_promotional_words:
        reasons.append("PROMOTIONAL_LANGUAGE_DETECTED")
        score += 0.35

    if url_count > 1:
        reasons.append("MULTIPLE_URLS_DETECTED")
        score += 0.60
    elif url_count == 1:
        reasons.append("URL_DETECTED")
        score += 0.25

    if repeated_chars:
        reasons.append("REPEATED_CHARACTER_PATTERN")
        score += 0.50

    if symbols:
        reasons.append("EXCESSIVE_SYMBOLS")
        score += 0.40

    spam_score = min(score, 1.0)

    if spam_score >= 0.60:
        return {
            "is_spam": True,
            "confidence": round(spam_score, 4),
            "explanation_code": "SPAM_OR_LOW_QUALITY_DETECTED",
            "details": {
                "word_count": word_count,
                "url_count": url_count,
                "matched_spam_phrases": matched_spam_phrases,
                "matched_promotional_words": matched_promotional_words,
                "repeated_character_pattern": repeated_chars,
                "excessive_symbols": symbols,
                "reasons": reasons,
                "spam_score": spam_score,
            },
        }

    return {
        "is_spam": False,
        "confidence": round(1.0 - spam_score, 4),
        "explanation_code": "NO_SPAM_DETECTED",
        "details": {
            "word_count": word_count,
            "url_count": url_count,
            "matched_spam_phrases": matched_spam_phrases,
            "matched_promotional_words": matched_promotional_words,
            "repeated_character_pattern": repeated_chars,
            "excessive_symbols": symbols,
            "reasons": reasons,
            "spam_score": spam_score,
        },
    }


@app.post("/analyze")
def analyze(payload: OracleRequest):
    text = payload.metadata.get("text", "")
    result = analyze_spam(text)

    if result["is_spam"]:
        vote = "REJECT"
    else:
        vote = "ACCEPT"

    return {
        "oracle_id": "ORACLE_2_SPAM_ABUSE",
        "vote": vote,
        "confidence": result["confidence"],
        "explanation_code": result["explanation_code"],
        "model_name": "spam-abuse-rules-v1",
        "model_version": "1.0.0",
        "critical_violation": False,
        "details": result["details"],
    }