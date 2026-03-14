"""
Authentication route — issues JWT tokens for login.
For demo/MVP purposes, any username/password combination is accepted.
"""
import jwt
import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.api.core.security import create_access_token

from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.users import User
from app.api.core.security import create_access_token, verify_password

router = APIRouter()

@router.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return a JWT access token.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.email, role=user.user_role.value)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.user_role.value,
    }
