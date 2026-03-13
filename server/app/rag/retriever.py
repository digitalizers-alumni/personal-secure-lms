import logging
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from app.rag.embedder import embedder
from app.rag.indexer import QDRANT_HOST, QDRANT_PORT, COLLECTION_NAME

logger = logging.getLogger(__name__)

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


def search(query: str, top_k: int = 5, user_id: int | None = None) -> list[dict]:
    """
    Embeds the query and retrieves the top_k most relevant chunks from Qdrant.
    Optionally filters by user_id to scope results to a specific user's documents.
    """
    query_vector = embedder.embed([query])[0]

    search_filter = None
    if user_id is not None:
        search_filter = Filter(
            must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
        )

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

    logger.info("Retrieved %s chunks for query (user_id=%s)", len(chunks), user_id)
    return chunks