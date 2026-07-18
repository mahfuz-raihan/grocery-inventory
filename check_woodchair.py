import urllib.request, json

d = json.loads(urllib.request.urlopen("http://localhost/api/v1/inventory/stock-list").read())
wc = [r for r in d if r['product_name'] == 'Wood Chair' and r['supplier'] == 'Toshiba']
print("Stock list Wood Chair / Toshiba:")
for r in wc:
    print(f"  warehouse={r['warehouse']}  qty={r['available_qty']}")
total = sum(r['available_qty'] for r in wc)
print(f"  TOTAL across all warehouses = {total}")
print()
print("POS shows: 4230 = 4000 + 230 = the sum of all warehouses for Toshiba/Wood Chair")
