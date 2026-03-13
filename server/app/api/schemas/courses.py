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

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content_markdown: Optional[str] = None
    status: Optional[str] = None
    list_src_docs_ids: Optional[List[int]] = None
    target_job_positions: Optional[List[str]] = None

class Course(CourseBase):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
