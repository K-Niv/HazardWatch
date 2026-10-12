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

# Create an index for fast location lookups
try:
    weather_cache_collection.create_index([("lat", 1), ("lon", 1)])
except Exception as e:
    logger.warning("Could not create index on weather_cache: %s", e)


def check_connection() -> bool:
    """Check if the connection to MongoDB is healthy."""
    try:
        client.admin.command("ping")
        return True
    except Exception as e:
        logger.error("MongoDB ping failed: %s", e)
        return False