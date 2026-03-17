from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.courses import Course
from app.api.schemas.courses import CourseCreate, CourseUpdate, Course as CourseSchema
from app.api.schemas.courses_gen import CourseGenerationRequest, CoursePackage
from app.services.llm_service import llm_service
from app.rag.retriever import search
from app.api.core.security import get_current_user
from app.models.users import User
import json

router = APIRouter()

@router.post("/", response_model=CourseSchema, status_code=status.HTTP_201_CREATED)
def create_course(
    course_in: CourseCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_course = Course(
        user_id=current_user.email,
        title=course_in.title,
        description=course_in.description,
        content_markdown=course_in.content_markdown,
        generated_by_llm=course_in.generated_by_llm,
        list_src_docs_ids=course_in.list_src_docs_ids,
        target_job_positions=course_in.target_job_positions,
        quiz=course_in.quiz,
        reward=course_in.reward
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@router.get("/", response_model=List[CourseSchema])
def list_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Course).filter(
        Course.user_id == current_user.email,
        Course.is_deleted == False
    ).all()

@router.get("/{course_id}", response_model=CourseSchema)
def get_course(
    course_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(
        Course.id == course_id, 
        Course.user_id == current_user.email,
        Course.is_deleted == False
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or access denied")
        
    return course

@router.put("/{course_id}", response_model=CourseSchema)
def update_course(
    course_id: str, 
    course_in: CourseUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_course = db.query(Course).filter(
        Course.id == course_id,
        Course.user_id == current_user.email
    ).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found or access denied")
    
    update_data = course_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_course, field, value)
    
    db.commit()
    db.refresh(db_course)
    return db_course

@router.put("/{course_id}/status", response_model=CourseSchema)
def update_course_status(
    course_id: str, 
    status: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ex: PUBLISHED, ARCHIVED
    db_course = db.query(Course).filter(
        Course.id == course_id,
        Course.user_id == current_user.email
    ).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found or access denied")
    db_course.status = status
    db.commit()
    db.refresh(db_course)
    return db_course

@router.post("/generate", response_model=CourseSchema)
async def generate_course(
    request: CourseGenerationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a structured course with lesson, quiz, and reward, then save it.
    """
    system_prompt = f"""You are an expert educator and world-class instructional designer. 
Generate a comprehensive, high-quality structured mini-course in JSON format.

The course must be VERY DETAILED, pedagogical, and follow this exact JSON structure:
{{
  "title": "A compelling and professional course title",
  "lesson_content": "A long, rich, and structured lesson in Markdown. Aim for at least 800-1000 words.",
  "quiz": [
    {{
      "question": "Clear and challenging question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Exact text of the correct option"
    }}
  ],
  "reward_title": "A motivating title for success",
  "reward_message": "A personalized message celebrating their passing score of {request.passing_score}%"
}}

CONTENT RULES for 'lesson_content':
1. Use Markdown headers (##, ###) to structure the content.
2. Use bold and italic text for emphasis.
3. Use bullet points and numbered lists for clarity.
4. Include practical examples, "Pro Tips", and a "Summary" section at the end.
5. The tone should be professional yet engaging.
6. DO NOT be concise. Be generous with explanations.

JSON & FORMATTING RULES:
1. Return EXACTLY {request.num_questions} quiz questions with 4 options each.
2. IMPORTANT: All newlines in 'lesson_content' MUST be escaped as the literal string '\\n' (a backslash followed by 'n').
3. DO NOT use actual carriage returns or literal newlines inside the JSON string values.
4. Use standard JSON escaping for double quotes (\").
5. NEVER escape single quotes (') with a backslash. Write them normally as '.
6. Return ONLY the JSON object, NO markdown code blocks, no preamble, and no extra text.
7. GROUND the content in the provided context. If no context, use your expert knowledge.

ADDITIONAL CONSTRAINTS: {request.additional_instructions or 'None'}
"""

    context = ""
    if request.selected_doc_ids:
        query = f"{request.topic} {request.learning_goal}"
        chunks = search(query=query, top_k=8, user_id=current_user.email, doc_ids=request.selected_doc_ids)
        if chunks:
            context = "\n\n".join([f"Source {i+1}:\n{c['text']}" for i, c in enumerate(chunks)])

    user_prompt = f"Topic: {request.topic}\nLearning Goal: {request.learning_goal}\n\nContext:\n{context or 'No specific context provided.'}"

    try:
        course_data = await llm_service.generate_json_response(user_prompt, system_prompt)
        # Parse it to ensure it matches CoursePackage structure if needed, or just use dict
        pkg = CoursePackage(**course_data)
        
        # Create and save Course entry
        db_course = Course(
            user_id=current_user.email,
            title=pkg.title,
            description=request.learning_goal,
            content_markdown=pkg.lesson_content,
            generated_by_llm=True,
            list_src_docs_ids=request.doc_ids or [],
            quiz=[q.model_dump() for q in pkg.quiz],
            reward={
                "reward_title": pkg.reward_title,
                "reward_message": pkg.reward_message
            },
            status="PUBLISHED" # Automatiquement publié pour ce prototype
        )
        db.add(db_course)
        db.commit()
        db.refresh(db_course)
        
        return db_course
    except HTTPException: # Catch only HTTPExceptions raised by llm_service
        raise # Re-raise if it's an HTTPException
    except Exception as e: # Catch other exceptions
        raise HTTPException(status_code=500, detail=str(e))
@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.user_id == current_user.email
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or access denied")
    course.is_deleted = True
    db.commit()
    return None
