import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SqlEnum
from sqlalchemy.sql import func
from app.db.database import Base

class UserRole(str, Enum):
    INVITE = "INVITE"
    ADMIN = "ADMIN"
    USER = "USER"

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
