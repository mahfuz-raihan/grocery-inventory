from datetime import datetime, date
from typing import Optional, Any, Dict
import uuid
from pydantic import BaseModel, ConfigDict, Field
from src.models import MovementType

# --- Supplier Schemas ---
class SupplierBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    contact_person: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    is_active: bool = True

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    contact_person: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    is_active: Optional[bool] = None

class SupplierResponse(SupplierBase):
    id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Branch Schemas ---
class BranchBase(BaseModel):
    name: str = Field(..., max_length=100)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    is_head_office: bool = False
    branch_type: str = "warehouse" # store, warehouse

class BranchCreate(BranchBase):
    pass

class BranchResponse(BranchBase):
    id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: str = Field(..., max_length=100)

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- Product Schemas ---
class ProductBase(BaseModel):
    sku: str = Field(..., description="Stock Keeping Unit")
    barcode: Optional[str] = Field(None, description="Barcode reference")
    name: str = Field(..., min_length=2, max_length=200)
    unit: Optional[str] = Field(None, description="e.g., pcs, kg, litre, cubic feet")
    selling_price: float = Field(..., ge=0)
    category_id: Optional[uuid.UUID] = None
    is_active: bool = True
    
    # Variations & Type
    parent_id: Optional[uuid.UUID] = None
    product_type: str = "finished_product" # raw_material, finished_product, etc.
    
    # Dimensions
    material_type: Optional[str] = None
    wood_type: Optional[str] = None
    board_type: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    thickness: Optional[float] = None
    weight: Optional[float] = None
    
    # Costs & Thresholds
    purchase_cost: float = Field(default=0.0, ge=0)
    commission: float = Field(default=0.0, ge=0)
    additional_cost: float = Field(default=0.0, ge=0)
    average_cost: float = Field(default=0.0, ge=0)
    tax_rate: float = Field(default=0.0, ge=0)
    min_stock_level: float = Field(default=0.0, ge=0)
    max_stock_level: float = Field(default=0.0, ge=0)
    reorder_quantity: float = Field(default=0.0, ge=0)
    
    # Image & Supplier
    product_image: Optional[str] = None
    supplier_id: Optional[uuid.UUID] = None
    custom_attributes: Optional[Dict[str, Any]] = None

class ProductCreate(ProductBase):
    # Virtual fields to handle initial stock generation securely during creation
    initial_stock_quantity: float = Field(default=0, ge=0)
    branch_id: Optional[uuid.UUID] = Field(None, description="Required if initial stock is > 0")

class ProductResponse(ProductBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Extended response that calculates stock from the ledger
class ProductWithStockResponse(ProductResponse):
    current_stock: float = 0.0
    # Include variants list if template
    variants: list[ProductResponse] = []

# --- GRN Schemas ---
class GRNItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity_received: float = Field(..., gt=0)
    cost_price: float = Field(..., ge=0)
    ordered_quantity: float = Field(default=0.0, ge=0)
    damaged_quantity: float = Field(default=0.0, ge=0)
    batch_number: Optional[str] = None
    selling_price: Optional[float] = Field(None, ge=0, description="Update product selling price on receive")
    unit_price: Optional[float] = Field(None, ge=0)
    commission: Optional[float] = Field(0.0, ge=0)


class GRNCreate(BaseModel):
    branch_id: uuid.UUID
    supplier_name: str = Field(..., min_length=2, max_length=200)
    supplier_contact: Optional[str] = Field(None, max_length=100)
    supplier_phone: Optional[str] = Field(None, max_length=50)
    supplier_email: Optional[str] = Field(None, max_length=100)
    supplier_address: Optional[str] = None
    invoice_reference: Optional[str] = Field(None, max_length=100)
    receiving_date: Optional[date] = None
    items: list[GRNItemCreate] = Field(..., min_length=1)

class GRNItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity_received: float
    cost_price: float
    subtotal: float
    ordered_quantity: float
    damaged_quantity: float
    batch_number: Optional[str]
    unit_price: Optional[float] = None
    commission: Optional[float] = 0.0
    model_config = ConfigDict(from_attributes=True)

class GRNResponse(BaseModel):
    id: uuid.UUID
    branch_id: uuid.UUID
    supplier_name: str
    supplier_contact: Optional[str] = None
    supplier_phone: Optional[str] = None
    supplier_email: Optional[str] = None
    supplier_address: Optional[str] = None
    invoice_reference: Optional[str]
    receiving_date: Optional[date]
    total_amount: float
    status: str
    created_at: datetime
    items: list[GRNItemResponse]
    model_config = ConfigDict(from_attributes=True)

# --- Stock Transfer Schemas ---
class StockTransferCreate(BaseModel):
    product_id: uuid.UUID
    from_branch_id: uuid.UUID
    to_branch_id: uuid.UUID
    quantity: float = Field(..., gt=0)
    reference: Optional[str] = Field(None, max_length=100)

class StockTransferResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    from_branch_id: uuid.UUID
    to_branch_id: uuid.UUID
    quantity: float
    status: str
    reference: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Stock Adjustment Schemas ---
class StockAdjustmentCreate(BaseModel):
    product_id: uuid.UUID
    branch_id: uuid.UUID
    current_quantity: float = Field(..., ge=0)
    adjusted_quantity: float = Field(..., description="The quantity change (can be positive or negative)")
    reason: str = Field(..., min_length=2, max_length=200)
    notes: Optional[str] = None
    approved_by: str = Field(..., min_length=2, max_length=100)

class StockAdjustmentResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    branch_id: uuid.UUID
    current_quantity: float
    adjusted_quantity: float
    reason: str
    notes: Optional[str]
    approved_by: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Event Schemas ---
class StockUpdateEvent(BaseModel):
    product_id: uuid.UUID
    branch_id: uuid.UUID
    quantity_change: float
    movement_type: str


# --- Update & Report Schemas ---
class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    barcode: Optional[str] = None
    name: Optional[str] = None
    unit: Optional[str] = None
    selling_price: Optional[float] = None
    category_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None
    parent_id: Optional[uuid.UUID] = None
    product_type: Optional[str] = None
    material_type: Optional[str] = None
    wood_type: Optional[str] = None
    board_type: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    thickness: Optional[float] = None
    weight: Optional[float] = None
    purchase_cost: Optional[float] = None
    commission: Optional[float] = None
    additional_cost: Optional[float] = None
    average_cost: Optional[float] = None
    tax_rate: Optional[float] = None
    min_stock_level: Optional[float] = None
    max_stock_level: Optional[float] = None
    reorder_quantity: Optional[float] = None
    product_image: Optional[str] = None
    supplier_id: Optional[uuid.UUID] = None
    custom_attributes: Optional[Dict[str, Any]] = None

class StockMovementResponse(BaseModel):
    id: uuid.UUID
    branch_id: uuid.UUID
    branch_name: str
    product_id: uuid.UUID
    product_sku: str
    product_name: str
    quantity_change: float
    movement_type: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ConsumptionReportResponse(BaseModel):
    product_id: uuid.UUID
    sku: str
    name: str
    total_consumed: float
    unit: Optional[str]
    model_config = ConfigDict(from_attributes=True)

class DeadStockResponse(BaseModel):
    product_id: uuid.UUID
    sku: str
    name: str
    current_stock: float
    last_movement_date: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class CompanyProfileResponse(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    contact_person: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class CompanyProfileUpdate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    contact_person: Optional[str] = None