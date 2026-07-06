import csv
import io
import uuid
from collections import defaultdict
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
from src.models import Product, Branch, Category, StockLedger, MovementType, GRN, GRNItem, Supplier, StockTransfer, StockAdjustment, CompanyProfile

# Import all updated schemas
from src.schemas import (
    ProductCreate, ProductResponse, ProductWithStockResponse, 
    BranchCreate, BranchResponse, CategoryCreate, CategoryResponse, 
    StockUpdateEvent, GRNCreate, GRNResponse,
    SupplierCreate, SupplierResponse, SupplierUpdate,
    StockTransferCreate, StockTransferResponse,
    StockAdjustmentCreate, StockAdjustmentResponse,
    ProductUpdate, StockMovementResponse, ConsumptionReportResponse, DeadStockResponse,
    CompanyProfileResponse, CompanyProfileUpdate,
    StockListItemResponse, StockListSummaryResponse
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
        
        # Drop unique index/constraint on supplier name if it exists to allow duplicates dynamically
        try:
            await conn.execute(text("DROP INDEX IF EXISTS inventory.ix_inventory_suppliers_name CASCADE"))
        except Exception as e:
            log.warning(f"Could not drop unique index: {e}")

        # Ensure receiving_date and supplier details columns exist on grn table
        try:
            await conn.execute(text("ALTER TABLE inventory.grn ADD COLUMN IF NOT EXISTS receiving_date DATE NULL"))
            await conn.execute(text("ALTER TABLE inventory.grn ADD COLUMN IF NOT EXISTS supplier_contact VARCHAR(100) NULL"))
            await conn.execute(text("ALTER TABLE inventory.grn ADD COLUMN IF NOT EXISTS supplier_phone VARCHAR(50) NULL"))
            await conn.execute(text("ALTER TABLE inventory.grn ADD COLUMN IF NOT EXISTS supplier_email VARCHAR(100) NULL"))
            await conn.execute(text("ALTER TABLE inventory.grn ADD COLUMN IF NOT EXISTS supplier_address TEXT NULL"))
        except Exception as e:
            log.warning(f"Could not add columns to grn table: {e}")

        # Ensure unit_price and commission columns exist on grn_items table
        try:
            await conn.execute(text("ALTER TABLE inventory.grn_items ADD COLUMN IF NOT EXISTS unit_price DOUBLE PRECISION NULL"))
            await conn.execute(text("ALTER TABLE inventory.grn_items ADD COLUMN IF NOT EXISTS commission DOUBLE PRECISION NULL"))
        except Exception as e:
            log.warning(f"Could not add columns to grn_items table: {e}")

        # Ensure is_active column exists on suppliers table
        try:
            await conn.execute(text("ALTER TABLE inventory.suppliers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL"))
        except Exception as e:
            log.warning(f"Could not add is_active column to suppliers table: {e}")

        # Ensure commission and additional_cost columns exist on products table
        try:
            await conn.execute(text("ALTER TABLE inventory.products ADD COLUMN IF NOT EXISTS commission DOUBLE PRECISION DEFAULT 0.0 NOT NULL"))
            await conn.execute(text("ALTER TABLE inventory.products ADD COLUMN IF NOT EXISTS additional_cost DOUBLE PRECISION DEFAULT 0.0 NOT NULL"))
        except Exception as e:
            log.warning(f"Could not add commission/additional_cost columns to products table: {e}")

        await conn.run_sync(Base.metadata.create_all)

        # Seed default company profile if empty
        try:
            profile_count_res = await conn.execute(text("SELECT COUNT(*) FROM inventory.company_profile"))
            count = profile_count_res.scalar()
            if count == 0:
                await conn.execute(text("""
                    INSERT INTO inventory.company_profile (name, address, phone, email, contact_person) 
                    VALUES ('Manor Furniture', 'Bozlur Mor, Kushita', '01700000000', 'accounts@manorfurniture.com', 'Manager')
                """))
                log.info("Default company profile seeded.")
        except Exception as e:
            log.warning(f"Could not seed default company profile: {e}")

        # Create non-unique index
        try:
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_inventory_suppliers_name ON inventory.suppliers (name)"))
        except Exception as e:
            log.warning(f"Could not create non-unique index: {e}")

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
    except IntegrityError as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e.orig)}")

