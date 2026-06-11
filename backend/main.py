import sys
print(sys.executable)
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

# 1. Create the app (this is your "waiter")
app = FastAPI(title="MoodScribe Emotion API")

# 2. Load the trained model once, when the server starts
classifier = pipeline(
    "text-classification",
    model="model",
    tokenizer="model",
)

# 3. Describe the shape of the data we expect to receive
class EntryText(BaseModel):
    text: str

# 4. A simple "is it alive?" endpoint
@app.get("/")
def root():
    return {"status": "MoodScribe API is running"}

# 5. The main endpoint: receive text, return an emotion
@app.post("/analyze")
def analyze(entry: EntryText):
    result = classifier(entry.text)[0]
    return {
        "emotion": result["label"],
        "confidence": round(result["score"], 4),
    }