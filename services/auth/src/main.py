import os
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from shared.python.core import DatabaseManager, log, Base
from src.models import User, Role
from src.schemas import UserCreate, UserResponse, UserLogin, Token, UserUpdate
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
    
    # Seed default administrator account if empty
    async with db_manager.session_factory() as session:
        result = await session.execute(select(User))
        user_list = result.scalars().all()
        if not user_list:
            if settings.default_admin_email and settings.default_admin_password:
                log.info("No registered users found. Seeding default administrator account...")
                default_admin = User(
                    email=settings.default_admin_email,
                    full_name="Default Administrator",
                    hashed_password=get_password_hash(settings.default_admin_password),
                    role=Role.owner,
                    branch_id=None,
                    is_active=True,
                    is_superuser=True
                )
                session.add(default_admin)
                await session.commit()
                log.info(f"Default administrator seeded: {settings.default_admin_email} / [configured password]")
            else:
                log.warning("No users found in database, but default_admin_email or default_admin_password is not set in environment. Skipping automatic database seeding.")
            
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

@app.get("/api/v1/auth/users", response_model=list[UserResponse])
async def get_users(session: AsyncSession = Depends(db_manager.get_session)):
    result = await session.execute(select(User))
    return result.scalars().all()


@app.get("/api/v1/auth/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: uuid.UUID, session: AsyncSession = Depends(db_manager.get_session)):
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put("/api/v1/auth/users/{user_id}", response_model=UserResponse)
async def update_user_profile(
    user_id: uuid.UUID,
    payload: UserUpdate,
    session: AsyncSession = Depends(db_manager.get_session)
):
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.password is not None and payload.password.strip() != "":
        user.hashed_password = get_password_hash(payload.password)
        
    await session.commit()
    await session.refresh(user)
    return user