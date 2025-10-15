from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent.parent
load_dotenv(ROOT_DIR / '.env')

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Quiz App API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    MONGO_URL: str = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    DB_NAME: str = os.getenv('DB_NAME', 'quiz_app_db')
    
    # Security
    JWT_SECRET: str = os.getenv('JWT_SECRET', 'quiz_admin_jwt_secret_key_2024_secure')
    JWT_ALGORITHM: str = os.getenv('JWT_ALGORITHM', 'HS256')
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', 10080))  # 7 days
    
    # AI
    GEMINI_API_KEY: str = os.getenv('GEMINI_API_KEY', '')
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:19006"
    
    def get_cors_origins(self) -> list:
        """Convert comma-separated origins to list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    # Server
    PORT: int = int(os.getenv('PORT', 8001))
    HOST: str = os.getenv('HOST', '0.0.0.0')
    
    # File Upload
    MAX_FILE_SIZE: str = "10mb"
    UPLOAD_PATH: str = "./uploads"
    
    # SMTP
    SMTP_HOST: str = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    SMTP_PORT: int = int(os.getenv('SMTP_PORT', 587))
    SMTP_USER: str = os.getenv('SMTP_USER', '')
    SMTP_PASS: str = os.getenv('SMTP_PASS', '')
    SMTP_FROM: str = os.getenv('SMTP_FROM', 'Quiz App <noreply@quizapp.com>')
    
    class Config:
        case_sensitive = True

settings = Settings()
