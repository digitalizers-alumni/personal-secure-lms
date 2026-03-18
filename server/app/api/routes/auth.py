import jwt
import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.api.core.security import create_access_token

from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.users import User
from app.api.schemas.users import UserLogin, Token, UserCreate, User as UserSchema
from app.api.core.security import create_access_token, verify_password, get_password_hash

router = APIRouter()

def perform_login(email: str, password: str, db: Session) -> dict:
    """Shared helper for authentication logic."""
    user = db.query(User).filter(User.email == email).first()
    
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last activity on successful login
    user.last_activity = datetime.datetime.utcnow()
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user_id=user.id, role=user.user_role.value)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.user_role.value.lower(),
    }

@router.post("/token", response_model=Token)
async def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, retrieval of an access token via form data.
    """
    return perform_login(form_data.username, form_data.password, db)

@router.post("/register", response_model=UserSchema, status_code=201)
async def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Public registration endpoint.
    """
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        job_function=user_in.job_function,
        user_role="USER"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
async def login_json(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    JSON-based login for literal backlog compliance.
    """
    return perform_login(credentials.email, credentials.password, db)
