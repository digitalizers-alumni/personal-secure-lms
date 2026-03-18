import logging
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue, MatchAny
from typing import List, Optional
from app.api.core.config import settings
from app.rag.embedder import embedder
from app.rag.indexer import COLLECTION_NAME

logger = logging.getLogger(__name__)

client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)


def search(
    query: str, 
    top_k: int = 5, 
    user_id: Optional[str] = None, 
    doc_ids: Optional[List[int]] = None
) -> List[dict]:
    """
    Embeds the query and retrieves the top_k most relevant chunks from Qdrant.
    """
    query_vector = embedder.embed([query])[0]

    must_conditions = []
    if user_id is not None:
        must_conditions.append(FieldCondition(key="user_id", match=MatchValue(value=user_id)))
    
    if doc_ids and len(doc_ids) > 0:
        must_conditions.append(FieldCondition(key="doc_id", match=MatchAny(any=doc_ids)))

    search_filter = None
    if must_conditions:
        search_filter = Filter(must=must_conditions)

    # Utilisation de query_points (standard Qdrant 1.10+)
    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter=search_filter,
        limit=top_k,
        with_payload=True,
    ).points

    chunks = [
        {
            "text": hit.payload["text"],
            "doc_id": hit.payload["doc_id"],
            "score": round(hit.score, 4),
        }
        for hit in results
    ]

    logger.info("Retrieved %s chunks (user_id=%s)", len(chunks), user_id)
    return chunks
