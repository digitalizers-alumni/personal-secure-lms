from sentence_transformers import SentenceTransformer
import os
import logging

logger = logging.getLogger(__name__)


class Embedder:
    def __init__(self):
        self.model = None

    def load(self):
        cache_dir = os.getenv("MODEL_CACHE_DIR", "./data/models")
        os.environ["HUGGINGFACE_HOME"] = cache_dir
        
        # Only set offline if we have something in cache
        if os.path.exists(cache_dir) and os.listdir(cache_dir):
            os.environ["HUGGINGFACE_HUB_OFFLINE"] = "1"
            logger.info("Loading MiniLM-L12-v2 model from %s (OFFLINE)", cache_dir)
        else:
            os.environ["HUGGINGFACE_HUB_OFFLINE"] = "0"
            logger.info("Loading MiniLM-L12-v2 model (ONLINE)")
            
        self.model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
        logger.info("Model loaded successfully")

    def embed(self, texts: list[str]) -> list:
        if self.model is None:
            raise RuntimeError("Embedder not initialized — call load() first")
        return self.model.encode(texts, normalize_embeddings=True).tolist()

embedder = Embedder()