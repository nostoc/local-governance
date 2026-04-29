def analyze_text(text: str):
    text_lower = text.lower()
    bad_words = ["spam", "fake", "idiot", "scam"]

    if any(word in text_lower for word in bad_words):
        return {"trust_score": 10, "is_spam": True}

    return {"trust_score": 95, "is_spam": False}
