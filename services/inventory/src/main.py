import os
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func
from sqlalchemy.exc import IntegrityError

from shared.python.core import DatabaseManager, MessagingManager, log, Base
from src.models import Product
from src.schemas import ProductCreate, ProductResponse, StockUpdateEvent
from src.config import settings

# Initialize Shared Managers using our centralized settings!
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
    version="1.1.0",
    lifespan=lifespan,
    docs_url="/api/v1/inventory/docs",
    openapi_url="/api/v1/inventory/openapi.json"
)

# --- BRANCH ENDPOINTS ---
@app.post("/api/v1/inventory/branches", response_model=BranchResponse, status_code=201)
async def create_branch(branch: BranchCreate, session: AsyncSession = Depends(db_manager.get_session)):
    new_branch = Branch(**branch.model_dump())
    session.add(new_branch)
    await session.commit()
    await session.refresh(new_branch)
    return new_branch

@app.get("/api/v1/inventory/branches", response_model=list[BranchResponse])
async def get_branches(session: AsyncSession = Depends(db_manager.get_session)):
    result = await session.execute(select(Branch))
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

# --- PRODUCT & LEDGER ENDPOINTS ---
@app.post("/api/v1/inventory/products", response_model=ProductResponse, status_code=201)
async def create_product(product: ProductCreate, session: AsyncSession = Depends(db_manager.get_session)):
    # Separate the product master data from the virtual ledger data
    product_data = product.model_dump(exclude={"initial_stock_quantity", "branch_id"})
    new_product = Product(**product_data)
    session.add(new_product)
    
    try:
        await session.flush() # Secure the Product ID without full commit
        
        # If they provided an initial stock amount, insert it cleanly into the ledger!
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
        
        # Publish event if stock was adjusted
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
        raise HTTPException(status_code=400, detail="SKU or Barcode already exists, or Branch/Category ID is invalid.")
    except Exception as e:
        await session.rollback()
        log.error(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/v1/inventory/products", response_model=list[ProductWithStockResponse])
async def get_products(branch_id: uuid.UUID | None = None, session: AsyncSession = Depends(db_manager.get_session)):
    # 1. Fetch all products
    query = select(Product)
    result = await session.execute(query)
    products = result.scalars().all()
    
    response_list = []
    for p in products:
        # 2. Dynamically calculate stock on the fly directly from the ledger
        stock_query = select(func.coalesce(func.sum(StockLedger.quantity_change), 0)).where(StockLedger.product_id == p.id)
        if branch_id:
            stock_query = stock_query.where(StockLedger.branch_id == branch_id)
            
        stock_result = await session.execute(stock_query)
        current_stock = stock_result.scalar_one()
        
        # 3. Construct response
        p_dict = p.__dict__.copy()
        p_dict["current_stock"] = current_stock
        response_list.append(ProductWithStockResponse(**p_dict))
        
    return response_list