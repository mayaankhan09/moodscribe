# ---- Imports ----
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone
from transformers import pipeline
from bson import ObjectId
from auth import hash_password, verify_password, create_access_token, decode_access_token
from database import users_collection, entries_collection

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Read the token from the request, verify it, return the user's id."""
    token = credentials.credentials
    user_id = decode_access_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user_id

# ---- Create the app once ----
app = FastAPI(title="MoodScribe Emotion API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Load the trained model once, at startup ----
classifier = pipeline(
    "text-classification",
    model="mayaankhan16/moodscribe-emotion",
    tokenizer="mayaankhan16/moodscribe-emotion",
)

# ---- Data shapes (Pydantic models) ----
class EntryText(BaseModel):
    text: str

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ---- Helper: turn raw top_k=None output into structured emotion data ----
def process_emotions(raw: list) -> dict:
    """
    raw: list of {"label": str, "score": float} dicts returned by the pipeline
         with top_k=None (all six emotions).
    Returns the top emotion, secondary emotion, and the full sorted breakdown.
    """
    sorted_results = sorted(raw, key=lambda x: x["score"], reverse=True)
    return {
        "emotion":             sorted_results[0]["label"],
        "confidence":          round(sorted_results[0]["score"], 4),
        "secondaryEmotion":    sorted_results[1]["label"] if len(sorted_results) > 1 else "",
        "secondaryConfidence": round(sorted_results[1]["score"], 4) if len(sorted_results) > 1 else 0.0,
        "allScores": [
            {"label": r["label"], "score": round(r["score"], 4)}
            for r in sorted_results
        ],
    }

# ---- Health-check endpoint ----
@app.get("/")
def root():
    return {"status": "MoodScribe API is running"}

# ---- Analyze text, return full emotion breakdown ----
@app.post("/analyze")
def analyze(entry: EntryText):
    raw = classifier(entry.text, top_k=None)
    return process_emotions(raw)

# ---- Register a new user ----
@app.post("/auth/register")
def register(user: UserRegister):
    existing = users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(user.password)
    new_user = {
        "name": user.name,
        "email": user.email,
        "passwordHash": hashed,
        "createdAt": datetime.now(timezone.utc),
    }
    result = users_collection.insert_one(new_user)
    return {
        "id": str(result.inserted_id),
        "name": user.name,
        "email": user.email,
    }

@app.post("/auth/login")
def login(credentials: UserLogin):
    user = users_collection.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]))
    return {"access_token": token, "token_type": "bearer"}

# ---- Save a new journal entry ----
@app.post("/entries")
def create_entry(entry: EntryText, user_id: str = Depends(get_current_user)):
    # Run the model — get ALL emotion scores
    raw  = classifier(entry.text, top_k=None)
    data = process_emotions(raw)

    new_entry = {
        "userId":              ObjectId(user_id),
        "text":                entry.text,
        "emotion":             data["emotion"],
        "confidence":          data["confidence"],
        "secondaryEmotion":    data["secondaryEmotion"],
        "secondaryConfidence": data["secondaryConfidence"],
        "allScores":           data["allScores"],
        "createdAt":           datetime.now(timezone.utc),
    }
    saved = entries_collection.insert_one(new_entry)

    return {
        "id":                  str(saved.inserted_id),
        "text":                entry.text,
        "emotion":             data["emotion"],
        "confidence":          data["confidence"],
        "secondaryEmotion":    data["secondaryEmotion"],
        "secondaryConfidence": data["secondaryConfidence"],
        "allScores":           data["allScores"],
        "createdAt":           new_entry["createdAt"].isoformat(),
    }

# ---- Fetch all entries for the logged-in user ----
@app.get("/entries")
def get_entries(user_id: str = Depends(get_current_user)):
    cursor = entries_collection.find({"userId": ObjectId(user_id)}).sort("createdAt", -1)

    entries = []
    for e in cursor:
        entries.append({
            "id":                  str(e["_id"]),
            "text":                e["text"],
            "emotion":             e["emotion"],
            "confidence":          e["confidence"],
            # Graceful fallback for entries saved before this feature was added
            "secondaryEmotion":    e.get("secondaryEmotion", ""),
            "secondaryConfidence": e.get("secondaryConfidence", 0.0),
            "allScores":           e.get("allScores", []),
            "createdAt":           e["createdAt"].isoformat(),
        })
    return entries
