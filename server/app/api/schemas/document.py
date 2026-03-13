from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DocumentUploadResponse(BaseModel):
    """Returned after a successful file upload"""
    doc_id:     int
    filename: str
    status:   str


class DocumentStatusResponse(BaseModel):
    """Returned when polling indexing status"""
    doc_id:     int
    filename:   str
    status:     str
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}  # Allow conversion from SQLAlchemy