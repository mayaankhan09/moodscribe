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
    model="model",
    tokenizer="model",
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

# ---- Health-check endpoint ----
@app.get("/")
def root():
    return {"status": "MoodScribe API is running"}

# ---- Analyze text, return an emotion ----
@app.post("/analyze")
def analyze(entry: EntryText):
    result = classifier(entry.text)[0]
    return {
        "emotion": result["label"],
        "confidence": round(result["score"], 4),
    }

# ---- Register a new user ----
@app.post("/auth/register")
def register(user: UserRegister):
    # 1. Has someone already registered this email?
    existing = users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Hash the password — never store the real one
    hashed = hash_password(user.password)

    # 3. Build the user document (matches our schema)
    new_user = {
        "name": user.name,
        "email": user.email,
        "passwordHash": hashed,
        "createdAt": datetime.now(timezone.utc),
    }

    # 4. Save it to MongoDB
    result = users_collection.insert_one(new_user)

    # 5. Respond — never send the password back
    return {
        "id": str(result.inserted_id),
        "name": user.name,
        "email": user.email,
    }
@app.post("/auth/login")
def login(credentials: UserLogin):
    # 1. Find the user by email
    user = users_collection.find_one({"email": credentials.email})

    # 2. Check the user exists AND the password matches the stored hash
    if not user or not verify_password(credentials.password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # 3. Credentials good — issue a signed token
    token = create_access_token(str(user["_id"]))

    return {"access_token": token, "token_type": "bearer"}

@app.post("/entries")
def create_entry(entry: EntryText, user_id: str = Depends(get_current_user)):
    # 1. Analyze the text with the emotion model
    result = classifier(entry.text)[0]

    # 2. Build the entry document (matches our schema)
    new_entry = {
        "userId": ObjectId(user_id),
        "text": entry.text,
        "emotion": result["label"],
        "confidence": round(result["score"], 4),
        "createdAt": datetime.now(timezone.utc),
    }

    # 3. Save it
    saved = entries_collection.insert_one(new_entry)

    # 4. Return the created entry
    return {
        "id": str(saved.inserted_id),
        "text": entry.text,
        "emotion": result["label"],
        "confidence": round(result["score"], 4),
        "createdAt": new_entry["createdAt"].isoformat(),
    }
@app.get("/entries")
def get_entries(user_id: str = Depends(get_current_user)):
    # Find ONLY this user's entries, newest first
    cursor = entries_collection.find({"userId": ObjectId(user_id)}).sort("createdAt", -1)

    entries = []
    for e in cursor:
        entries.append({
            "id": str(e["_id"]),
            "text": e["text"],
            "emotion": e["emotion"],
            "confidence": e["confidence"],
            "createdAt": e["createdAt"].isoformat(),
        })
    return entries
