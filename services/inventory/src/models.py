from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, Float
from shared.python.core import Base

class Product(Base):
    __tablename__ = "products"
    # Schema isolation: Inventory data lives in the 'inventory' schema
    __table_args__ = {"schema": "inventory"}

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    sku: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    price: Mapped[float] = mapped_column(Float)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)