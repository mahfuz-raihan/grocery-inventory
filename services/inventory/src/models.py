import datetime
import enum
import uuid

from sqlalchemy import Boolean, Column, Date, Enum as SAEnum, Float, ForeignKey, String, Text, DateTime, func, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, backref

from shared.python.core import Base, TimestampMixin


class MovementType(str, enum.Enum):
    """Describes why a stock ledger entry was created."""
    purchase_receive = "purchase_receive"
    stock_transfer = "stock_transfer"
    production_consumption = "production_consumption"
    production_completion = "production_completion"
    sales_delivery = "sales_delivery"
    return_item = "return"
    damage = "damage"
    adjustment = "adjustment"


class Supplier(Base, TimestampMixin):
    """Product suppliers tracking."""
    __tablename__ = "suppliers"
    __table_args__ = {"schema": "inventory"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(200), nullable=False, index=True)
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)


class Branch(Base, TimestampMixin):
    """A physical store branch or warehouse location."""
    __tablename__ = "branches"
    __table_args__ = {"schema": "inventory"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    address = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    is_head_office = Column(Boolean, default=False, nullable=False)
    branch_type = Column(String(50), default="warehouse", nullable=False) # store, warehouse


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

    # Variations (self-referencing parent-child structure)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("inventory.products.id"), nullable=True, index=True)

    # Product Classification
    product_type = Column(String(50), default="finished_product", nullable=False) # raw_material, finished_product, semi_finished_product, consumable, spare_parts

    # Furniture / Spec Dimensions
    material_type = Column(String(100), nullable=True)
    wood_type = Column(String(100), nullable=True)
    board_type = Column(String(100), nullable=True)
    color = Column(String(50), nullable=True)
    size = Column(String(50), nullable=True)
    length = Column(Float, nullable=True)
    width = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    thickness = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)

    # Costing & Inventory thresholds
    purchase_cost = Column(Float, default=0.0, nullable=False)
    commission = Column(Float, default=0.0, nullable=False)
    additional_cost = Column(Float, default=0.0, nullable=False)
    average_cost = Column(Float, default=0.0, nullable=False)
    tax_rate = Column(Float, default=0.0, nullable=False)
    min_stock_level = Column(Float, default=0.0, nullable=False)
    max_stock_level = Column(Float, default=0.0, nullable=False)
    reorder_quantity = Column(Float, default=0.0, nullable=False)

    # Image
    product_image = Column(String(500), nullable=True)

    # Supplier Link
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("inventory.suppliers.id"), nullable=True)

    # Dynamically specifiable properties (JSONB)
    custom_attributes = Column(JSONB, nullable=True)

    # Self reference
    parent = relationship("Product", remote_side=[id], back_populates="variants")
    variants = relationship("Product", back_populates="parent", cascade="all, delete-orphan")


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
    supplier_name = Column(String(200), nullable=True, index=True)


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
    supplier_contact = Column(String(100), nullable=True)
    supplier_phone = Column(String(50), nullable=True)
    supplier_email = Column(String(100), nullable=True)
    supplier_address = Column(Text, nullable=True)
    invoice_reference = Column(String(100), nullable=True)
    receiving_date = Column(Date, nullable=True, default=datetime.date.today)
    total_amount = Column(Float, default=0.0, nullable=False)
    discount = Column(Float, default=0.0, nullable=False)
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
    unit_price = Column(Float, nullable=True)
    commission = Column(Float, default=0.0, nullable=True)

    # Added columns for specs
    ordered_quantity = Column(Float, default=0.0, nullable=False)
    damaged_quantity = Column(Float, default=0.0, nullable=False)
    batch_number = Column(String(100), nullable=True)

    grn = relationship("GRN", back_populates="items")


class StockTransfer(Base, TimestampMixin):
    """Logs stock transfers between warehouses."""
    __tablename__ = "stock_transfers"
    __table_args__ = {"schema": "inventory"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("inventory.products.id"), nullable=False)
    from_branch_id = Column(UUID(as_uuid=True), ForeignKey("inventory.branches.id"), nullable=False)
    to_branch_id = Column(UUID(as_uuid=True), ForeignKey("inventory.branches.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    status = Column(String(50), default="completed", nullable=False)
    reference = Column(String(100), nullable=True)

    product = relationship("Product")
    from_branch = relationship("Branch", foreign_keys=[from_branch_id])
    to_branch = relationship("Branch", foreign_keys=[to_branch_id])


class StockAdjustment(Base, TimestampMixin):
    """Logs manual stock corrections."""
    __tablename__ = "stock_adjustments"
    __table_args__ = {"schema": "inventory"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("inventory.products.id"), nullable=False)
    branch_id = Column(UUID(as_uuid=True), ForeignKey("inventory.branches.id"), nullable=False)
    current_quantity = Column(Float, nullable=False)
    adjusted_quantity = Column(Float, nullable=False)
    reason = Column(String(200), nullable=False)
    notes = Column(Text, nullable=True)
    approved_by = Column(String(100), nullable=False)

    product = relationship("Product")
    branch = relationship("Branch")


class CompanyProfile(Base):
    """Holds global settings for the company profile."""
    __tablename__ = "company_profile"
    __table_args__ = {"schema": "inventory"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), default="Manor Furniture", nullable=False)
    address = Column(Text, default="Bozlur Mor, Kushita", nullable=True)
    phone = Column(String(50), default="01700000000", nullable=True)
    email = Column(String(100), default="accounts@manorfurniture.com", nullable=True)
    contact_person = Column(String(100), default="Manager", nullable=True)


class AppSetting(Base):
    """Holds global key-value configuration settings (e.g. JSON strings)."""
    __tablename__ = "app_settings"
    __table_args__ = {"schema": "inventory"}

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)