from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, EmailStr, ConfigDict
from src.models import Role

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Role
    branch_id: Optional[uuid.UUID] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: Role
    branch_id: Optional[uuid.UUID]
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    role: Role
    branch_id: Optional[uuid.UUID]