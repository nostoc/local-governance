FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for transformers and NLP models
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project
COPY . .

# Default entrypoint; can be overridden
ENTRYPOINT ["python"]
CMD ["scripts/run_gov_oracle.py"]
