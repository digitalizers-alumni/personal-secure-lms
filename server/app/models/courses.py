import uuid
from sqlalchemy import Column, String, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.db.database import Base

class Course(Base):
    __tablename__ = "courses"
    
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
