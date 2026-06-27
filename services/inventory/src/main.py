import csv
import io
import uuid
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError

from shared.python.core import DatabaseManager, MessagingManager, log, Base

# Import all updated models
from src.models import Product, Branch, Category, StockLedger, MovementType, GRN, GRNItem, Supplier, StockTransfer, StockAdjustment

# Import all updated schemas
from src.schemas import (
    ProductCreate, ProductResponse, ProductWithStockResponse, 
    BranchCreate, BranchResponse, CategoryCreate, CategoryResponse, 
    StockUpdateEvent, GRNCreate, GRNResponse,
    SupplierCreate, SupplierResponse,
    StockTransferCreate, StockTransferResponse,
    StockAdjustmentCreate, StockAdjustmentResponse,
    ProductUpdate, StockMovementResponse, ConsumptionReportResponse, DeadStockResponse
)
from src.config import settings

# Initialize managers
db_manager = DatabaseManager(settings.database_url)
msg_manager = MessagingManager([settings.nats_url])

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting Inventory Service...")
    async with db_manager.engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS inventory"))
        await conn.run_sync(Base.metadata.create_all)
        log.info("Database schema (Stock Ledger) initialized successfully.")
        
    await msg_manager.connect()
    yield
    await msg_manager.close()
    await db_manager.engine.dispose()

app = FastAPI(
    title="Grocery ERP - Inventory Service", 
    version="1.2.0",
    lifespan=lifespan,
    docs_url="/api/v1/inventory/docs",
    openapi_url="/api/v1/inventory/openapi.json"
)

# --- SUPPLIER ENDPOINTS ---
@app.post("/api/v1/inventory/suppliers", response_model=SupplierResponse, status_code=201)
async def create_supplier(supplier: SupplierCreate, session: AsyncSession = Depends(db_manager.get_session)):
    new_supplier = Supplier(**supplier.model_dump())
    session.add(new_supplier)
    try:
        await session.commit()
        await session.refresh(new_supplier)
        return new_supplier
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Supplier name already exists.")

@app.get("/api/v1/inventory/suppliers", response_model=list[SupplierResponse])
async def get_suppliers(session: AsyncSession = Depends(db_manager.get_session)):
    result = await session.execute(select(Supplier).order_by(Supplier.name.asc()))
    return result.scalars().all()


# --- BRANCH/WAREHOUSE ENDPOINTS ---
@app.post("/api/v1/inventory/branches", response_model=BranchResponse, status_code=201)
async def create_branch(branch: BranchCreate, session: AsyncSession = Depends(db_manager.get_session)):
    new_branch = Branch(**branch.model_dump())
    session.add(new_branch)
    await session.commit()
    await session.refresh(new_branch)
    return new_branch

@app.get("/api/v1/inventory/branches", response_model=list[BranchResponse])
async def get_branches(session: AsyncSession = Depends(db_manager.get_session)):
    result = await session.execute(select(Branch).order_by(Branch.name.asc()))
    return result.scalars().all()


# --- CATEGORY ENDPOINTS ---
@app.post("/api/v1/inventory/categories", response_model=CategoryResponse, status_code=201)
async def create_category(category: CategoryCreate, session: AsyncSession = Depends(db_manager.get_session)):
    new_category = Category(**category.model_dump())
    session.add(new_category)
    try:
        await session.commit()
        await session.refresh(new_category)
        return new_category
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Category already exists.")

@app.get("/api/v1/inventory/categories", response_model=list[CategoryResponse])
async def get_categories(session: AsyncSession = Depends(db_manager.get_session)):
    result = await session.execute(select(Category).order_by(Category.name.asc()))
    return result.scalars().all()


