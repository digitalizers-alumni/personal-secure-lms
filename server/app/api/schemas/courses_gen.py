from pydantic import BaseModel, Field
from typing import List, Optional, Annotated


class QuizQuestion(BaseModel):
    question: str
    options: Annotated[List[str], Field(min_length=4, max_length=4)]
    correct_answer: str


class CoursePackage(BaseModel):
    title: str
    lesson_content: str
    quiz: Annotated[List[QuizQuestion], Field(min_length=1, max_length=20)]
    reward_title: str
    reward_message: str


class CourseGenerationRequest(BaseModel):
    topic: str
    learning_goal: str
    difficulty: str
    passing_score: int = 70
    num_questions: int = 3
    selected_doc_ids: Optional[List[int]] = None
    additional_instructions: Optional[str] = None