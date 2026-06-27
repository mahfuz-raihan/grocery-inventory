import enum
import uuid

from sqlalchemy import Column, Enum as SAEnum, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from shared.python.core import Base, TimestampMixin


class OrderStatus(str, enum.Enum):
    """
    Lifecycle status of a sale transaction.
    Values are lowercase to match the REST API contract and Pydantic schema defaults.
    """
    paid = "paid"
    pending = "pending"
    refunded = "refunded"
    cancelled = "cancelled"


class Sale(Base, TimestampMixin):
    """
    Represents a completed POS transaction / receipt.
    Named 'Sale' (not 'SalesOrder') to match all imports in main.py.
    """
    __tablename__ = "sales"
    __table_args__ = {"schema": "sales"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    receipt_number = Column(String(50), unique=True, nullable=False, index=True)

    # IDs reference Auth/Inventory services — stored as plain UUIDs (no FK constraint)
    branch_id = Column(UUID(as_uuid=True), nullable=False)
    cashier_id = Column(UUID(as_uuid=True), nullable=True)

    total_amount = Column(Float, default=0.0, nullable=False)
    status = Column(
        SAEnum(OrderStatus, native_enum=False),
        default=OrderStatus.paid,
        nullable=False,
    )

    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base, TimestampMixin):
    """
    Individual line item within a Sale.
    Named 'SaleItem' to match all imports in main.py.
    product_id is a plain UUID — no FK since products live in the inventory schema.
    """
    __tablename__ = "sale_items"
    __table_args__ = {"schema": "sales"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    sale_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sales.sales.id"),
        nullable=False,
    )
    product_id = Column(UUID(as_uuid=True), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    sale = relationship("Sale", back_populates="items")