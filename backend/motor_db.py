from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi

MONGO_URI = "mongodb+srv://mediboinamohit123:OtetGe3EltQiycWu@cluster0.mylgnf3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = None
db = None

async def connect_to_mongo():
    global client, db
    client = AsyncIOMotorClient(MONGO_URI, server_api=ServerApi("1"))
    db = client["test"]  # default DB name if none specified in URI
    # Try a quick ping to verify connection
    await client.admin.command("ping")
    print("✅ MongoDB connected and ping successful!")

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("🛑 MongoDB connection closed.")
