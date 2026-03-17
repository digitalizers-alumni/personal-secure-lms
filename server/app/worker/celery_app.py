import os
from app.api.core.config import settings
from celery import Celery # Added this import, assuming it was implicitly there or removed by mistake in the provided context.
from celery.signals import worker_ready, worker_process_init # Added these imports, assuming they were implicitly there or removed by mistake in the provided context.

IS_EAGER = os.getenv("CELERY_ALWAYS_EAGER", "False").lower() == "true"

celery_app = Celery(
    "worker",
    broker=None if IS_EAGER else settings.redis_url,
    backend=None if IS_EAGER else settings.redis_url,
    include=["app.worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    task_always_eager=IS_EAGER,
)

@worker_ready.connect
def on_worker_ready(sender, **kwargs):
    from app.db.database import init_db
    init_db()

@worker_process_init.connect
def on_worker_process_init(sender, **kwargs):
    from app.rag.embedder import embedder
    embedder.load()