# --- PRODUCT & VARIANT ENDPOINTS ---
@app.post("/api/v1/inventory/products", response_model=ProductResponse, status_code=201)
async def create_product(product: ProductCreate, session: AsyncSession = Depends(db_manager.get_session)):
    product_data = product.model_dump(exclude={"initial_stock_quantity", "branch_id"})
    
    # If parent_id is set, verify it exists
    if product.parent_id:
        parent_exists = await session.get(Product, product.parent_id)
        if not parent_exists:
            raise HTTPException(status_code=400, detail="Parent product ID does not exist.")
            
    new_product = Product(**product_data)
    session.add(new_product)
    
    try:
        await session.flush()
        
        # Insert initial stock if provided
        if product.initial_stock_quantity > 0 and product.branch_id:
            ledger_entry = StockLedger(
                branch_id=product.branch_id,
                product_id=new_product.id,
                quantity_change=product.initial_stock_quantity,
                movement_type=MovementType.adjustment
            )
            session.add(ledger_entry)

        await session.commit()
        await session.refresh(new_product)
        
        if product.initial_stock_quantity > 0 and product.branch_id:
            event = StockUpdateEvent(
                product_id=new_product.id,
                branch_id=product.branch_id,
                quantity_change=product.initial_stock_quantity,
                movement_type="adjustment"
            )
            await msg_manager.publish("inventory.stock.updated", event)
            
        return new_product
        
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="SKU or Barcode already exists, or Branch/Category/Supplier ID is invalid.")
    except Exception as e:
        await session.rollback()
        log.error(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/v1/inventory/products", response_model=list[ProductWithStockResponse])
async def get_products(branch_id: uuid.UUID | None = None, session: AsyncSession = Depends(db_manager.get_session)):
    # Fetch template/simple products (where parent_id is None)
    query = select(Product).where(Product.parent_id == None).options(selectinload(Product.variants))
    result = await session.execute(query)
    products = result.scalars().all()
    
    response_list = []
    for p in products:
        stock_query = select(func.coalesce(func.sum(StockLedger.quantity_change), 0)).where(StockLedger.product_id == p.id)
        if branch_id:
            stock_query = stock_query.where(StockLedger.branch_id == branch_id)
            
        stock_result = await session.execute(stock_query)
        current_stock = stock_result.scalar_one()
        
        # Formulate variant sub-list with computed stocks
        variant_responses = []
        for variant in p.variants:
            v_stock_query = select(func.coalesce(func.sum(StockLedger.quantity_change), 0)).where(StockLedger.product_id == variant.id)
            if branch_id:
                v_stock_query = v_stock_query.where(StockLedger.branch_id == branch_id)
            v_stock_result = await session.execute(v_stock_query)
            
            # Create dict copying properties of variant
            v_dict = variant.__dict__.copy()
            variant_responses.append(v_dict)
            
        p_dict = p.__dict__.copy()
        p_dict["current_stock"] = current_stock
        p_dict["variants"] = variant_responses
        
        response_list.append(ProductWithStockResponse(**p_dict))
        
    return response_list

@app.get("/api/v1/inventory/products/{product_id}")
async def get_product_detail(product_id: uuid.UUID, session: AsyncSession = Depends(db_manager.get_session)):
    product_result = await session.execute(
        select(Product)
        .options(selectinload(Product.variants))
        .where(Product.id == product_id)
    )
    product = product_result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Get overall stock
    stock_query = select(func.coalesce(func.sum(StockLedger.quantity_change), 0)).where(StockLedger.product_id == product_id)
    stock_result = await session.execute(stock_query)
    current_stock = stock_result.scalar_one()
    
    # Get stock breakdown by warehouse
    warehouse_stock = []
    branches_result = await session.execute(select(Branch))
    branches = branches_result.scalars().all()
    for b in branches:
        b_stock_query = select(func.coalesce(func.sum(StockLedger.quantity_change), 0)).where(
            StockLedger.product_id == product_id,
            StockLedger.branch_id == b.id
        )
        b_stock_result = await session.execute(b_stock_query)
        b_stock = b_stock_result.scalar_one()
        warehouse_stock.append({
            "branch_id": str(b.id),
            "branch_name": b.name,
            "branch_type": b.branch_type,
            "stock": b_stock
        })
        
    # Get transactions log
    tx_query = select(StockLedger).where(StockLedger.product_id == product_id).order_by(StockLedger.created_at.desc()).limit(50)
    tx_result = await session.execute(tx_query)
    transactions = tx_result.scalars().all()
    tx_log = []
    for tx in transactions:
        tx_log.append({
            "id": str(tx.id),
            "branch_id": str(tx.branch_id),
            "quantity_change": tx.quantity_change,
            "movement_type": tx.movement_type,
            "created_at": tx.created_at.isoformat()
        })
        
    return {
        "product": product,
        "current_stock": current_stock,
        "warehouse_stock": warehouse_stock,
        "transactions": tx_log,
        "variants": product.variants
    }


@app.put("/api/v1/inventory/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    product_update: ProductUpdate,
    session: AsyncSession = Depends(db_manager.get_session)
):
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    update_data = product_update.model_dump(exclude_unset=True)
    
    # If parent_id is being updated, verify it exists and is not self
    if "parent_id" in update_data and update_data["parent_id"]:
        if update_data["parent_id"] == product_id:
            raise HTTPException(status_code=400, detail="A product cannot be its own parent.")
        parent_exists = await session.get(Product, update_data["parent_id"])
        if not parent_exists:
            raise HTTPException(status_code=400, detail="Parent product ID does not exist.")
            
    for key, value in update_data.items():
        setattr(product, key, value)
        
    try:
        await session.commit()
        await session.refresh(product)
        return product
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="SKU or Barcode already exists, or foreign key constraint failed.")
    except Exception as e:
        await session.rollback()
        log.error(f"Error updating product: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# --- TRANSFERS ENDPOINTS ---
@app.post("/api/v1/inventory/transfers", response_model=StockTransferResponse, status_code=201)
async def create_transfer(transfer: StockTransferCreate, session: AsyncSession = Depends(db_manager.get_session)):
    # 1. Validate quantity availability at source branch
    stock_query = select(func.coalesce(func.sum(StockLedger.quantity_change), 0)).where(
        StockLedger.product_id == transfer.product_id,
        StockLedger.branch_id == transfer.from_branch_id
    )
    stock_result = await session.execute(stock_query)
    available_stock = stock_result.scalar_one()
    if available_stock < transfer.quantity:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient stock at origin warehouse. Available: {available_stock}, Requested: {transfer.quantity}"
        )
        
    # 2. Record transfer log
    new_transfer = StockTransfer(
        product_id=transfer.product_id,
        from_branch_id=transfer.from_branch_id,
        to_branch_id=transfer.to_branch_id,
        quantity=transfer.quantity,
        reference=transfer.reference,
        status="completed"
    )
    session.add(new_transfer)
    
    # 3. Create negative stock ledger entry for origin
    origin_ledger = StockLedger(
        branch_id=transfer.from_branch_id,
        product_id=transfer.product_id,
        quantity_change=-transfer.quantity,
        movement_type=MovementType.stock_transfer
    )
    # 4. Create positive stock ledger entry for destination
    dest_ledger = StockLedger(
        branch_id=transfer.to_branch_id,
        product_id=transfer.product_id,
        quantity_change=transfer.quantity,
        movement_type=MovementType.stock_transfer
    )
    session.add(origin_ledger)
    session.add(dest_ledger)
    
    await session.commit()
    await session.refresh(new_transfer)
    
    # 5. Publish NATS sync events
    event_out = StockUpdateEvent(
        product_id=transfer.product_id,
        branch_id=transfer.from_branch_id,
        quantity_change=-transfer.quantity,
        movement_type="transfer"
    )
    event_in = StockUpdateEvent(
        product_id=transfer.product_id,
        branch_id=transfer.to_branch_id,
        quantity_change=transfer.quantity,
        movement_type="transfer"
    )
    await msg_manager.publish("inventory.stock.updated", event_out)
    await msg_manager.publish("inventory.stock.updated", event_in)
    
    return new_transfer

