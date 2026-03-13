import logging
from app.worker.celery_app import celery_app
from app.rag.indexer import index_document as run_indexing
from app.db.database import SessionLocal
from app.models.document_schema import Document

logger = logging.getLogger(__name__)


def _set_status(doc_id: int, status: str):
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = status
            db.commit()
            logger.info("Document doc_id=%s status updated to '%s'", doc_id, status)
        else:
            logger.warning("Document doc_id=%s not found in DB", doc_id)
    except Exception as e:
        logger.error("Failed to update status for doc_id=%s: %s", doc_id, str(e))
        db.rollback()
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def ingest_document(self, doc_id: int, file_path: str, user_id: int):
    """
    Async task — extracts text, embeds with BGE-M3 and upserts into Qdrant.
    Retries up to 3 times with 30s delay on failure.
    """
    logger.info("Starting ingestion for doc_id=%s", doc_id)
    try:
        _set_status(doc_id, "processing")
        run_indexing(doc_id=doc_id, file_path=file_path, user_id=user_id)
        _set_status(doc_id, "indexed")
        logger.info("Ingestion complete for doc_id=%s", doc_id)

    except Exception as exc:
        logger.error("Ingestion failed for doc_id=%s: %s", doc_id, str(exc))
        _set_status(doc_id, "failed")
        raise self.retry(exc=exc)