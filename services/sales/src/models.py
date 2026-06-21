from datetime import datetime
import uuid
import enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey, Numeric, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from shared.python.core import Base

class OrderStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"

class Sale(Base):
    __tablename__ = "sales"
    __table_args__ = {"schema": "sales"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    branch_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    cashier_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    
    # Human Readable Invoice Number
    receipt_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2))
    status: Mapped[OrderStatus] = mapped_column(SQLEnum(OrderStatus, native_enum=False, length=20), default=OrderStatus.paid)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationship to items
    items: Mapped[list["SaleItem"]] = relationship(back_populates="sale", cascade="all, delete-orphan")

class SaleItem(Base):
    __tablename__ = "sale_items"
    __table_args__ = {"schema": "sales"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sales.sales.id"))
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    
    quantity: Mapped[float] = mapped_column(Numeric(10, 3))
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2))
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2))

    sale: Mapped["Sale"] = relationship(back_populates="items")