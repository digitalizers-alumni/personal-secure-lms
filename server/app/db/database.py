import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

logger = logging.getLogger(__name__)

from app.api.core.config import settings

DATABASE_URL = settings.DATABASE_URL

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def init_db():
    """Create all tables on startup if they don't exist"""
    from app.models.documents import Document
    from app.models.users import User
    from app.models.courses import Course
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized")


def get_db():
    """FastAPI dependency — provides a DB session per request"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()