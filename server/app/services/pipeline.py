import logging
from app.rag.retriever import search
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)


KEYWORD_EXTRACTION_PROMPT = """Extract the key search terms from this question.
Return ONLY a comma-separated list of keywords, nothing else.

Question: {prompt}
Keywords:"""


AUGMENTED_PROMPT_TEMPLATE = """Answer the following question using the context provided.
If the context does not contain relevant information, answer based on your general knowledge.

Context:
{context}

Question: {prompt}

Answer:"""


async def run_rag_pipeline(prompt: str, user_id: int | None = None) -> dict:
    """
    Full RAG pipeline:
    1. Extract keywords from prompt via LLM
    2. Search Qdrant with BGE-M3 embeddings
    3. Send augmented prompt to LLM with retrieved context
    """

    # Step 1 — keyword extraction
    logger.info("Extracting keywords from prompt")
    keyword_prompt = KEYWORD_EXTRACTION_PROMPT.format(prompt=prompt)
    keywords_raw = await llm_service.generate_response(keyword_prompt)
    keywords = [k.strip() for k in keywords_raw.split(",") if k.strip()]
    logger.info("Extracted keywords: %s", keywords)

    # Step 2 — RAG retrieval using full prompt + keywords combined
    search_query = prompt + " " + " ".join(keywords)
    chunks = search(query=search_query, top_k=5, user_id=user_id)

    # Step 3 — build augmented prompt
    if chunks:
        context = "\n\n".join(
            f"[Source {i+1} - score {c['score']}]\n{c['text']}"
            for i, c in enumerate(chunks)
        )
        logger.info("Augmenting prompt with %s chunks", len(chunks))
    else:
        context = "No relevant context found in the knowledge base."
        logger.info("No chunks retrieved, sending prompt without context")

    augmented_prompt = AUGMENTED_PROMPT_TEMPLATE.format(
        context=context,
        prompt=prompt,
    )

    # Step 4 — final LLM call
    answer = await llm_service.generate_response(augmented_prompt)
    logger.info("Pipeline complete")

    return {
        "answer": answer,
        "keywords": keywords,
        "sources": chunks,
    }