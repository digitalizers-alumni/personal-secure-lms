import os
import logging
import uuid # Import the uuid module
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.documents import Document
from app.api.schemas.documents import DocumentUploadResponse, DocumentStatusResponse
from app.worker.tasks import ingest_document

logger = logging.getLogger(__name__)

router = APIRouter()

STORAGE_DIR = os.getenv("STORAGE_DIR", "./data/documents")
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

def _save_file(file: UploadFile) -> tuple[str, str]: # Change return type to tuple
    os.makedirs(STORAGE_DIR, exist_ok=True)
    
    # 1. Check extension
    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415, 
            detail=f"Extension '{extension}' non supportée. Extensions autorisées : {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # 2. Check MIME type
    mime_type = file.content_type # Get mime_type here
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415, 
            detail=f"Type MIME '{mime_type}' non supporté pour cette extension."
        )

    # 3. Read content to check size and empty file
    content = file.file.read()
    file_size = len(content)
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Le fichier est vide.")
        
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413, 
            detail=f"Fichier trop lourd ({file_size} octets). La limite est de {MAX_FILE_SIZE} octets (50 Mo)."
        )
    
    # Generate a unique filename to prevent collisions
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(STORAGE_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        logger.error(f"Erreur lors de l'écriture du fichier : {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la sauvegarde du fichier.")
        
    return file_path, mime_type # Return both file_path and mime_type

@router.post("/upload", response_model=DocumentUploadResponse, status_code=201)
async def upload_document(user_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_path, mime_type = _save_file(file) # Unpack the tuple
    doc = Document(
        user_id=user_id, 
        filename=file.filename, # Original filename
        file_path=file_path,    # Unique path
        mime_type=mime_type,    # Store mime_type
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
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.delete("/{doc_id}", status_code=204)
async def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.is_deleted = True
    db.commit()
    return None
