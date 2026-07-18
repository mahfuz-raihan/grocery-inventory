import os
import uuid
from datetime import datetime, date, time, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, func
from sqlalchemy.orm import selectinload

from shared.python.core import DatabaseManager, MessagingManager, log, Base
from src.models import Sale, SaleItem, OrderStatus, SaleAuditLog
from src.schemas import CheckoutRequest, SaleResponse, OrderCompletedEvent, SaleUpdateRequest
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
        
        # Ensure schema migrations for new customer, discount, and supplier columns
        try:
            await conn.execute(text("ALTER TABLE sales.sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150) NULL"))
            await conn.execute(text("ALTER TABLE sales.sales ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50) NULL"))
            await conn.execute(text("ALTER TABLE sales.sales ADD COLUMN IF NOT EXISTS customer_address VARCHAR(255) NULL"))
            await conn.execute(text("ALTER TABLE sales.sales ADD COLUMN IF NOT EXISTS discount DOUBLE PRECISION DEFAULT 0.0 NOT NULL"))
            await conn.execute(text("ALTER TABLE sales.sale_items ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(200) NULL"))
        except Exception as e:
            log.warning(f"Could not run schema migrations: {e}")
            
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

# --- AUDIT LOG HELPER ---
async def write_audit_log(session: AsyncSession, action: str, sale_id: uuid.UUID, detail: str):
    """Logs financial mutations and payment states to the database sale_audit_logs table."""
    try:
        log_entry = SaleAuditLog(
            sale_id=sale_id,
            action=action,
            detail=detail
        )
        session.add(log_entry)
        log.info(f"[DB-AUDIT] [{action.upper()}] Sale {sale_id}: {detail}")
    except Exception as e:
        log.error(f"Failed to write DB audit log: {e}")


# --- CHECKOUT ENDPOINT ---

@app.post("/api/v1/sales/checkout", response_model=SaleResponse, status_code=201)
async def process_checkout(request: CheckoutRequest, session: AsyncSession = Depends(db_manager.get_session)):
    """Processes a POS cart, generates a receipt, and publishes a NATS event if paid."""
    
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
        customer_address=request.customer_address,
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
            subtotal=item.quantity * item.unit_price,
            supplier_name=item.supplier_name
        )
        session.add(new_item)

    # Log checkout creation in database audit log
    await write_audit_log(
        session, 
        "created", 
        new_sale.id, 
        f"Checkout created with status '{request.status}'. Gross: {gross_total:.2f}, Discount: {request.discount:.2f}, Net: {total:.2f}"
    )

    await session.commit()

    result = await session.execute(
        select(Sale)
        .options(selectinload(Sale.items))
        .where(Sale.id == new_sale.id)
    )
    final_sale = result.scalar_one()

    # Publish NATS stock deduction event ONLY if checked out as 'paid'
    if final_sale.status == OrderStatus.paid:
        event = OrderCompletedEvent(
            sale_id=final_sale.id,
            branch_id=final_sale.branch_id,
            items=[
                {
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "supplier_name": item.supplier_name
                } 
                for item in final_sale.items
            ]
        )
        await msg_manager.publish("sales.order.completed", event)
        await write_audit_log(
            session,
            "finalized",
            final_sale.id,
            f"NATS checkout deductions triggered at creation time for status '{final_sale.status}'"
        )
        await session.commit()

    return final_sale


@app.put("/api/v1/sales/{sale_id}", response_model=SaleResponse)
async def update_sale(sale_id: uuid.UUID, request: SaleUpdateRequest, session: AsyncSession = Depends(db_manager.get_session)):
    """Updates a pending sale's customer name, phone, address, or discount, and recalculates the total."""
    from fastapi import HTTPException
    result = await session.execute(
        select(Sale)
        .options(selectinload(Sale.items))
        .where(Sale.id == sale_id)
    )
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
        
    # Allow editing both pending and paid sales to support post-checkout corrections
    pass

    if request.customer_name is not None:
        sale.customer_name = request.customer_name.strip() or None
    if request.customer_phone is not None:
        sale.customer_phone = request.customer_phone.strip() or None
    if request.customer_address is not None:
        sale.customer_address = request.customer_address.strip() or None
        
    if request.discount is not None:
        sale.discount = max(0.0, request.discount)
        
    # Recalculate total_amount
    gross_total = sum(item.quantity * item.unit_price for item in sale.items)
    sale.total_amount = max(0.0, gross_total - sale.discount)

    # Log database audit
    await write_audit_log(
        session,
        "updated",
        sale.id,
        f"Invoice updated. Name: {sale.customer_name}, Phone: {sale.customer_phone}, Address: {sale.customer_address}, Discount: {sale.discount:.2f}, Total: {sale.total_amount:.2f}"
    )

    await session.commit()
    return sale


@app.post("/api/v1/sales/{sale_id}/complete", response_model=SaleResponse)
async def complete_sale(sale_id: uuid.UUID, session: AsyncSession = Depends(db_manager.get_session)):
    """Transitions a pending sale's status to paid and publishes the NATS stock deduction event."""
    from fastapi import HTTPException
    result = await session.execute(
        select(Sale)
        .options(selectinload(Sale.items))
        .where(Sale.id == sale_id)
    )
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    if sale.status == OrderStatus.paid:
        return sale  # Already completed

    sale.status = OrderStatus.paid

    # Log database audit
    await write_audit_log(
        session,
        "finalized",
        sale.id,
        f"Payment finalized. Status transitioned to PAID. Total: {sale.total_amount:.2f}"
    )

    await session.commit()

    # Publish NATS stock deduction event
    event = OrderCompletedEvent(
        sale_id=sale.id,
        branch_id=sale.branch_id,
        items=[
            {
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "supplier_name": item.supplier_name
            } 
            for item in sale.items
        ]
    )
    await msg_manager.publish("sales.order.completed", event)

    return sale


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


