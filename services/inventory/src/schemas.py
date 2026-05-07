from pydantic import BaseModel, ConfigDict, Field

# Using Pydantic v2 for robust validation
class ProductBase(BaseModel):
    sku: str = Field(..., description="Stock Keeping Unit (Unique identifier)")
    name: str = Field(..., min_length=2, max_length=255)
    price: float = Field(..., gt=0, description="Price must be greater than zero")

class ProductCreate(ProductBase):
    stock_quantity: int = Field(default=0, ge=0)

class ProductResponse(ProductBase):
    id: int
    stock_quantity: int

    # Pydantic v2 way to tell it to read data even if it's not a dict (like an ORM model)
    model_config = ConfigDict(from_attributes=True)

# Event schema for NATS messaging
class StockUpdateEvent(BaseModel):
    sku: str
    quantity_change: int
    reason: str