@app.get("/api/v1/inventory/transfers", response_model=list[StockTransferResponse])
async def get_transfers(session: AsyncSession = Depends(db_manager.get_session)):
    result = await session.execute(select(StockTransfer).order_by(StockTransfer.created_at.desc()))
    return result.scalars().all()


# --- ADJUSTMENTS ENDPOINTS ---
@app.post("/api/v1/inventory/adjustments", response_model=StockAdjustmentResponse, status_code=201)
async def create_adjustment(adj: StockAdjustmentCreate, session: AsyncSession = Depends(db_manager.get_session)):
    new_adj = StockAdjustment(
        product_id=adj.product_id,
        branch_id=adj.branch_id,
        current_quantity=adj.current_quantity,
        adjusted_quantity=adj.adjusted_quantity,
        reason=adj.reason,
        notes=adj.notes,
        approved_by=adj.approved_by
    )
    session.add(new_adj)
    
    ledger_entry = StockLedger(
        branch_id=adj.branch_id,
        product_id=adj.product_id,
        quantity_change=adj.adjusted_quantity,
        movement_type=MovementType.adjustment
    )
    session.add(ledger_entry)
    
    await session.commit()
    await session.refresh(new_adj)
    
    event = StockUpdateEvent(
        product_id=adj.product_id,
        branch_id=adj.branch_id,
        quantity_change=adj.adjusted_quantity,
        movement_type="adjustment"
    )
    await msg_manager.publish("inventory.stock.updated", event)
    
    return new_adj