@app.get("/api/v1/sales/customer/{phone}", response_model=dict)
async def get_customer_by_phone(phone: str, session: AsyncSession = Depends(db_manager.get_session)):
    """Fetch the latest customer name and address by phone number."""
    result = await session.execute(
        select(Sale)
        .filter(Sale.customer_phone == phone)
        .order_by(Sale.created_at.desc())
        .limit(1)
    )
    sale = result.scalar_one_or_none()
    if sale:
        return {
            "customer_name": sale.customer_name or "",
            "customer_address": sale.customer_address or ""
        }
    return {"customer_name": "", "customer_address": ""}


async def get_grouped_data(session: AsyncSession, interval: str, start_dt: datetime, end_dt: datetime, branch_id: uuid.UUID | None):
    trunc_expr = func.date_trunc(interval, Sale.created_at)
    query = select(
        trunc_expr.label("period"),
        func.coalesce(func.sum(Sale.total_amount), 0).label("amount"),
        func.count(Sale.id).label("count")
    ).where(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.status == OrderStatus.paid
    )
    if branch_id:
        query = query.where(Sale.branch_id == branch_id)
    query = query.group_by(trunc_expr).order_by(trunc_expr)
    result = await session.execute(query)
    rows = result.fetchall()
    
    data = []
    for r in rows:
        period_dt = r.period
        if not period_dt:
            continue
        if interval == 'day':
            label = period_dt.strftime("%Y-%m-%d")
        elif interval == 'week':
            label = period_dt.strftime("%Y-W%U")
        elif interval == 'month':
            label = period_dt.strftime("%Y-%m")
        elif interval == 'year':
            label = period_dt.strftime("%Y")
        else:
            label = period_dt.isoformat()
        
        data.append({
            "label": label,
            "amount": float(r.amount),
            "count": int(r.count)
        })
    return data


@app.get("/api/v1/sales/reports/analytics")
async def get_sales_analytics(
    start_date: datetime,
    end_date: datetime,
    branch_id: uuid.UUID | None = None,
    session: AsyncSession = Depends(db_manager.get_session)
):
    """Aggregates total sales revenue, order counts, groups data for visualization, and fetches recent sales."""
    if start_date.tzinfo is None:
        start_date = start_date.replace(tzinfo=timezone.utc)
    if end_date.tzinfo is None:
        end_date = end_date.replace(tzinfo=timezone.utc)

    # 1. Total revenue and total orders (Only count paid sales)
    query_totals = select(
        func.coalesce(func.sum(Sale.total_amount), 0).label("total_revenue"),
        func.count(Sale.id).label("total_orders")
    ).where(
        Sale.created_at >= start_date,
        Sale.created_at <= end_date,
        Sale.status == OrderStatus.paid
    )
    if branch_id:
        query_totals = query_totals.where(Sale.branch_id == branch_id)
        
    result_totals = await session.execute(query_totals)
    row_totals = result_totals.fetchone()
    total_revenue = float(row_totals.total_revenue) if row_totals else 0.0
    total_orders = int(row_totals.total_orders) if row_totals else 0

    # 2. Get grouped chart data (run sequentially to avoid concurrent AsyncSession usage)
    daily_data = await get_grouped_data(session, 'day', start_date, end_date, branch_id)
    weekly_data = await get_grouped_data(session, 'week', start_date, end_date, branch_id)
    monthly_data = await get_grouped_data(session, 'month', start_date, end_date, branch_id)
    yearly_data = await get_grouped_data(session, 'year', start_date, end_date, branch_id)

    # 3. Get recent sales (both paid and pending) in the range
    query_sales = select(
        Sale
    ).options(
        selectinload(Sale.items)
    ).where(
        Sale.created_at >= start_date,
        Sale.created_at <= end_date
    )
    if branch_id:
        query_sales = query_sales.where(Sale.branch_id == branch_id)
    query_sales = query_sales.order_by(Sale.created_at.desc()).limit(100)
    
    result_sales = await session.execute(query_sales)
    sales_list = result_sales.scalars().all()

    recent_sales_data = []
    for s in sales_list:
        recent_sales_data.append({
            "id": str(s.id),
            "receipt_number": s.receipt_number,
            "branch_id": str(s.branch_id),
            "customer_name": s.customer_name or "Walk-in Customer",
            "customer_phone": s.customer_phone or "N/A",
            "customer_address": s.customer_address or "N/A",
            "total_amount": float(s.total_amount),
            "discount": float(s.discount),
            "status": "Paid" if s.status == OrderStatus.paid else "Due",
            "created_at": s.created_at.isoformat(),
            "items": [
                {
                    "product_id": str(item.product_id),
                    "quantity": float(item.quantity),
                    "unit_price": float(item.unit_price)
                } for item in s.items
            ]
        })

    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "charts": {
            "daily": daily_data,
            "weekly": weekly_data,
            "monthly": monthly_data,
            "yearly": yearly_data
        },
        "recent_sales": recent_sales_data
    }
