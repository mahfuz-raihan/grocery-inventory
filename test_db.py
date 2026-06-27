# test_db.py
# Quick sanity check — run this to confirm models load without ImportError.
# Usage: python test_db.py  (from the project root)

from services.inventory.src.models import Product, Category, Branch, StockLedger
from services.auth.src.models import User
from services.sales.src.models import Sale, SaleItem

print("✅ All models loaded successfully!")
# If this script runs without an ImportError or SyntaxError,
# the database models are correctly configured.