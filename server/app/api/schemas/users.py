from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    INVITE = "INVITE"
    ADMIN = "ADMIN"
    USER = "USER"

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    job_function: Optional[str] = None

# Public self-registration — no role field, extra fields forbidden
class SelfRegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    job_function: Optional[str] = None

# Legacy alias — no longer used internally, kept for reference only
# class UserCreate(UserBase):
#     password: str

# Admin-only user creation — role-aware
class UserAdminCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    job_function: Optional[str] = None
    user_role: UserRole = UserRole.USER
    is_active: bool = True

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    job_function: Optional[str] = None

class UserAdminUpdate(UserUpdate):
    user_role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserUpdatePassword(BaseModel):
    current_password: str
    new_password: str

class User(UserBase):
    id: str
    user_role: UserRole
    is_active: bool
    is_deleted: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- AUTH ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
