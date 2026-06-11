import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load the secrets from .env into the environment
load_dotenv()

# Read the connection string (never hard-code it)
MONGODB_URI = os.getenv("MONGODB_URI")

# Connect to your Atlas cluster
client = MongoClient(MONGODB_URI)

# Pick the database and the two collections we'll use
db = client["moodscribe"]
users_collection = db["users"]
entries_collection = db["entries"]
# Ensure no two users can share an email
users_collection.create_index("email", unique=True)