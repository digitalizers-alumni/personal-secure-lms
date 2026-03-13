import os
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.document_schema import Document
from app.api.schemas.document import DocumentUploadResponse, DocumentStatusResponse
from app.worker.tasks import ingest_document

logger = logging.getLogger(__name__)

router = APIRouter()

STORAGE_DIR = os.getenv("STORAGE_DIR", "./data/documents")
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}


def _save_file(file: UploadFile) -> str:
    """Saves uploaded file to disk, returns the file path"""
    os.makedirs(STORAGE_DIR, exist_ok=True)

    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{extension}'. Allowed: {ALLOWED_EXTENSIONS}"
        )

    file_path = os.path.join(STORAGE_DIR, file.filename)
    if os.path.exists(file_path):
        raise HTTPException(
            status_code=409,
            detail=f"File '{file.filename}' already exists"
        )

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    logger.info("File saved to %s", file_path)
    return file_path


@router.post("/documents/upload", response_model=DocumentUploadResponse, status_code=201)
async def upload_document(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a PDF document.
    Saves the file to disk and creates a DB record with status 'pending'.
    Indexing into Qdrant will be handled asynchronously by the worker.
    """
    file_path = _save_file(file)

    doc = Document(
        user_id=user_id,
        filename=file.filename,
        file_path=file_path,
        status="pending"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Celery task
    ingest_document.delay(doc.id, doc.file_path, doc.user_id)

    logger.info("Document doc_id=%s queued for indexing", doc.id)
    return DocumentUploadResponse(
        doc_id=doc.id,
        filename=doc.filename,
        status=doc.status
    )


@router.get("/documents/{doc_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(
    doc_id: int,
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")
    return DocumentStatusResponse(
        doc_id=doc.id,
        filename=doc.filename,
        status=doc.status,
        created_at=doc.created_at,
        updated_at=doc.updated_at
    )


@router.delete("/documents/{doc_id}", status_code=204)
async def delete_document(
    doc_id: int,
    db: Session = Depends(get_db)
):
    """
    Deletes a document from disk, DB and Qdrant.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")

    # Document suppression in Qdrant
    delete_document_vectors(doc_id)

    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
        logger.info("File deleted from disk: %s", doc.file_path)

    db.delete(doc)
    db.commit()
    logger.info("Document doc_id=%s deleted", doc_id)