import os
import uuid
import logging
import docx
from pypdf import PdfReader
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
from app.rag.embedder import embedder

logger = logging.getLogger(__name__)

QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
COLLECTION_NAME = "documents"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


def ensure_collection():
    """Qdrant collection creation if not existent"""
    existing = [c.name for c in client.get_collections().collections]
    if COLLECTION_NAME not in existing:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
            # BGE-M3 produit des vecteurs de dimension 1024
        )
        logger.info("Collection '%s' created", COLLECTION_NAME)


def chunk_text(text: str) -> list[str]:
    """Cut text in chunks"""
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunks.append(text[start:end])
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return [c for c in chunks if c.strip()]


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from pdf"""
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text

def extract_text_from_txt(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def extract_text_from_docx(file_path: str) -> str:
    doc = docx.Document(file_path)
    return "\n".join(paragraph.text for paragraph in doc.paragraphs)


def extract_text(file_path: str) -> str:
    """Routes extraction to the correct parser based on file extension"""
    extension = os.path.splitext(file_path)[1].lower()
    extractors = {
        ".pdf":  extract_text_from_pdf,
        ".txt":  extract_text_from_txt,
        ".docx": extract_text_from_docx,
    }
    if extension not in extractors:
        raise ValueError(f"Unsupported file type: {extension}")
    return extractors[extension](file_path)


def index_document(doc_id: int, file_path: str, user_id: int):
    """
    Complete pipeline : PDF → chunks → embeddings → Qdrant
    """
    logger.info("Starting indexing for doc_id=%s", doc_id)

    ensure_collection()

    # 1. Extraction texte
    text = extract_text(file_path)
    if not text.strip():
        raise ValueError(f"No text extracted from {file_path}")
    logger.info("Extracted %s characters from doc_id=%s", len(text), doc_id)

    # 2. Chunking
    chunks = chunk_text(text)
    logger.info("Created %s chunks for doc_id=%s", len(chunks), doc_id)

    # 3. Embeddings
    vectors = embedder.embed(chunks)

    # 4. Upsert dans Qdrant
    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "doc_id": doc_id,
                "user_id": user_id,
                "file_path": file_path,
                "chunk_index": i,
                "text": chunks[i],
            }
        )
        for i, vector in enumerate(vectors)
    ]

    client.upsert(collection_name=COLLECTION_NAME, points=points)
    logger.info("Indexed %s chunks for doc_id=%s", len(points), doc_id)


def delete_document(doc_id: int):
    """Delete all chunks related to a document in teh RAG"""
    client.delete(
        collection_name=COLLECTION_NAME,
        points_selector={"filter": {"must": [{"key": "doc_id", "match": {"value": doc_id}}]}}
    )
    logger.info("Deleted all chunks for doc_id=%s", doc_id)