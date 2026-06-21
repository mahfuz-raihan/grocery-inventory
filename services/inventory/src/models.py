from datetime import datetime
import uuid
import enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey, Boolean, Numeric, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from shared.python.core import Base

class MovementType(str, enum.Enum):
    sale = "sale"
    grn = "grn"
    transfer_in = "transfer_in"
    transfer_out = "transfer_out"
    damage = "damage"
    adjustment = "adjustment"

class Branch(Base):
    __tablename__ = "branches"
    __table_args__ = {"schema": "inventory"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100))
    address: Mapped[str | None] = mapped_column(String)
    phone: Mapped[str | None] = mapped_column(String(20))
    is_head_office: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Category(Base):
    __tablename__ = "categories"
    __table_args__ = {"schema": "inventory"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    
    # Relationship
    products: Mapped[list["Product"]] = relationship(back_populates="category")

class Product(Base):
    __tablename__ = "products"
    __table_args__ = {"schema": "inventory"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sku: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    barcode: Mapped[str | None] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    category_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("inventory.categories.id"))
    unit: Mapped[str | None] = mapped_column(String(20))
    selling_price: Mapped[float] = mapped_column(Numeric(10, 2))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    category: Mapped["Category"] = relationship(back_populates="products")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class GRN(Base):
    __tablename__ = "goods_receipt_notes"
    __table_args__ = {"schema": "inventory"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    branch_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("inventory.branches.id"))
    supplier_name: Mapped[str] = mapped_column(String(200))
    invoice_reference: Mapped[str | None] = mapped_column(String(100))
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2))
    status: Mapped[str] = mapped_column(String(20), default="completed")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    items: Mapped[list["GRNItem"]] = relationship(back_populates="grn", cascade="all, delete-orphan")

class GRNItem(Base):
    __tablename__ = "grn_items"
    __table_args__ = {"schema": "inventory"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    grn_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("inventory.goods_receipt_notes.id"))
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("inventory.products.id"))
    quantity_received: Mapped[float] = mapped_column(Numeric(10, 3))
    cost_price: Mapped[float] = mapped_column(Numeric(10, 2))
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2))

    grn: Mapped["GRN"] = relationship(back_populates="items")

class StockLedger(Base):
    __tablename__ = "stock_ledger"
    __table_args__ = {"schema": "inventory"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    branch_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("inventory.branches.id"))
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("inventory.products.id"))
    quantity_change: Mapped[float] = mapped_column(Numeric(10, 3))
    movement_type: Mapped[MovementType] = mapped_column(SQLEnum(MovementType))
    reference_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    cost_price_at_time: Mapped[float | None] = mapped_column(Numeric(10, 2))
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())