@app.get("/api/v1/inventory/adjustments", response_model=list[StockAdjustmentResponse])
async def get_adjustments(session: AsyncSession = Depends(db_manager.get_session)):
    result = await session.execute(select(StockAdjustment).order_by(StockAdjustment.created_at.desc()))
    return result.scalars().all()


# --- GRN (GOODS RECEIPT NOTE) ENDPOINTS ---
@app.post("/api/v1/inventory/grn", response_model=GRNResponse, status_code=201)
async def create_grn(grn_data: GRNCreate, session: AsyncSession = Depends(db_manager.get_session)):
    total_amount = sum(item.quantity_received * item.cost_price for item in grn_data.items)

    new_grn = GRN(
        branch_id=grn_data.branch_id,
        supplier_name=grn_data.supplier_name,
        invoice_reference=grn_data.invoice_reference,
        total_amount=total_amount,
        status="completed"
    )
    session.add(new_grn)
    await session.flush()

    for item in grn_data.items:
        new_item = GRNItem(
            grn_id=new_grn.id,
            product_id=item.product_id,
            quantity_received=item.quantity_received,
            cost_price=item.cost_price,
            subtotal=item.quantity_received * item.cost_price,
            ordered_quantity=item.ordered_quantity,
            damaged_quantity=item.damaged_quantity,
            batch_number=item.batch_number
        )
        session.add(new_item)

        ledger_entry = StockLedger(
            branch_id=grn_data.branch_id,
            product_id=item.product_id,
            quantity_change=item.quantity_received,
            movement_type=MovementType.purchase_receive
        )
        session.add(ledger_entry)

        # Update average/purchase costs on the product template/variant directly
        product_obj = await session.get(Product, item.product_id)
        if product_obj:
            product_obj.purchase_cost = item.cost_price
            # Simplified average cost calculation
            product_obj.average_cost = (product_obj.average_cost + item.cost_price) / 2 if product_obj.average_cost > 0 else item.cost_price

        event = StockUpdateEvent(
            product_id=item.product_id,
            branch_id=grn_data.branch_id,
            quantity_change=item.quantity_received,
            movement_type="purchase_receive"
        )
        await msg_manager.publish("inventory.stock.updated", event)

    await session.commit()

    result = await session.execute(
        select(GRN)
        .options(selectinload(GRN.items))
        .where(GRN.id == new_grn.id)
    )
    final_grn = result.scalar_one()
    return final_grn


@app.get("/api/v1/inventory/grn", response_model=list[GRNResponse])
async def get_grns(session: AsyncSession = Depends(db_manager.get_session)):
    result = await session.execute(
        select(GRN)
        .options(selectinload(GRN.items))
        .order_by(GRN.created_at.desc())
    )
    return result.scalars().all()


