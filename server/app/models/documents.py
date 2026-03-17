from sqlalchemy import Column, String, Boolean, DateTime, JSON, Integer
from sqlalchemy.sql import func
from app.db.database import Base

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False, unique=True)
    mime_type = Column(String)
    status = Column(String, default="pending", nullable=False)
    
    hash_sha256 = Column(String)
    metadata_json = Column(JSON, default={})
    is_deleted = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
