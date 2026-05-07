import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError

from shared.python.core import DatabaseManager, MessagingManager, log, Base
from src.models import Product
from src.schemas import ProductCreate, ProductResponse, StockUpdateEvent

# Configuration from Environment Variables (injected by Docker)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://admin:password_change_me@postgres:5432/erp_master")
NATS_URL = os.getenv("NATS_URL", "nats://nats:4222")

# Initialize Shared Managers
db_manager = DatabaseManager(DATABASE_URL)
msg_manager = MessagingManager([NATS_URL])

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting Inventory Service...")
    
    # 1. Ensure the DB schema exists, then create tables
    async with db_manager.engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS inventory"))
        await conn.run_sync(Base.metadata.create_all)
        log.info("Database schema and tables initialized.")
        
    # 2. Connect to NATS message broker
    await msg_manager.connect()
    
    yield
    
    # Shutdown gracefully
    log.info("Shutting down Inventory Service...")
    await msg_manager.close()
    await db_manager.engine.dispose()

app = FastAPI(
    title="Grocery ERP - Inventory Service", 
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/v1/inventory/docs",
    openapi_url="/api/v1/inventory/openapi.json"
)

@app.post("/api/v1/inventory/products", response_model=ProductResponse, status_code=201)
async def create_product(product: ProductCreate, session: AsyncSession = Depends(db_manager.get_session)):
    new_product = Product(**product.model_dump())
    session.add(new_product)
    
    try:
        await session.commit()
        await session.refresh(new_product)
        
        # Publish an event to NATS
        event = StockUpdateEvent(
            sku=new_product.sku, 
            quantity_change=new_product.stock_quantity, 
            reason="initial_stock_creation"
        )
        await msg_manager.publish("inventory.product.created", event)
        
        return new_product
    except IntegrityError:
        await session.rollback()
        log.error(f"Duplicate SKU attempted: {product.sku}")
        raise HTTPException(status_code=400, detail="A product with this SKU already exists.")
    except Exception as e:
        await session.rollback()
        log.error(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/v1/inventory/products", response_model=list[ProductResponse])
async def get_products(session: AsyncSession = Depends(db_manager.get_session)):
    result = await session.execute(select(Product))
    return result.scalars().all()