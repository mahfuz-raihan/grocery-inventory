import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from shared.python.core import DatabaseManager, log, Base
from src.models import User
from src.schemas import UserCreate, UserResponse, UserLogin, Token
from src.security import get_password_hash, verify_password, create_access_token
from src.config import settings

db_manager = DatabaseManager(settings.database_url)

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting Auth Service...")
    async with db_manager.engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS auth"))
        await conn.run_sync(Base.metadata.create_all)
        log.info("Database schema (Auth Users) initialized successfully.")
    yield
    await db_manager.engine.dispose()

app = FastAPI(
    title="Grocery ERP - Auth Service",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/v1/auth/docs",
    openapi_url="/api/v1/auth/openapi.json"
)

@app.post("/api/v1/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, session: AsyncSession = Depends(db_manager.get_session)):
    # Check if user already exists
    result = await session.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role,
        branch_id=user_data.branch_id
    )
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    return new_user

@app.post("/api/v1/auth/login", response_model=Token)
async def login(login_data: UserLogin, session: AsyncSession = Depends(db_manager.get_session)):
    # Find user by email
    result = await session.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()

    # Verify password and activity status
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # Generate JWT
    jwt_payload = {
        "sub": user.email,
        "id": str(user.id),
        "role": user.role.value,
        "branch_id": str(user.branch_id) if user.branch_id else None
    }
    access_token = create_access_token(data=jwt_payload)

    return Token(
        access_token=access_token, 
        token_type="bearer", 
        role=user.role, 
        branch_id=user.branch_id
    )