"""
Shared Core Library for Grocery ERP Microservices
--------------------------------------------------
Provides: Base (SQLAlchemy), TimestampMixin, DatabaseManager,
          MessagingManager (NATS), log, and standard exceptions.

Import from services like:
    from shared.python.core import DatabaseManager, MessagingManager, log, Base, TimestampMixin
"""
import json
import logging
from datetime import datetime
from typing import Any, Callable, Optional, Type, TypeVar

from sqlalchemy import Column, DateTime, func
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from nats.aio.client import Client as NATSClient
from pydantic import BaseModel, ConfigDict
from fastapi import HTTPException, status


# ---------------------------------------------------------------------------
# LOGGING
# ---------------------------------------------------------------------------

def get_logger(name: str) -> logging.Logger:
    """Sets up a structured JSON logger for all microservices."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
            '"name": "%(name)s", "message": "%(message)s"}'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


# Module-level logger — import as `from shared.python.core import log`
log = get_logger("shared-core")


# ---------------------------------------------------------------------------
# SQLALCHEMY BASE  (canonical — never create a local declarative_base()!)
# ---------------------------------------------------------------------------

class Base(DeclarativeBase):
    """
    The one and only SQLAlchemy declarative base for the entire monorepo.
    All service models must inherit from this class so that each service's
    Base.metadata only contains the models imported by that process.
    """
    pass


class TimestampMixin:
    """SQLAlchemy mixin that auto-manages created_at / updated_at columns."""
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ---------------------------------------------------------------------------
# DATABASE SESSION MANAGER
# ---------------------------------------------------------------------------

class DatabaseManager:
    """
    Wraps an async SQLAlchemy engine + session factory.
    Usage:
        db_manager = DatabaseManager(settings.database_url)
        # As a FastAPI dependency:
        session: AsyncSession = Depends(db_manager.get_session)
    """

    def __init__(self, db_url: str):
        self.engine = create_async_engine(
            db_url,
            echo=False,
            pool_pre_ping=True,
            future=True,
        )
        self.session_factory = async_sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

    async def get_session(self) -> AsyncSession:  # type: ignore[override]
        """FastAPI dependency that yields an async DB session."""
        async with self.session_factory() as session:
            try:
                yield session
            finally:
                await session.close()


# ---------------------------------------------------------------------------
# NATS MESSAGING MANAGER
# ---------------------------------------------------------------------------

T = TypeVar("T", bound=BaseModel)


class MessagingManager:
    """
    Lightweight wrapper around the NATS async client.
    Usage:
        msg_manager = MessagingManager([settings.nats_url])
        await msg_manager.connect()
        await msg_manager.publish("subject", my_pydantic_model)
    """

    def __init__(self, servers: list[str]):
        self.nc = NATSClient()
        self.servers = servers

    async def connect(self) -> None:
        try:
            await self.nc.connect(servers=self.servers)
            log.info(f"Connected to NATS at {self.servers}")
        except Exception as exc:
            log.error(f"Failed to connect to NATS: {exc}")
            raise

    async def publish(self, subject: str, message: BaseModel) -> None:
        """Serialises a Pydantic model to JSON and publishes it."""
        if not self.nc.is_connected:
            await self.connect()
        payload = message.model_dump_json().encode()
        await self.nc.publish(subject, payload)
        log.info(f"Published message to {subject}")

    async def subscribe(
        self,
        subject: str,
        model_type: Type[T],
        callback: Callable[[T], Any],
    ) -> None:
        """Subscribes to a NATS subject and parses messages into Pydantic models."""

        async def _handler(msg: Any) -> None:
            data = json.loads(msg.data.decode())
            try:
                parsed = model_type(**data)
                await callback(parsed)
            except Exception as exc:
                log.error(f"Error processing message on '{subject}': {exc}")

        await self.nc.subscribe(subject, cb=_handler)
        log.info(f"Subscribed to {subject}")

    async def close(self) -> None:
        if self.nc.is_connected:
            await self.nc.close()
        log.info("NATS connection closed")


# ---------------------------------------------------------------------------
# STANDARD API HELPERS
# ---------------------------------------------------------------------------

class APIResponse(BaseModel):
    """Standardised API response wrapper."""

    success: bool
    message: str
    data: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)


class ERPException(HTTPException):
    """Base exception for ERP business logic errors."""

    def __init__(
        self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST
    ):
        super().__init__(status_code=status_code, detail=detail)
        log.error(f"ERPException [{status_code}]: {detail}")


class NotFoundException(ERPException):
    def __init__(self, resource: str, resource_id: Any):
        super().__init__(
            detail=f"{resource} with ID '{resource_id}' not found.",
            status_code=status.HTTP_404_NOT_FOUND,
        )