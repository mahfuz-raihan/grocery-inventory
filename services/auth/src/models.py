import enum
import uuid

from sqlalchemy import Boolean, Column, Enum as SAEnum, String
from sqlalchemy.dialects.postgresql import UUID

from shared.python.core import Base, TimestampMixin


class Role(str, enum.Enum):
    """User roles for RBAC. Used by both the model and schemas."""
    owner = "owner"
    manager = "manager"
    cashier = "cashier"
    stock_handler = "stock_handler"


class User(Base, TimestampMixin):
    """
    Core User model for Authentication & Authorization.
    Stored in the 'auth' PostgreSQL schema for schema isolation.
    """
    __tablename__ = "users"
    __table_args__ = {"schema": "auth"}

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    email = Column(String(255), unique=True, index=True, nullable=False)
    # Column name used consistently across models, schemas, and main.py
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)

    # Role stored as VARCHAR to avoid cross-schema PostgreSQL enum type issues
    role = Column(
        SAEnum(Role, native_enum=False),
        default=Role.cashier,
        nullable=False,
    )

    # Branch UUID — nullable for owner-level accounts that span all branches
    branch_id = Column(UUID(as_uuid=True), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)