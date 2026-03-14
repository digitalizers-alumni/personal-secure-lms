import os
import logging
from app.api.core.security import get_current_user
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Tuple
from app.db.database import get_db
from app.models.documents import Document
from app.api.schemas.documents import DocumentUploadResponse, DocumentStatusResponse
from app.worker.tasks import ingest_document
from app.rag.indexer import delete_document as delete_rag_document
import uuid
import hashlib

logger = logging.getLogger(__name__)

router = APIRouter()

STORAGE_DIR = os.getenv("STORAGE_DIR", "./data/documents")
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}

def _save_file(file: UploadFile) -> Tuple[str, str, str, int]:
    os.makedirs(STORAGE_DIR, exist_ok=True)
    extension = os.path.splitext(file.filename)[1].lower()
    
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {extension}")
    
    # Check if file is empty
    content = file.file.read()
    file_size = len(content)
    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    # Check max size (20MB)
    if file_size > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File is too large (max 20MB)")

    # Strengthen validation: check signatures (magic numbers)
    mime_type = "text/plain" # Default
    if extension == ".pdf":
        if not content.startswith(b"%PDF-"):
            raise HTTPException(status_code=400, detail="Invalid PDF file signature")
        mime_type = "application/pdf"
    elif extension == ".docx":
        if not content.startswith(b"PK\x03\x04"):
            raise HTTPException(status_code=400, detail="Invalid DOCX file signature")
        mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    
    # Calculate SHA256 hash
    hash_sha256 = hashlib.sha256(content).hexdigest()

    # Prepend UUID to avoid collision
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(STORAGE_DIR, unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(content)

    return file_path, hash_sha256, mime_type, file_size

@router.post("/upload", response_model=DocumentUploadResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub", "unknown")
    file_path, hash_sha256, mime_type, file_size = _save_file(file)
    
    # Extra metadata for the JSON field
    metadata_json = {
        "original_filename": file.filename,
        "size_bytes": file_size,
        "extension": os.path.splitext(file.filename)[1].lower()
    }

    doc = Document(
        user_id=user_id, 
        filename=file.filename, 
        file_path=file_path, 
        mime_type=mime_type,
        hash_sha256=hash_sha256,
        metadata_json=metadata_json,
        status="pending"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    ingest_document.delay(doc.id, doc.file_path, doc.user_id)
    return DocumentUploadResponse(doc_id=doc.id, filename=doc.filename, status=doc.status)

@router.get("/", response_model=List[DocumentStatusResponse])
async def list_documents(db: Session = Depends(get_db)):
    return db.query(Document).filter(Document.is_deleted == False).all()

@router.get("/{doc_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.is_deleted == False).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or deleted")
    return doc

@router.delete("/{doc_id}", status_code=204)
async def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.is_deleted == False).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or already deleted")
    
    # Soft delete in Database
    doc.is_deleted = True
    db.commit()
    
    # Remove from RAG Vectors
    try:
        delete_rag_document(doc_id)
    except Exception as e:
        logger.error(f"Failed to delete vectors for doc_id {doc_id}: {e}")
        # We don't raise as the DB delete was successful
        
    return None
