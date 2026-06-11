from database import client

client.admin.command("ping")
print("Connected to MongoDB Atlas!")