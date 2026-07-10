import os
import uuid
from datetime import datetime, date, time, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, func
from sqlalchemy.orm import selectinload

from shared.python.core import DatabaseManager, MessagingManager, log, Base
from src.models import Sale, SaleItem, OrderStatus
from src.schemas import CheckoutRequest, SaleResponse, OrderCompletedEvent
from src.config import settings

db_manager = DatabaseManager(settings.database_url)
msg_manager = MessagingManager([settings.nats_url])

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting Sales Service...")
    async with db_manager.engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS sales"))
        
        # Ensure database tables are created
        await conn.run_sync(Base.metadata.create_all)
        
        # Ensure schema migrations for new customer and discount columns
        try:
            await conn.execute(text("ALTER TABLE sales.sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150) NULL"))
            await conn.execute(text("ALTER TABLE sales.sales ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50) NULL"))
            await conn.execute(text("ALTER TABLE sales.sales ADD COLUMN IF NOT EXISTS discount DOUBLE PRECISION DEFAULT 0.0 NOT NULL"))
        except Exception as e:
            log.warning(f"Could not run schema migrations for customer/discount columns: {e}")
            
        log.info("Database schema (Sales) initialized successfully.")
        
    await msg_manager.connect()
    yield
    await msg_manager.close()
    await db_manager.engine.dispose()

app = FastAPI(
    title="Grocery ERP - Sales Service",
    version="1.1.0",
    lifespan=lifespan,
    docs_url="/api/v1/sales/docs",
    openapi_url="/api/v1/sales/openapi.json"
)

# --- CHECKOUT ENDPOINT ---

@app.post("/api/v1/sales/checkout", response_model=SaleResponse, status_code=201)
async def process_checkout(request: CheckoutRequest, session: AsyncSession = Depends(db_manager.get_session)):
    """Processes a POS cart, generates a receipt, and publishes a NATS event."""
    
    date_str = datetime.now().strftime("%Y%m%d")
    short_uuid = str(uuid.uuid4()).split('-')[0].upper()
    receipt_no = f"INV-{date_str}-{short_uuid}"

    gross_total = sum(item.quantity * item.unit_price for item in request.items)
    total = max(0.0, gross_total - request.discount)

    new_sale = Sale(
        branch_id=request.branch_id,
        cashier_id=request.cashier_id,
        receipt_number=receipt_no,
        total_amount=total,
        discount=request.discount,
        customer_name=request.customer_name,
        customer_phone=request.customer_phone,
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

    result = await session.execute(
        select(Sale)
        .options(selectinload(Sale.items))
        .where(Sale.id == new_sale.id)
    )
    final_sale = result.scalar_one()

    event = OrderCompletedEvent(
        sale_id=final_sale.id,
        branch_id=final_sale.branch_id,
        items=request.items
    )
    await msg_manager.publish("sales.order.completed", event)

    return final_sale


# --- ANALYTICS & REPORTING ENDPOINTS ---

@app.get("/api/v1/sales/reports/daily")
async def get_daily_sales_report(
    target_date: date | None = None,
    branch_id: uuid.UUID | None = None,
    session: AsyncSession = Depends(db_manager.get_session)
):
    """Calculates total revenue and transaction count for a specific day."""
    
    # Default to today if no date is provided
    report_date = target_date or datetime.now(timezone.utc).date()
    
    # Create start and end timestamps for the target day
    start_of_day = datetime.combine(report_date, time.min).replace(tzinfo=timezone.utc)
    end_of_day = datetime.combine(report_date, time.max).replace(tzinfo=timezone.utc)

    # Base query to calculate sum and count
    query = select(
        func.coalesce(func.sum(Sale.total_amount), 0).label("total_revenue"),
        func.count(Sale.id).label("transaction_count")
    ).where(
        Sale.created_at >= start_of_day,
        Sale.created_at <= end_of_day,
        Sale.status == OrderStatus.paid
    )

    # Filter by branch if requested
    if branch_id:
        query = query.where(Sale.branch_id == branch_id)

    result = await session.execute(query)
    row = result.fetchone()

    return {
        "date": report_date.isoformat(),
        "branch_id": branch_id,
        "total_revenue": float(row.total_revenue),
        "transaction_count": row.transaction_count
    }