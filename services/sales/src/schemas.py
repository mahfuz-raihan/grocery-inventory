from datetime import datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field
from src.models import OrderStatus

# --- Incoming Cart Data ---
class CheckoutItem(BaseModel):
    product_id: uuid.UUID
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    supplier_name: Optional[str] = None

class CheckoutRequest(BaseModel):
    branch_id: uuid.UUID
    cashier_id: uuid.UUID
    items: List[CheckoutItem] = Field(..., min_length=1)
    status: OrderStatus = OrderStatus.paid
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    discount: float = 0.0

# --- Outgoing Responses ---
class SaleItemResponse(BaseModel):
    product_id: uuid.UUID
    quantity: float
    unit_price: float
    subtotal: float
    supplier_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class SaleResponse(BaseModel):
    id: uuid.UUID
    receipt_number: str
    total_amount: float
    discount: float = 0.0
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    status: OrderStatus
    created_at: datetime
    items: List[SaleItemResponse]
    model_config = ConfigDict(from_attributes=True)

class SaleUpdateRequest(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    discount: Optional[float] = None


# --- NATS Event Schema ---
class OrderCompletedEvent(BaseModel):
    sale_id: uuid.UUID
    branch_id: uuid.UUID
    items: List[CheckoutItem]