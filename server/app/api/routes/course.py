from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.course import Course
from app.api.schemas.course import CourseCreate, Course as CourseSchema

router = APIRouter()

@router.post("/", response_model=CourseSchema, status_code=status.HTTP_201_CREATED)
def create_course(course_in: CourseCreate, db: Session = Depends(get_db)):
    db_course = Course(
        title=course_in.title,
        description=course_in.description,
        content_markdown=course_in.content_markdown,
        generated_by_llm=course_in.generated_by_llm,
        list_src_docs_ids=course_in.list_src_docs_ids,
        target_job_positions=course_in.target_job_positions
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@router.get("/", response_model=List[CourseSchema])
def list_courses(db: Session = Depends(get_db)):
    return db.query(Course).filter(Course.is_deleted == False).all()

@router.get("/{course_id}", response_model=CourseSchema)
def get_course(course_id: str, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id, Course.is_deleted == False).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: str, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    course.is_deleted = True
    db.commit()
    return None
