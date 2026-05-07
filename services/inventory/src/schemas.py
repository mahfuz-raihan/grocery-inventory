from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class ProductBase(BaseModel):
    sku: str = Field(..., description="Stock Keeping Unit (Unique identifier)")
    name: str = Field(..., min_length=2, max_length=255)
    price: float = Field(..., gt=0, description="Price must be greater than zero")

class ProductCreate(ProductBase):
    stock_quantity: int = Field(default=0, ge=0)

class ProductResponse(ProductBase):
    id: int
    stock_quantity: int
    
    # Add timestamps to our API response
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StockUpdateEvent(BaseModel):
    sku: str
    quantity_change: int
    reason: str