import logging
import json
import asyncio
from datetime import datetime
from typing import Any, Callable, Optional, Type, TypeVar

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from nats.aio.client import Client as NATSClient
from pydantic import BaseModel

# --- STRUCTURED LOGGING ---
def get_logger(name: str):
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger

log = get_logger("shared-core")

# --- DATABASE SESSION MANAGER ---
class Base(DeclarativeBase):
    """Base class for all models in microservices"""
    pass

class DatabaseManager:
    def __init__(self, db_url: str):
        self.engine = create_async_engine(
            db_url,
            echo=False,
            pool_pre_ping=True,
            future=True
        )
        self.session_factory = async_sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )

    async def get_session(self) -> AsyncSession:
        async with self.session_factory() as session:
            try:
                yield session
            finally:
                await session.close()

# --- NATS MESSAGING WRAPPER ---
T = TypeVar("T", bound=BaseModel)

class MessagingManager:
    def __init__(self, servers: list[str]):
        self.nc = NATSClient()
        self.servers = servers

    async def connect(self):
        try:
            await self.nc.connect(servers=self.servers)
            log.info(f"Connected to NATS at {self.servers}")
        except Exception as e:
            log.error(f"Failed to connect to NATS: {e}")
            raise

    async def publish(self, subject: str, message: BaseModel):
        """Publishes a Pydantic model as JSON to NATS"""
        if not self.nc.is_connected:
            await self.connect()
        
        payload = message.model_dump_json().encode()
        await self.nc.publish(subject, payload)
        log.info(f"Published message to {subject}")

    async def subscribe(self, subject: str, model_type: Type[T], callback: Callable[[T], Any]):
        """Subscribes to a subject and parses payload into specified Pydantic model"""
        async def message_handler(msg):
            data = json.loads(msg.data.decode())
            try:
                parsed_data = model_type(**data)
                await callback(parsed_data)
            except Exception as e:
                log.error(f"Error processing message on {subject}: {e}")

        await self.nc.subscribe(subject, cb=message_handler)
        log.info(f"Subscribed to {subject}")

    async def close(self):
        await self.nc.close()
        log.info("NATS connection closed")