# --- REPORTS ENDPOINTS ---
@app.get("/api/v1/inventory/reports/valuation")
async def get_valuation_report(session: AsyncSession = Depends(db_manager.get_session)):
    result = await session.execute(select(Product))
    products = result.scalars().all()
    
    valuation_details = []
    total_valuation = 0.0
    total_items = 0
    
    for p in products:
        stock_query = select(func.coalesce(func.sum(StockLedger.quantity_change), 0)).where(StockLedger.product_id == p.id)
        stock_result = await session.execute(stock_query)
        current_stock = stock_result.scalar_one()
        
        cost = p.purchase_cost if p.purchase_cost > 0 else (p.selling_price * 0.7)
        product_value = current_stock * cost
        
        if current_stock > 0 or p.purchase_cost > 0:
            valuation_details.append({
                "product_id": str(p.id),
                "sku": p.sku,
                "name": p.name,
                "product_type": p.product_type,
                "current_stock": current_stock,
                "unit_cost": cost,
                "total_value": product_value
            })
            total_valuation += product_value
            total_items += current_stock
            
    return {
        "total_valuation": total_valuation,
        "total_items": total_items,
        "valuation_details": valuation_details
    }

@app.get("/api/v1/inventory/reports/low-stock")
async def get_low_stock_report(session: AsyncSession = Depends(db_manager.get_session)):
    result = await session.execute(select(Product))
    products = result.scalars().all()
    
    low_stock_list = []
    for p in products:
        stock_query = select(func.coalesce(func.sum(StockLedger.quantity_change), 0)).where(StockLedger.product_id == p.id)
        stock_result = await session.execute(stock_query)
        current_stock = stock_result.scalar_one()
        
        min_limit = p.min_stock_level if p.min_stock_level > 0 else 5.0
        
        if current_stock <= min_limit:
            low_stock_list.append({
                "product_id": str(p.id),
                "sku": p.sku,
                "name": p.name,
                "product_type": p.product_type,
                "current_stock": current_stock,
                "min_stock_level": min_limit,
                "reorder_quantity": p.reorder_quantity if p.reorder_quantity > 0 else 10.0
            })
            
    return low_stock_list


@app.get("/api/v1/inventory/reports/movement", response_model=list[StockMovementResponse])
async def get_movement_report(
    branch_id: uuid.UUID | None = None,
    product_id: uuid.UUID | None = None,
    movement_type: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession = Depends(db_manager.get_session)
):
    query = (
        select(
            StockLedger.id,
            StockLedger.branch_id,
            Branch.name.label("branch_name"),
            StockLedger.product_id,
            Product.sku.label("product_sku"),
            Product.name.label("product_name"),
            StockLedger.quantity_change,
            StockLedger.movement_type,
            StockLedger.created_at
        )
        .join(Branch, StockLedger.branch_id == Branch.id)
        .join(Product, StockLedger.product_id == Product.id)
    )
    
    if branch_id:
        query = query.where(StockLedger.branch_id == branch_id)
    if product_id:
        query = query.where(StockLedger.product_id == product_id)
    if movement_type:
        query = query.where(StockLedger.movement_type == movement_type)
    if start_date:
        query = query.where(StockLedger.created_at >= start_date)
    if end_date:
        query = query.where(StockLedger.created_at <= end_date)
        
    query = query.order_by(StockLedger.created_at.desc()).limit(limit).offset(offset)
    result = await session.execute(query)
    
    movements = []
    for r in result.all():
        movements.append({
            "id": r.id,
            "branch_id": r.branch_id,
            "branch_name": r.branch_name,
            "product_id": r.product_id,
            "product_sku": r.product_sku,
            "product_name": r.product_name,
            "quantity_change": r.quantity_change,
            "movement_type": r.movement_type.value if hasattr(r.movement_type, 'value') else str(r.movement_type),
            "created_at": r.created_at
        })
    return movements


@app.get("/api/v1/inventory/reports/consumption", response_model=list[ConsumptionReportResponse])
async def get_consumption_report(
    branch_id: uuid.UUID | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    session: AsyncSession = Depends(db_manager.get_session)
):
    query = (
        select(
            StockLedger.product_id,
            Product.sku,
            Product.name,
            Product.unit,
            func.sum(StockLedger.quantity_change).label("total_change")
        )
        .join(Product, StockLedger.product_id == Product.id)
        .where(StockLedger.movement_type == MovementType.production_consumption)
    )
    
    if branch_id:
        query = query.where(StockLedger.branch_id == branch_id)
    if start_date:
        query = query.where(StockLedger.created_at >= start_date)
    if end_date:
        query = query.where(StockLedger.created_at <= end_date)
        
    query = query.group_by(StockLedger.product_id, Product.sku, Product.name, Product.unit)
    result = await session.execute(query)
    
    consumption_list = []
    for r in result.all():
        consumption_list.append({
            "product_id": r.product_id,
            "sku": r.sku,
            "name": r.name,
            "total_consumed": abs(r.total_change),
            "unit": r.unit
        })
    return consumption_list


