from pymongo import MongoClient
from pymongo.errors import PyMongoError
from app.config import settings

_client = None

def get_db():
    global _client
    try:
        if _client is None:
            _client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=1500)
        db = _client[settings.mongodb_database]
        db.command("ping")
        return db
    except PyMongoError as exc:
        raise RuntimeError("MongoDB unavailable. Start MongoDB and check MONGODB_URI.") from exc

def close_client():
    global _client
    if _client is not None:
        _client.close()
        _client = None
