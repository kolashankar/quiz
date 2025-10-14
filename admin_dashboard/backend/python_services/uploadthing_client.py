"""UploadThing Client for uploading images and files"""

import requests
import base64
import mimetypes
from typing import Dict, Any, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class UploadThingClient:
    """Client for UploadThing file upload service"""
    
    def __init__(self, secret_key: str, app_id: str):
        self.secret_key = secret_key
        self.app_id = app_id
        self.base_url = "https://uploadthing.com/api"
    
    def upload_file(self, file_data: bytes, filename: str, content_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload a file to UploadThing
        
        Args:
            file_data: Binary file data
            filename: Name of the file
            content_type: MIME type of the file
            
        Returns:
            Dictionary with upload result including URL
        """
        try:
            # Detect content type if not provided
            if not content_type:
                content_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
            
            # Prepare upload request
            headers = {
                'X-Uploadthing-Api-Key': self.secret_key,
                'X-Uploadthing-App-Id': self.app_id
            }
            
            # Create multipart form data
            files = {
                'file': (filename, file_data, content_type)
            }
            
            # Upload file
            response = requests.post(
                f"{self.base_url}/uploadFiles",
                headers=headers,
                files=files,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'url': result.get('url') or result.get('fileUrl'),
                    'file_id': result.get('key') or result.get('fileKey'),
                    'filename': filename
                }
            else:
                logger.error(f"UploadThing upload failed: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f"Upload failed with status {response.status_code}"
                }
                
        except Exception as e:
            logger.error(f"UploadThing upload error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def upload_base64_image(self, base64_data: str, filename: str) -> Dict[str, Any]:
        """
        Upload a base64-encoded image to UploadThing
        
        Args:
            base64_data: Base64-encoded image data
            filename: Name for the uploaded file
            
        Returns:
            Dictionary with upload result
        """
        try:
            # Decode base64
            image_bytes = base64.b64decode(base64_data)
            
            # Detect image format from magic bytes
            if image_bytes.startswith(b'\xff\xd8\xff'):
                content_type = 'image/jpeg'
            elif image_bytes.startswith(b'\x89PNG'):
                content_type = 'image/png'
            elif image_bytes.startswith(b'GIF'):
                content_type = 'image/gif'
            else:
                content_type = 'image/png'  # Default
            
            return self.upload_file(image_bytes, filename, content_type)
            
        except Exception as e:
            logger.error(f"Base64 image upload error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_file(self, file_key: str) -> Dict[str, Any]:
        """
        Delete a file from UploadThing
        
        Args:
            file_key: The unique key/ID of the file to delete
            
        Returns:
            Dictionary with deletion result
        """
        try:
            headers = {
                'X-Uploadthing-Api-Key': self.secret_key,
                'X-Uploadthing-App-Id': self.app_id
            }
            
            response = requests.delete(
                f"{self.base_url}/deleteFile",
                headers=headers,
                json={'key': file_key},
                timeout=10
            )
            
            if response.status_code == 200:
                return {'success': True}
            else:
                return {
                    'success': False,
                    'error': f"Delete failed with status {response.status_code}"
                }
                
        except Exception as e:
            logger.error(f"UploadThing delete error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
