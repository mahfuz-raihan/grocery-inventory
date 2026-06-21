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

class CheckoutRequest(BaseModel):
    branch_id: uuid.UUID
    cashier_id: uuid.UUID
    items: List[CheckoutItem] = Field(..., min_length=1)
    status: OrderStatus = OrderStatus.paid

# --- Outgoing Responses ---
class SaleItemResponse(BaseModel):
    product_id: uuid.UUID
    quantity: float
    unit_price: float
    subtotal: float
    model_config = ConfigDict(from_attributes=True)

class SaleResponse(BaseModel):
    id: uuid.UUID
    receipt_number: str
    total_amount: float
    status: OrderStatus
    created_at: datetime
    items: List[SaleItemResponse]
    model_config = ConfigDict(from_attributes=True)

# --- NATS Event Schema ---
class OrderCompletedEvent(BaseModel):
    sale_id: uuid.UUID
    branch_id: uuid.UUID
    items: List[CheckoutItem]