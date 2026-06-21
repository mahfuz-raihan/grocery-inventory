from datetime import datetime
import uuid
import enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from shared.python.core import Base

class Role(str, enum.Enum):
    owner = "owner"
    manager = "manager"
    cashier = "cashier"
    stock_handler = "stock_handler"

class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "auth"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Branch ID is a soft-link to the Inventory service's branch. Null for 'owner' across all branches.
    branch_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    full_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    
    # FIX: native_enum=False forces PostgreSQL to use a simple String, preventing crash loops!
    role: Mapped[Role] = mapped_column(SQLEnum(Role, native_enum=False, length=50))
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())