@app.get("/api/v1/inventory/reports/dead-stock", response_model=list[DeadStockResponse])
async def get_dead_stock_report(
    days: int = 30,
    branch_id: uuid.UUID | None = None,
    session: AsyncSession = Depends(db_manager.get_session)
):
    from datetime import timedelta, timezone
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    result = await session.execute(select(Product))
    products = result.scalars().all()
    
    dead_stock_list = []
    for p in products:
        stock_query = select(func.coalesce(func.sum(StockLedger.quantity_change), 0)).where(StockLedger.product_id == p.id)
        if branch_id:
            stock_query = stock_query.where(StockLedger.branch_id == branch_id)
        stock_res = await session.execute(stock_query)
        current_stock = stock_res.scalar_one()
        
        if current_stock <= 0:
            continue
            
        last_mv_query = select(StockLedger.created_at).where(StockLedger.product_id == p.id)
        if branch_id:
            last_mv_query = last_mv_query.where(StockLedger.branch_id == branch_id)
        last_mv_query = last_mv_query.order_by(StockLedger.created_at.desc()).limit(1)
        last_mv_res = await session.execute(last_mv_query)
        last_mv_date = last_mv_res.scalar_one_or_none()
        
        # Make timezone-aware comparison if last_mv_date is timezone-naive
        if last_mv_date is not None:
            if last_mv_date.tzinfo is None:
                last_mv_date = last_mv_date.replace(tzinfo=timezone.utc)
            
        if last_mv_date is None or last_mv_date < cutoff_date:
            dead_stock_list.append({
                "product_id": p.id,
                "sku": p.sku,
                "name": p.name,
                "current_stock": current_stock,
                "last_movement_date": last_mv_date
            })
            
    return dead_stock_list


# --- CSV BULK IMPORT / EXPORT ENDPOINTS ---
@app.get("/api/v1/inventory/products/export-csv")
async def export_products_csv(session: AsyncSession = Depends(db_manager.get_session)):
    result = await session.execute(select(Product))
    products = result.scalars().all()

    def iter_csv():
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["sku", "barcode", "name", "unit", "selling_price", "is_active"])
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)

        for p in products:
            writer.writerow([p.sku, p.barcode, p.name, p.unit, p.selling_price, p.is_active])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

    response = StreamingResponse(iter_csv(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=products_export.csv"
    return response

@app.post("/api/v1/inventory/products/import-csv")
async def import_products_csv(file: UploadFile = File(...), session: AsyncSession = Depends(db_manager.get_session)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Uploaded file must be a .csv")

    contents = await file.read()
    decoded = contents.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))

    imported_count = 0
    errors = []

    for row_num, row in enumerate(reader, start=2):
        try:
            product_data = {
                "sku": row.get("sku", "").strip(),
                "barcode": row.get("barcode", "").strip() or None,
                "name": row.get("name", "").strip(),
                "unit": row.get("unit", "").strip(),
                "selling_price": float(row.get("selling_price", 0)),
                "is_active": str(row.get("is_active", "True")).strip().lower() == "true"
            }
            p_create = ProductCreate(**product_data)
            new_product = Product(**p_create.model_dump(exclude={"initial_stock_quantity", "branch_id"}))
            session.add(new_product)
            await session.flush() 
            imported_count += 1
        except Exception as e:
            await session.rollback()
            errors.append(f"Error on row {row_num}: {str(e)}")
            continue

    if errors:
        await session.rollback()
        raise HTTPException(status_code=400, detail={"message": "Import failed due to data errors", "errors": errors})

    await session.commit()
    return {"message": f"Successfully imported {imported_count} products!"}