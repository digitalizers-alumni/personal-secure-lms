# Ce fichier sert de passerelle pour la compatibilité avec le code existant
# Il regroupe les modèles définis dans des fichiers distincts.

from .users import User, UserRole
from .documents import Document
from .courses import Course

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class Document(Base):
    """
    Represents an uploaded document and its RAG indexing status.

    Statuses:
        pending    — file uploaded, not yet queued for indexing
        processing — worker is currently indexing the document
        indexed    — document successfully embedded and stored in Qdrant
        failed     — indexing failed, check logs for details
    """
    __tablename__ = "documents"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, nullable=False, index=True)
    filename   = Column(String, nullable=False)
    file_path  = Column(String, nullable=False, unique=True)
    status     = Column(String, default="pending", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
