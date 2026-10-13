import logging
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from config import settings

logger = logging.getLogger(__name__)

# Initialize MongoDB client with a connection timeout
client = MongoClient(
    settings.MONGODB_URI,
    server_api=ServerApi("1"),
    serverSelectionTimeoutMS=5000,
)
db = client[settings.MONGODB_DB_NAME]
weather_cache_collection = db["weather_cache"]


def init_db() -> None:
    """Create indexes and verify connectivity. Call from FastAPI lifespan startup."""
    try:
        weather_cache_collection.create_index([
            ("lat", 1), ("lon", 1), ("start_date", 1), ("end_date", 1)
        ])
        logger.info("MongoDB indexes ensured on weather_cache.")
    except Exception as e:
        logger.warning("Could not create index on weather_cache: %s", e)


def close_db() -> None:
    """Close the MongoDB client connection. Call from FastAPI lifespan shutdown."""
    client.close()
    logger.info("MongoDB connection closed.")


def check_connection() -> bool:
    """Check if the connection to MongoDB is healthy."""
    try:
        client.admin.command("ping")
        return True
    except Exception as e:
        logger.error("MongoDB ping failed: %s", e)
        return False