@app.get("/api/v1/inventory/suppliers", response_model=list[SupplierResponse])
async def get_suppliers(session: AsyncSession = Depends(db_manager.get_session)):
    result = await session.execute(select(Supplier).order_by(Supplier.name.asc()))
    return result.scalars().all()

@app.put("/api/v1/inventory/suppliers/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(supplier_id: uuid.UUID, update_data: SupplierUpdate, session: AsyncSession = Depends(db_manager.get_session)):
    result = await session.execute(select(Supplier).filter(Supplier.id == supplier_id))
    db_supplier = result.scalar_one_or_none()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(db_supplier, key, value)
        
    try:
        await session.commit()
        await session.refresh(db_supplier)
        return db_supplier
    except IntegrityError as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=f"Database error: {str(e.orig)}")


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

@app.put("/api/v1/inventory/categories/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: uuid.UUID, category: CategoryCreate, session: AsyncSession = Depends(db_manager.get_session)):
    cat = await session.get(Category, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    cat.name = category.name
    try:
        await session.commit()
        await session.refresh(cat)
        return cat
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Category name already exists.")

@app.delete("/api/v1/inventory/categories/{category_id}", status_code=204)
async def delete_category(category_id: uuid.UUID, session: AsyncSession = Depends(db_manager.get_session)):
    cat = await session.get(Category, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    # Check if any product uses this category
    result = await session.execute(select(Product).where(Product.category_id == category_id).limit(1))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Cannot delete category: products are assigned to it.")
    await session.delete(cat)
    await session.commit()


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
        supplier_contact=grn_data.supplier_contact,
        supplier_phone=grn_data.supplier_phone,
        supplier_email=grn_data.supplier_email,
        supplier_address=grn_data.supplier_address,
        invoice_reference=grn_data.invoice_reference,
        receiving_date=grn_data.receiving_date,
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
            batch_number=item.batch_number,
            unit_price=item.unit_price,
            commission=item.commission
        )
        session.add(new_item)

        # Retrieve existing stock before writing the new ledger entry
        stock_query = select(func.coalesce(func.sum(StockLedger.quantity_change), 0.0)).where(StockLedger.product_id == item.product_id)
        stock_result = await session.execute(stock_query)
        existing_stock = stock_result.scalar_one()

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
            if item.unit_price is not None:
                product_obj.purchase_cost = item.unit_price
            else:
                product_obj.purchase_cost = item.cost_price
            
            if item.commission is not None:
                product_obj.commission = item.commission

            # Weighted Average Cost (WAC) = (existing stock × old avg cost + new qty × new cost) / (existing stock + new qty)
            old_avg_cost = product_obj.average_cost or 0.0
            new_qty = item.quantity_received
            new_cost = item.cost_price
            if existing_stock + new_qty > 0:
                product_obj.average_cost = ((existing_stock * old_avg_cost) + (new_qty * new_cost)) / (existing_stock + new_qty)
            else:
                product_obj.average_cost = new_cost
            # Update selling price if explicitly provided in the GRN item
            if item.selling_price is not None and item.selling_price > 0:
                product_obj.selling_price = item.selling_price

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


@app.get("/api/v1/inventory/stock-list")
async def get_stock_list(
    supplier_name: str | None = None,
    category_id: uuid.UUID | None = None,
    branch_id: uuid.UUID | None = None,
    stock_status: str | None = None,
    search: str | None = None,
    session: AsyncSession = Depends(db_manager.get_session)
):
    """
    Returns a flat list of stock rows, one per (product, supplier, warehouse) combination.
    Stock quantity is derived from GRN receipts — accurately reflecting which supplier
    provided which stock, per the business rule that a product can come from multiple suppliers.
    """
    # Build query: Join GRNItem → GRN (for supplier) → Product → Category → Branch (warehouse)
    # We compute net quantity = sum of GRN receipts minus stock_ledger outflows per product
    # For supplier-tracing, we use GRN records as the source of truth for which supplier provided stock.

    # First: get all products with their category names
    product_query = (
        select(
            Product.id,
            Product.name,
            Product.sku,
            Product.unit,
            Product.min_stock_level,
            Product.average_cost,
            Product.purchase_cost,
            Product.updated_at,
            Category.name.label("category_name"),
        )
        .outerjoin(Category, Product.category_id == Category.id)
        .where(Product.is_active == True)
    )
    product_result = await session.execute(product_query)
    products_raw = product_result.all()

    if not products_raw:
        return []

    product_map = {row.id: row for row in products_raw}

    # Second: get all GRN items grouped by (product_id, supplier_name, branch_id)
    grn_query = (
        select(
            GRNItem.product_id,
            GRN.supplier_name,
            GRN.branch_id,
            func.sum(GRNItem.quantity_received).label("total_received"),
            func.max(GRN.created_at).label("last_grn_date"),
        )
        .join(GRN, GRNItem.grn_id == GRN.id)
        .group_by(GRNItem.product_id, GRN.supplier_name, GRN.branch_id)
    )
    grn_result = await session.execute(grn_query)
    grn_rows = grn_result.all()

    # Third: get total stock ledger balance per product (for net available qty)
    ledger_query = (
        select(
            StockLedger.product_id,
            StockLedger.branch_id,
            func.coalesce(func.sum(StockLedger.quantity_change), 0).label("net_qty"),
            func.max(StockLedger.created_at).label("last_movement"),
        )
        .group_by(StockLedger.product_id, StockLedger.branch_id)
    )
    ledger_result = await session.execute(ledger_query)
    ledger_rows = ledger_result.all()
    # Build lookup: (product_id, branch_id) -> (net_qty, last_movement)
    ledger_map: dict = {}
    for r in ledger_rows:
        ledger_map[(r.product_id, r.branch_id)] = (r.net_qty, r.last_movement)

    # Fourth: get branch names
    branch_result = await session.execute(select(Branch))
    branch_map = {b.id: b.name for b in branch_result.scalars().all()}

    # Pre-group ledger map by product_id for O(1) lookup
    product_to_branches: dict = defaultdict(set)
    for (pid, bid) in ledger_map:
        product_to_branches[pid].add(bid)

    # Group GRN rows by (product_id, branch_id)
    grn_by_product_branch: dict = defaultdict(list)
    for g in grn_rows:
        grn_by_product_branch[(g.product_id, g.branch_id)].append(g)

    stock_items = []

    for prod_id, prod in product_map.items():
        # O(1) lookup using pre-grouped dict
        product_branches = product_to_branches.get(prod_id, set())

        if not product_branches:
            # Product has never had any stock movement — skip (nothing to show)
            # But show once with zero stock if it has GRN records
            product_grn_branches = {g.branch_id for g in grn_rows if g.product_id == prod_id}
            if not product_grn_branches:
                continue
            product_branches = product_grn_branches

        for br_id in product_branches:
            net_qty, last_movement = ledger_map.get((prod_id, br_id), (0.0, None))
            supplier_grns = grn_by_product_branch.get((prod_id, br_id), [])

            if supplier_grns:
                total_received = sum(g.total_received for g in supplier_grns)
                for g in supplier_grns:
                    # Distribute net stock proportionally to this supplier's receipts
                    if total_received > 0:
                        proportion = g.total_received / total_received
                    else:
                        proportion = 1.0 / len(supplier_grns)
                    supplier_qty = round(net_qty * proportion, 4)
                    supplier_qty = max(0.0, supplier_qty)

                    item_supplier = g.supplier_name
                    item_branch = branch_map.get(br_id, "Unknown Warehouse")
                    item_last = last_movement or g.last_grn_date

                    min_level = prod.min_stock_level or 0.0
                    if supplier_qty <= 0:
                        item_status = "out_of_stock"
                    elif supplier_qty <= min_level:
                        item_status = "low_stock"
                    else:
                        item_status = "available"

                    stock_items.append({
                        "product_id": str(prod_id),
                        "product_name": prod.name,
                        "sku": prod.sku,
                        "category": prod.category_name,
                        "supplier": item_supplier,
                        "available_qty": supplier_qty,
                        "unit": prod.unit,
                        "warehouse": item_branch,
                        "status": item_status,
                        "last_updated": item_last.isoformat() if item_last else None,
                        "min_stock_level": min_level,
                        "average_cost": prod.average_cost or prod.purchase_cost or 0.0,
                    })
            else:
                # No GRN data for this branch — show the ledger quantity with no supplier
                item_branch = branch_map.get(br_id, "Unknown Warehouse")
                available_qty = max(0.0, net_qty)
                min_level = prod.min_stock_level or 0.0
                if available_qty <= 0:
                    item_status = "out_of_stock"
                elif available_qty <= min_level:
                    item_status = "low_stock"
                else:
                    item_status = "available"

                stock_items.append({
                    "product_id": str(prod_id),
                    "product_name": prod.name,
                    "sku": prod.sku,
                    "category": prod.category_name,
                    "supplier": None,
                    "available_qty": available_qty,
                    "unit": prod.unit,
                    "warehouse": item_branch,
                    "status": item_status,
                    "last_updated": last_movement.isoformat() if last_movement else None,
                    "min_stock_level": min_level,
                    "average_cost": prod.average_cost or prod.purchase_cost or 0.0,
                })

    # Apply filters
    if search:
        s = search.lower()
        stock_items = [
            i for i in stock_items
            if s in i["product_name"].lower()
            or s in i["sku"].lower()
            or (i["supplier"] and s in i["supplier"].lower())
        ]
    if supplier_name:
        stock_items = [i for i in stock_items if i.get("supplier") == supplier_name]
    if status_filter := stock_status:
        stock_items = [i for i in stock_items if i["status"] == status_filter]
    if branch_id:
        target_branch_name = branch_map.get(branch_id)
        if target_branch_name:
            stock_items = [i for i in stock_items if i["warehouse"] == target_branch_name]
    if category_id:
        # Filter by category — look up name for this id
        cat_result = await session.get(Category, category_id)
        if cat_result:
            stock_items = [i for i in stock_items if i.get("category") == cat_result.name]

    # Sort: supplier asc, product name asc
    stock_items.sort(key=lambda x: (x.get("supplier") or "", x["product_name"]))

    return stock_items


@app.get("/api/v1/inventory/stock-list/summary")
async def get_stock_list_summary(session: AsyncSession = Depends(db_manager.get_session)):
    """
    Returns KPI summary numbers for the Stock List tab.
    Uses a single aggregated SQL query instead of per-product loops (avoids N+1).
    """
    # Single query: count active products and sum ledger stock
    products_result = await session.execute(
        select(
            Product.id,
            Product.min_stock_level,
            Product.average_cost,
            Product.purchase_cost,
        ).where(Product.is_active == True)
    )
    products_all = products_result.all()
    total_products = len(products_all)

    if total_products == 0:
        return {"total_products": 0, "stock_value": 0.0, "low_and_out_of_stock_count": 0}

    # Aggregate net stock per product in one query
    ledger_agg = await session.execute(
        select(
            StockLedger.product_id,
            func.coalesce(func.sum(StockLedger.quantity_change), 0).label("net_qty")
        ).group_by(StockLedger.product_id)
    )
    stock_by_product = {r.product_id: r.net_qty for r in ledger_agg.all()}

    stock_value = 0.0
    low_and_out_count = 0

    for p in products_all:
        current_stock = stock_by_product.get(p.id, 0.0)
        cost = p.average_cost if p.average_cost and p.average_cost > 0 else (p.purchase_cost or 0.0)
        stock_value += max(0.0, current_stock) * cost
        min_level = p.min_stock_level or 0.0
        if current_stock <= min_level:
            low_and_out_count += 1

    return {
        "total_products": total_products,
        "stock_value": round(stock_value, 2),
        "low_and_out_of_stock_count": low_and_out_count,
    }


@app.get("/api/v1/inventory/company-profile", response_model=CompanyProfileResponse)
async def get_company_profile(session: AsyncSession = Depends(db_manager.get_session)):
    result = await session.execute(select(CompanyProfile).order_by(CompanyProfile.id.asc()))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Company profile not found")
    return profile


@app.put("/api/v1/inventory/company-profile", response_model=CompanyProfileResponse)
async def update_company_profile(profile_data: CompanyProfileUpdate, session: AsyncSession = Depends(db_manager.get_session)):
    result = await session.execute(select(CompanyProfile).order_by(CompanyProfile.id.asc()))
    profile = result.scalars().first()
    if not profile:
        profile = CompanyProfile()
        session.add(profile)
    
    profile.name = profile_data.name
    profile.address = profile_data.address
    profile.phone = profile_data.phone
    profile.email = profile_data.email
    profile.contact_person = profile_data.contact_person
    
    await session.commit()
    await session.refresh(profile)
    return profile