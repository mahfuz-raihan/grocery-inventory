from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from src.models import Role

class UserCreate(BaseModel):
    email: EmailStr = Field(..., description="A valid, strictly formatted email address")
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")
    full_name: str = Field(..., min_length=2, max_length=100)
    role: Role = Field(..., description="Assigned role: owner, manager, cashier, or stock_handler")
    branch_id: Optional[uuid.UUID] = Field(None, description="Null if role is 'owner', otherwise requires a valid Branch UUID")

class UserLogin(BaseModel):
    email: EmailStr
    # CHANGED: Removed max_length limit!
    password: str = Field(...)

class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: Role
    branch_id: Optional[uuid.UUID]
    is_active: bool
    created_at: datetime
    
    # Pydantic V2 standard for ORM integration
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role
    branch_id: Optional[uuid.UUID]