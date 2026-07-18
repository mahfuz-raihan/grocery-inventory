import urllib.request, json

print("=== STOCK LIST (Inventory) ===")
stock_list = json.loads(urllib.request.urlopen("http://localhost/api/v1/inventory/stock-list").read())
for r in stock_list[:20]:
    print(f"  {r['product_name'][:30]:30} | supplier={str(r['supplier'] or 'NULL'):20} | qty={r['available_qty']}")

print()
print("=== POS PRODUCTS (supplier_wise, no branch filter) ===")
pos_products = json.loads(urllib.request.urlopen("http://localhost/api/v1/inventory/products?supplier_wise=true").read())
for p in pos_products[:20]:
    print(f"  {p['name'][:30]:30} | supplier={str(p.get('supplier_name') or 'NULL'):20} | stock={p['current_stock']}")

print()
print("=== DIFF: Products where counts don't match ===")
# Build lookup from stock list: product_name + supplier -> qty
sl_map = {}
for r in stock_list:
    key = (r['product_name'], r['supplier'])
    sl_map[key] = r['available_qty']

pos_map = {}
for p in pos_products:
    key = (p['name'], p.get('supplier_name'))
    pos_map[key] = p['current_stock']

all_keys = set(sl_map) | set(pos_map)
for k in sorted(all_keys):
    sl_qty = sl_map.get(k, "MISSING")
    pos_qty = pos_map.get(k, "MISSING")
    if sl_qty != pos_qty:
        print(f"  MISMATCH: {k[0][:30]:30} / {str(k[1] or 'NULL'):20}  stock_list={sl_qty}  pos={pos_qty}")
