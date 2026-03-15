from pydantic import BaseModel, Field
from typing import List, Optional

class QuizQuestion(BaseModel):
    question: str
    options: List[str] = Field(..., min_items=4, max_items=4)
    correct_answer: str # The text of the correct option

class CoursePackage(BaseModel):
    title: str
    lesson_content: str # Markdown format
    quiz: List[QuizQuestion] = Field(..., min_items=10, max_items=10)
    reward_title: str
    reward_message: str

class CourseGenerationRequest(BaseModel):
    topic: str
    learning_goal: str
    difficulty: str # e.g., "Débutant", "Intermédiaire", "Avancé"
    passing_score: int = 70
    doc_ids: Optional[List[int]] = None
    additional_instructions: Optional[str] = None
