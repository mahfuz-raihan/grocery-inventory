import enum
import uuid

from sqlalchemy import Boolean, Column, Enum as SAEnum, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from shared.python.core import Base, TimestampMixin


class MovementType(str, enum.Enum):
    """Describes why a stock ledger entry was created."""
    sale = "sale"
    receipt = "receipt"
    adjustment = "adjustment"
    transfer = "transfer"
    damage = "damage"


class Branch(Base, TimestampMixin):
    """A physical store branch or warehouse location."""
    __tablename__ = "branches"
    __table_args__ = {"schema": "inventory"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    address = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    is_head_office = Column(Boolean, default=False, nullable=False)


class Category(Base, TimestampMixin):
    """Product category for catalogue organisation."""
    __tablename__ = "categories"
    __table_args__ = {"schema": "inventory"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)


class Product(Base, TimestampMixin):
    """
    Master product record. Stock levels are NOT stored here —
    they are derived on-the-fly from the StockLedger (event-sourced).
    """
    __tablename__ = "products"
    __table_args__ = {"schema": "inventory"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    sku = Column(String(50), unique=True, nullable=False, index=True)
    barcode = Column(String(100), unique=True, nullable=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    unit = Column(String(50), nullable=True)
    selling_price = Column(Float, nullable=False, default=0.0)
    category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("inventory.categories.id"),
        nullable=True,
    )
    is_active = Column(Boolean, default=True, nullable=False)


class StockLedger(Base, TimestampMixin):
    """
    Append-only ledger of every stock movement.
    Current stock = SUM(quantity_change) for a product/branch.
    """
    __tablename__ = "stock_ledger"
    __table_args__ = {"schema": "inventory"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    branch_id = Column(
        UUID(as_uuid=True),
        ForeignKey("inventory.branches.id"),
        nullable=False,
        index=True,
    )
    product_id = Column(
        UUID(as_uuid=True),
        ForeignKey("inventory.products.id"),
        nullable=False,
        index=True,
    )
    # Positive = stock in, negative = stock out
    quantity_change = Column(Float, nullable=False)
    movement_type = Column(
        SAEnum(MovementType, native_enum=False),
        nullable=False,
    )


class GRN(Base, TimestampMixin):
    """Goods Receipt Note — records an incoming supplier delivery."""
    __tablename__ = "grn"
    __table_args__ = {"schema": "inventory"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    branch_id = Column(
        UUID(as_uuid=True),
        ForeignKey("inventory.branches.id"),
        nullable=False,
    )
    supplier_name = Column(String(200), nullable=False)
    invoice_reference = Column(String(100), nullable=True)
    total_amount = Column(Float, default=0.0, nullable=False)
    status = Column(String(50), default="completed", nullable=False)

    items = relationship("GRNItem", back_populates="grn", cascade="all, delete-orphan")


class GRNItem(Base, TimestampMixin):
    """Individual line item within a GRN."""
    __tablename__ = "grn_items"
    __table_args__ = {"schema": "inventory"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    grn_id = Column(
        UUID(as_uuid=True),
        ForeignKey("inventory.grn.id"),
        nullable=False,
    )
    product_id = Column(
        UUID(as_uuid=True),
        ForeignKey("inventory.products.id"),
        nullable=False,
    )
    quantity_received = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    grn = relationship("GRN", back_populates="items")