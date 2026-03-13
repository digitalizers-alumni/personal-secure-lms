from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    content_markdown: Optional[str] = None
    generated_by_llm: bool = False
    list_src_docs_ids: List[int] = []
    target_job_positions: List[str] = []

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
