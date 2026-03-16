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
    quiz: List[dict] = []
    reward: dict = {}

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content_markdown: Optional[str] = None
    status: Optional[str] = None
    list_src_docs_ids: Optional[List[int]] = None
    target_job_positions: Optional[List[str]] = None
    quiz: Optional[List[dict]] = None
    reward: Optional[dict] = None

class Course(CourseBase):
    id: str
    user_id: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Aliases for frontend compatibility
    lesson_content: Optional[str] = None
    reward_title: Optional[str] = None
    reward_message: Optional[str] = None

    class Config:
        from_attributes = True
