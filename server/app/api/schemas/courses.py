from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel, computed_field
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

    @computed_field
    @property
    def lesson_content(self) -> Optional[str]:
        return self.content_markdown

    @computed_field
    @property
    def reward_title(self) -> Optional[str]:
        return self.reward.get("reward_title") if self.reward else None

    @computed_field
    @property
    def reward_message(self) -> Optional[str]:
        return self.reward.get("reward_message") if self.reward else None

    class Config:
        from_attributes = True
