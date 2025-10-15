from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from core.config import settings

class Database:
    client: Optional[AsyncIOMotorClient] = None
    
    @classmethod
    def get_client(cls) -> AsyncIOMotorClient:
        if cls.client is None:
            cls.client = AsyncIOMotorClient(settings.MONGO_URL)
        return cls.client
    
    @classmethod
    def get_database(cls):
        client = cls.get_client()
        return client[settings.DB_NAME]
    
    @classmethod
    async def close(cls):
        if cls.client:
            cls.client.close()

def get_database():
    return Database.get_database()

# Alias for convenience
get_db = get_database
