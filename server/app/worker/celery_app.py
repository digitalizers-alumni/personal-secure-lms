import os
from celery import Celery
from celery.signals import worker_ready, worker_process_init


REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = os.getenv("REDIS_PORT", 6379)
REDIS_URL   = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"

celery_app = Celery(
    "worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,   # status "STARTED" visible en plus de PENDING/SUCCESS/FAILURE
)

@worker_ready.connect
def on_worker_ready(sender, **kwargs):
    from app.db.database import init_db
    init_db()

@worker_process_init.connect
def on_worker_process_init(sender, **kwargs):
    from app.rag.embedder import embedder
    embedder.load()