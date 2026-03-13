import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Boolean, DateTime, JSON, ForeignKey, Integer, Enum as SqlEnum
from sqlalchemy.sql import func
from app.db.database import Base

# --- ENUMS ---
class UserRole(str, Enum):
    INVITE = "INVITE"
    ADMIN = "ADMIN"
    USER = "USER"

# --- MODELS ---

class User(Base):
    __tablename__ = "user"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    job_function = Column(String)
    user_role = Column(SqlEnum(UserRole), default=UserRole.USER)
    
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Document(Base):
    __tablename__ = "documents" # On garde le pluriel du collègue pour la compatibilité
    
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False, unique=True)
    mime_type = Column(String)
    status = Column(String, default="pending", nullable=False) # On garde son 'pending' en minuscule
    
    hash_sha256 = Column(String)
    metadata_json = Column(JSON, default={})
    is_deleted = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Course(Base):
    __tablename__ = "course"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(String)
    content_markdown = Column(String)
    generated_by_llm = Column(Boolean, default=False)
    
    list_src_docs_ids = Column(JSON, default=[])
    target_depts_ids = Column(JSON, default=[])
    target_job_positions = Column(JSON, default=[])
    
    status = Column(String, default="DRAFT")
    is_deleted = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
