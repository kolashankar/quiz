"""
PDF Processing Service with Progress Tracking
Sprint 2 Implementation
"""

import io
import hashlib
import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import redis
import os

# Redis client for caching (optional, will work without Redis)
try:
    redis_client = redis.Redis(
        host=os.getenv('REDIS_HOST', 'localhost'),
        port=int(os.getenv('REDIS_PORT', 6379)),
        db=0,
        decode_responses=True
    )
    REDIS_AVAILABLE = True
except:
    REDIS_AVAILABLE = False
    redis_client = None

class PDFProcessor:
    """Handles PDF processing with progress tracking and caching"""
    
    # File size limits
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    
    # Cache settings
    CACHE_EXPIRY = 3600 * 24  # 24 hours
    
    def __init__(self):
        self.progress_data = {}
    
    def validate_file(self, file_content: bytes, filename: str) -> tuple[bool, Optional[str]]:
        """
        Validate uploaded PDF file
        Returns: (is_valid, error_message)
        """
        # Check file size
        file_size = len(file_content)
        if file_size > self.MAX_FILE_SIZE:
            size_mb = file_size / (1024 * 1024)
            return False, f"File size ({size_mb:.2f}MB) exceeds maximum allowed size (50MB)"
        
        # Check file type (basic validation)
        if not filename.lower().endswith('.pdf'):
            return False, "Only PDF files are allowed"
        
        # Check PDF magic bytes
        if not file_content.startswith(b'%PDF'):
            return False, "Invalid PDF file format"
        
        return True, None
    
    def get_file_hash(self, content: bytes) -> str:
        """Generate hash for file content to use as cache key"""
        return hashlib.md5(content).hexdigest()
    
    def get_cached_result(self, file_hash: str, exam: str, subject: str) -> Optional[Dict[str, Any]]:
        """Get cached PDF analysis result"""
        if not REDIS_AVAILABLE:
            return None
        
        try:
            cache_key = f"pdf_analysis:{file_hash}:{exam}:{subject}"
            cached_data = redis_client.get(cache_key)
            
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            print(f"Cache retrieval error: {e}")
        
        return None
    
    def cache_result(self, file_hash: str, exam: str, subject: str, result: Dict[str, Any]):
        """Cache PDF analysis result"""
        if not REDIS_AVAILABLE:
            return
        
        try:
            cache_key = f"pdf_analysis:{file_hash}:{exam}:{subject}"
            redis_client.setex(
                cache_key,
                self.CACHE_EXPIRY,
                json.dumps(result)
            )
        except Exception as e:
            print(f"Cache storage error: {e}")
    
    def set_progress(self, job_id: str, step: str, percentage: int, message: str):
        """Update progress for a PDF processing job"""
        progress_data = {
            "job_id": job_id,
            "step": step,
            "percentage": percentage,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "processing" if percentage < 100 else "completed"
        }
        
        # Store in memory
        self.progress_data[job_id] = progress_data
        
        # Also store in Redis if available
        if REDIS_AVAILABLE:
            try:
                redis_client.setex(
                    f"progress:{job_id}",
                    1800,  # 30 minutes
                    json.dumps(progress_data)
                )
            except Exception as e:
                print(f"Progress storage error: {e}")
    
    def get_progress(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get progress for a PDF processing job"""
        # Try Redis first
        if REDIS_AVAILABLE:
            try:
                data = redis_client.get(f"progress:{job_id}")
                if data:
                    return json.loads(data)
            except Exception as e:
                print(f"Progress retrieval error: {e}")
        
        # Fallback to memory
        return self.progress_data.get(job_id)
    
    def clear_progress(self, job_id: str):
        """Clear progress data for a completed job"""
        if job_id in self.progress_data:
            del self.progress_data[job_id]
        
        if REDIS_AVAILABLE:
            try:
                redis_client.delete(f"progress:{job_id}")
            except Exception as e:
                print(f"Progress deletion error: {e}")

# Global instance
pdf_processor = PDFProcessor()
