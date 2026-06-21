import os
import uuid
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from sqlalchemy.orm import selectinload

from shared.python.core import DatabaseManager, MessagingManager, log, Base
from src.models import Sale, SaleItem
from src.schemas import CheckoutRequest, SaleResponse, OrderCompletedEvent

# Database and NATS URLs are fetched from the environment via Docker
DB_URL = os.getenv("DATABASE_URL")
NATS_URL = os.getenv("NATS_URL")

db_manager = DatabaseManager(DB_URL)
msg_manager = MessagingManager([NATS_URL])

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting Sales Service...")
    async with db_manager.engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS sales"))
        await conn.run_sync(Base.metadata.create_all)
        log.info("Database schema (Sales) initialized successfully.")
        
    await msg_manager.connect()
    yield
    await msg_manager.close()
    await db_manager.engine.dispose()

app = FastAPI(
    title="Grocery ERP - Sales Service",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/v1/sales/docs",
    openapi_url="/api/v1/sales/openapi.json"
)

@app.post("/api/v1/sales/checkout", response_model=SaleResponse, status_code=201)
async def process_checkout(request: CheckoutRequest, session: AsyncSession = Depends(db_manager.get_session)):
    """Processes a POS cart, generates a receipt, and publishes a NATS event."""
    
    date_str = datetime.now().strftime("%Y%m%d")
    short_uuid = str(uuid.uuid4()).split('-')[0].upper()
    receipt_no = f"INV-{date_str}-{short_uuid}"

    total = sum(item.quantity * item.unit_price for item in request.items)

    new_sale = Sale(
        branch_id=request.branch_id,
        cashier_id=request.cashier_id,
        receipt_number=receipt_no,
        total_amount=total,
        status=request.status
    )
    session.add(new_sale)
    await session.flush() 

    for item in request.items:
        new_item = SaleItem(
            sale_id=new_sale.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.quantity * item.unit_price
        )
        session.add(new_item)

    await session.commit()

    # FIX: Re-fetch the sale with the items relationship loaded eagerly
    # This prevents the MissingGreenlet error during Pydantic serialization
    result = await session.execute(
        select(Sale)
        .options(selectinload(Sale.items))
        .where(Sale.id == new_sale.id)
    )
    final_sale = result.scalar_one()

    # Publish the event
    event = OrderCompletedEvent(
        sale_id=final_sale.id,
        branch_id=final_sale.branch_id,
        items=request.items
    )
    await msg_manager.publish("sales.order.completed", event)

    return final_sale