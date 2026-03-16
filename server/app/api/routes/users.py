import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.users import User
from app.api.schemas.users import UserUpdate, UserUpdatePassword, User as UserSchema
from app.api.core.security import get_password_hash, get_current_user, get_admin_user

logger = logging.getLogger(__name__)
router = APIRouter()


# --- Authenticated user routes ---

@router.get("/me", response_model=UserSchema)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get the profile of the currently authenticated user"""
    return current_user


@router.put("/me", response_model=UserSchema)
def update_my_profile(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the profile of the currently authenticated user"""
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    logger.info("User %s updated their profile", current_user.email)
    return current_user


@router.put("/me/password", status_code=204)
def update_my_password(
    payload: UserUpdatePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the password of the currently authenticated user"""
    from app.api.core.security import verify_password
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.password_hash = get_password_hash(payload.new_password)
    db.commit()
    logger.info("User %s updated their password", current_user.email)


# --- Admin only routes ---

@router.get("", response_model=List[UserSchema])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user)
):
    """List all users — admin only"""
    return db.query(User).filter(User.is_deleted == False).all()


@router.get("/{user_id}", response_model=UserSchema)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user)
):
    """Get a specific user — admin only"""
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserSchema)
def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user)
):
    """Update a specific user — admin only"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)
    db.commit()
    db.refresh(db_user)
    logger.info("Admin updated user %s", user_id)
    return db_user


@router.put("/{user_id}/activate", response_model=UserSchema)
def activate_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user)
):
    """Activate a user account — admin only"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_user.is_active = True
    db.commit()
    db.refresh(db_user)
    logger.info("Admin activated user %s", user_id)
    return db_user


@router.put("/{user_id}/deactivate", response_model=UserSchema)
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user)
):
    """Deactivate a user account — admin only"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_user.is_active = False
    db.commit()
    db.refresh(db_user)
    logger.info("Admin deactivated user %s", user_id)
    return db_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user)
):
    """Soft delete a user — admin only"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_deleted = True
    db.commit()
    logger.info("Admin soft deleted user %s", user_id)