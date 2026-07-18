import urllib.request, json
d = json.loads(urllib.request.urlopen("http://localhost/api/v1/inventory/branches").read())
for b in d:
    print(f"id={b['id']}  name={b['name']}")
