from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field
from src.models import MovementType

# --- Branch Schemas ---
class BranchBase(BaseModel):
    name: str = Field(..., max_length=100)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    is_head_office: bool = False

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
    barcode: Optional[str] = Field(None, description="EAN-13 or UPC-A barcode")
    name: str = Field(..., min_length=2, max_length=200)
    unit: Optional[str] = Field(None, description="e.g., pcs, kg, litre")
    selling_price: float = Field(..., gt=0)
    category_id: Optional[uuid.UUID] = None
    is_active: bool = True

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

# --- Event Schemas ---
class StockUpdateEvent(BaseModel):
    product_id: uuid.UUID
    branch_id: uuid.UUID
    quantity_change: float
    movement_type: str