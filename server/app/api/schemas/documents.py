from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class DocumentBase(BaseModel):
    filename: str
    user_id: str

class DocumentCreate(DocumentBase):
    file_path: str
    mime_type: Optional[str] = None
    hash_sha256: Optional[str] = None

class DocumentUploadResponse(BaseModel):
    doc_id: int
    filename: str
    status: str

class DocumentStatusResponse(BaseModel):
    doc_id: int
    filename: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
