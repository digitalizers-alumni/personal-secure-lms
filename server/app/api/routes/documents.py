import os # Re-adding os import
import logging
from app.api.core.security import get_current_user
from app.models.users import User
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Tuple
from app.db.database import get_db
from app.models.documents import Document
from app.api.schemas.documents import DocumentUploadResponse, DocumentStatusResponse
from app.worker.tasks import ingest_document
from app.rag.indexer import delete_document as delete_rag_document
import re
import uuid
import hashlib

logger = logging.getLogger(__name__)

router = APIRouter()

STORAGE_DIR = os.getenv("STORAGE_DIR", "./data/documents")

def _sanitize_filename(filename: str) -> str:
    """
    Extracts the basename and replaces unsafe characters with underscores.
    """
    # 1. Take only the base name (prevents path traversal like ../../etc/passwd)
    base_name = os.path.basename(filename)
    # 2. Keep only letters, numbers, dots, and hyphens (replaces everything else with _)
    clean_name = re.sub(r'[^a-zA-Z0-9.\-]', '_', base_name)
    # 3. Collapse multiple underscores into one
    clean_name = re.sub(r'_+', '_', clean_name)
    return clean_name
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

def _save_file(file: UploadFile) -> Tuple[str, str, str, int]:
    os.makedirs(STORAGE_DIR, exist_ok=True)
    
    # Sanitize the filename early
    safe_filename = _sanitize_filename(file.filename)
    extension = os.path.splitext(safe_filename)[1].lower()
    
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {extension}")
    
    # 1. Early reject based on metadata headers (if provided by client)
    if hasattr(file, 'size') and file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"File is too large (max {MAX_FILE_SIZE // (1024 * 1024)}MB)")

    # 2. Extract first small chunk to check magic numbers safely without loading huge files into memory
    first_chunk = file.file.read(1024)
    if not first_chunk:
        raise HTTPException(status_code=400, detail="File is empty")
        
    mime_type = "text/plain" # Default
    if extension == ".pdf":
        if not first_chunk.startswith(b"%PDF-"):
            raise HTTPException(status_code=400, detail="Invalid PDF file signature")
        mime_type = "application/pdf"
    elif extension == ".docx":
        if not first_chunk.startswith(b"PK\x03\x04"):
            raise HTTPException(status_code=400, detail="Invalid DOCX file signature")
        mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    # Reset cursor for streaming to disk
    file.file.seek(0)
    hash_sha256_obj = hashlib.sha256()

    unique_filename = f"{uuid.uuid4()}_{safe_filename}"
    file_path = os.path.join(STORAGE_DIR, unique_filename)
    
    total_size = 0
    # Stream in 1 MB chunks to prevent OOM
    with open(file_path, "wb") as f:
        while True:
            chunk = file.file.read(1024 * 1024) 
            if not chunk:
                break
            
            total_size += len(chunk)
            # Enforce hard limit even if metadata was spoofed
            if total_size > MAX_FILE_SIZE:
                f.close()
                os.remove(file_path)
                raise HTTPException(status_code=413, detail=f"File is too large (max {MAX_FILE_SIZE // (1024 * 1024)}MB)")
                
            hash_sha256_obj.update(chunk)
            f.write(chunk)
            
    file_size = total_size
    final_hash = hash_sha256_obj.hexdigest()

    return file_path, final_hash, mime_type, file_size

@router.post("/upload", response_model=DocumentUploadResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file_path, hash_sha256, mime_type, file_size = _save_file(file)  # ← déstructure le tuple

    doc = Document(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        mime_type=mime_type,
        hash_sha256=hash_sha256,
        status="pending"
    )
    db.add(doc)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"File '{file.filename}' already exists")
    db.refresh(doc)
    ingest_document.delay(doc.id, doc.file_path, doc.user_id)
    return DocumentUploadResponse(doc_id=doc.id, filename=doc.filename, status=doc.status)

@router.get("", response_model=List[DocumentStatusResponse])
async def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.is_deleted == False
    ).order_by(Document.created_at.desc()).all()

@router.get("/{doc_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(
    doc_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.user_id == current_user.id,
        Document.is_deleted == False
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
    return doc

@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    doc_id: int, 
    hard: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a document.
    - Default (hard=False): Soft-delete (marks as is_deleted=True).
    - Hard delete (hard=True): Removes the physical file from disk and deletes the database record.
    """
    doc = db.query(Document).filter(
        Document.id == doc_id, 
        Document.user_id == str(current_user.id),
        Document.is_deleted == False
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
    
    if hard:
        # 1. Physical removal from disk
        file_path = doc.file_path
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Physical file removed: {file_path}")
            except Exception as e:
                logger.error(f"Failed to remove physical file {file_path}: {e}")
        
        # 2. Hard delete in Database
        db.delete(doc)
    else:
        # Soft delete in Database
        doc.is_deleted = True
    
    db.commit()
    
    # Remove from RAG Vectors (always attempt cleanup)
    try:
        delete_rag_document(doc_id)
    except Exception as e:
        logger.error(f"Failed to delete vectors for doc_id {doc_id}: {e}")
        
    return None
