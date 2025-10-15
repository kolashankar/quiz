"""
Content Service - Business logic for content management
Handles CRUD operations for hierarchical content structure
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException

from core.database import get_database


class ContentService:
    """Service for managing hierarchical content (Exam -> Subject -> Chapter -> Topic -> SubTopic -> Section -> SubSection)"""
    
    @staticmethod
    async def create_entity(collection_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generic method to create an entity in any collection
        
        Args:
            collection_name: Name of the MongoDB collection
            data: Entity data to insert
            
        Returns:
            Created entity with _id
        """
        db = get_database()
        collection = getattr(db, collection_name)
        
        entity_dict = {
            **data,
            "created_at": datetime.utcnow()
        }
        
        result = await collection.insert_one(entity_dict)
        entity_dict["_id"] = result.inserted_id
        
        return entity_dict
    
    @staticmethod
    async def get_entities(collection_name: str, filter_query: Optional[Dict[str, Any]] = None, limit: int = 1000) -> List[Dict[str, Any]]:
        """
        Generic method to get entities from any collection
        
        Args:
            collection_name: Name of the MongoDB collection
            filter_query: Optional filter criteria
            limit: Maximum number of results
            
        Returns:
            List of entities
        """
        db = get_database()
        collection = getattr(db, collection_name)
        
        query = filter_query if filter_query else {}
        entities = await collection.find(query).to_list(limit)
        
        return entities
    
    @staticmethod
    async def get_entity_by_id(collection_name: str, entity_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a single entity by ID
        
        Args:
            collection_name: Name of the MongoDB collection
            entity_id: Entity ID
            
        Returns:
            Entity dict or None
        """
        db = get_database()
        collection = getattr(db, collection_name)
        
        try:
            entity = await collection.find_one({"_id": ObjectId(entity_id)})
            return entity
        except Exception:
            return None
    
    @staticmethod
    async def update_entity(collection_name: str, entity_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generic method to update an entity
        
        Args:
            collection_name: Name of the MongoDB collection
            entity_id: Entity ID to update
            update_data: Data to update
            
        Returns:
            Updated entity
            
        Raises:
            HTTPException: If entity not found
        """
        db = get_database()
        collection = getattr(db, collection_name)
        
        result = await collection.update_one(
            {"_id": ObjectId(entity_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail=f"{collection_name.capitalize()} not found")
        
        updated_entity = await collection.find_one({"_id": ObjectId(entity_id)})
        return updated_entity
    
    @staticmethod
    async def delete_entity(collection_name: str, entity_id: str) -> bool:
        """
        Generic method to delete an entity
        
        Args:
            collection_name: Name of the MongoDB collection
            entity_id: Entity ID to delete
            
        Returns:
            True if deleted
            
        Raises:
            HTTPException: If entity not found
        """
        db = get_database()
        collection = getattr(db, collection_name)
        
        result = await collection.delete_one({"_id": ObjectId(entity_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail=f"{collection_name.capitalize()} not found")
        
        return True
    
    @staticmethod
    async def get_hierarchy_path(entity_type: str, entity_id: str) -> List[Dict[str, Any]]:
        """
        Get the full hierarchical path for an entity
        
        Args:
            entity_type: Type of entity (exam, subject, chapter, etc.)
            entity_id: Entity ID
            
        Returns:
            List of entities in hierarchical order
        """
        # Define hierarchy relationships
        hierarchy = {
            "subsection": ["section", "sub_topic", "topic", "chapter", "subject", "exam"],
            "section": ["sub_topic", "topic", "chapter", "subject", "exam"],
            "sub_topic": ["topic", "chapter", "subject", "exam"],
            "topic": ["chapter", "subject", "exam"],
            "chapter": ["subject", "exam"],
            "subject": ["exam"]
        }
        
        if entity_type not in hierarchy:
            return []
        
        db = get_database()
        path = []
        
        # Get current entity
        current_entity = await ContentService.get_entity_by_id(f"{entity_type}s", entity_id)
        if not current_entity:
            return []
        
        path.append({"type": entity_type, "data": current_entity})
        
        # Traverse up the hierarchy
        for parent_type in hierarchy[entity_type]:
            parent_id_field = f"{parent_type}_id"
            if parent_id_field in current_entity:
                parent_entity = await ContentService.get_entity_by_id(f"{parent_type}s", current_entity[parent_id_field])
                if parent_entity:
                    path.append({"type": parent_type, "data": parent_entity})
                    current_entity = parent_entity
        
        return list(reversed(path))
    
    @staticmethod
    async def count_children(collection_name: str, parent_id_field: str, parent_id: str) -> int:
        """
        Count child entities for a parent
        
        Args:
            collection_name: Child collection name
            parent_id_field: Field name linking to parent (e.g., "subject_id")
            parent_id: Parent entity ID
            
        Returns:
            Count of children
        """
        db = get_database()
        collection = getattr(db, collection_name)
        count = await collection.count_documents({parent_id_field: parent_id})
        return count
