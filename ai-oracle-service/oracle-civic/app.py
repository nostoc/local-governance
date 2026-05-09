import base64
import io
import os
from typing import Any, Dict, List, Optional

from fastapi import FastAPI
from pydantic import BaseModel
from PIL import Image

app = FastAPI(title="Oracle 3 - Civic Relevance Oracle")

ENABLE_CLIP_RELEVANCE = os.getenv("ENABLE_CLIP_RELEVANCE", "false").lower() == "true"

clip_classifier = None


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


CIVIC_KEYWORDS = {
    "Road Damage": ["road", "pothole", "bridge", "sidewalk", "street", "crack", "hole"],
    "Waste Management": ["garbage", "waste", "trash", "dump", "bin", "rubbish"],
    "Streetlight Issue": ["streetlight", "lamp", "light", "dark", "pole"],
    "Drainage / Sewage": ["drain", "drainage", "sewage", "canal", "blocked", "overflow"],
    "Water Supply": ["water", "pipe", "leak", "supply", "tap"],
    "Flooding": ["flood", "waterlogged", "rain", "overflow"],
    "Public Property Damage": ["broken", "damaged", "park", "bench", "sign", "public"],
    "Traffic / Road Safety": ["traffic", "accident", "crossing", "signal", "vehicle"],
    "Environmental Issue": ["pollution", "smoke", "tree", "river", "chemical", "noise"],
    "Other": ["public", "community", "government", "municipal", "issue", "problem"],
}

CATEGORY_PROMPTS = {
    "Road Damage": [
        "a damaged road",
        "a pothole on a road",
        "a broken street",
        "road infrastructure damage",
    ],
    "Waste Management": [
        "garbage on a street",
        "trash dumped in public",
        "waste management problem",
    ],
    "Streetlight Issue": [
        "a streetlight pole",
        "a public street light",
        "a road at night with streetlights",
    ],
    "Drainage / Sewage": [
        "a blocked drain",
        "sewage water",
        "drainage problem",
    ],
    "Water Supply": [
        "a leaking water pipe",
        "water supply issue",
        "public water leak",
    ],
    "Flooding": [
        "flooded road",
        "waterlogged street",
        "urban flooding",
    ],
    "Public Property Damage": [
        "damaged public property",
        "broken public bench",
        "damaged sign board",
    ],
    "Traffic / Road Safety": [
        "traffic on road",
        "road safety issue",
        "traffic signal",
    ],
    "Environmental Issue": [
        "pollution",
        "environmental damage",
        "dirty river",
    ],
}


def load_models():
    global clip_classifier

    if not ENABLE_CLIP_RELEVANCE:
        return

    try:
        from transformers import pipeline

        clip_classifier = pipeline(
            "zero-shot-image-classification",
            model="openai/clip-vit-base-patch32",
        )
    except Exception as e:
        print(f"[Civic Oracle] CLIP loading failed. Keyword mode enabled. Error: {e}")
        clip_classifier = None

@app.on_event("startup")
def startup():
    load_models()


@app.get("/")
def root():
    return {
        "oracle_id": "ORACLE_3_CIVIC_RELEVANCE",
        "status": "running",
        "clip_relevance_enabled": ENABLE_CLIP_RELEVANCE,
    }


def decode_image(media: MediaItem) -> Optional[Image.Image]:
    try:
        raw = base64.b64decode(media.base64)
        image = Image.open(io.BytesIO(raw)).convert("RGB")
        return image
    except Exception:
        return None


def find_civic_matches(text: str) -> Dict[str, Any]:
    lower = text.lower()
    category_matches = {}

    for category, keywords in CIVIC_KEYWORDS.items():
        matches = [keyword for keyword in keywords if keyword.lower() in lower]
        if matches:
            category_matches[category] = matches

    all_matches = []
    for matches in category_matches.values():
        all_matches.extend(matches)

    return {
        "category_matches": category_matches,
        "all_matches": list(set(all_matches)),
    }


def analyze_text_relevance(text: str, selected_category: str) -> Dict[str, Any]:
    matches = find_civic_matches(text)

    category_matches = matches["category_matches"]
    all_matches = matches["all_matches"]

    selected_category_matches = category_matches.get(selected_category, [])

    if not all_matches:
        return {
            "civic_relevant": False,
            "confidence": 0.90,
            "explanation_code": "LOW_CIVIC_RELEVANCE",
            "details": {
                "selected_category": selected_category,
                "category_matches": category_matches,
                "all_matches": all_matches,
            },
        }

    if selected_category_matches:
        return {
            "civic_relevant": True,
            "confidence": 0.85,
            "explanation_code": "CATEGORY_AND_CIVIC_RELEVANCE_MATCH",
            "details": {
                "selected_category": selected_category,
                "category_matches": category_matches,
                "all_matches": all_matches,
            },
        }

    return {
        "civic_relevant": True,
        "confidence": 0.68,
        "explanation_code": "CIVIC_RELEVANCE_DETECTED_CATEGORY_MISMATCH",
        "details": {
            "selected_category": selected_category,
            "category_matches": category_matches,
            "all_matches": all_matches,
        },
    }


def analyze_image_relevance(media: List[Dict[str, Any]], selected_category: str) -> Dict[str, Any]:
    if not media:
        return {
            "image_relevance": "NO_IMAGE_PROVIDED",
            "confidence": 1.0,
            "details": [],
        }

    return {
        "image_relevance": "NOT_EVALUATED_TEXT_PRIMARY",
        "confidence": 0.7,
        "details": [
            {
                "file_name": item.get("file_name", "unknown"),
                "mode": "clip_disabled",
                "note": "Image relevance not evaluated. Text relevance is primary.",
            }
            for item in media
        ],
    }
@app.post("/analyze")
def analyze(payload: Dict[str, Any]):
    metadata = payload.get("metadata", {})
    media = payload.get("media", [])

    text = metadata.get("text", "")
    category = metadata.get("category", "Other")

    text_result = analyze_text_relevance(text, category)
    image_result = analyze_image_relevance(media, category)

    if not text_result["civic_relevant"]:
        return {
            "oracle_id": "ORACLE_3_CIVIC_RELEVANCE",
            "vote": "REJECT",
            "confidence": text_result["confidence"],
            "explanation_code": text_result["explanation_code"],
            "model_name": "civic-keyword-relevance-v1",
            "model_version": "1.0.0",
            "critical_violation": False,
            "details": {
                "text_relevance": text_result,
                "image_relevance": image_result,
            },
        }

    return {
        "oracle_id": "ORACLE_3_CIVIC_RELEVANCE",
        "vote": "ACCEPT",
        "confidence": text_result["confidence"],
        "explanation_code": text_result["explanation_code"],
        "model_name": "civic-keyword-image-relevance-v1",
        "model_version": "1.0.0",
        "critical_violation": False,
        "details": {
            "text_relevance": text_result,
            "image_relevance": image_result,
        },
    }