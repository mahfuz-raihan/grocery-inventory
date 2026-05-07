# grocery-inventory
Grocery inventory apps


## Grocery ERP - Micro-modular Foundation

This monorepo is designed for a scalable, event-driven grocery management system.

## Directory Structure
```
/grocery-erp
├── services/
│   ├── auth/                # Identity & Access Management
│   │   ├── src/
│   │   ├── tests/
│   │   └── Dockerfile
│   ├── inventory/           # Product, Stock & Warehouse Management
│   │   ├── src/
│   │   ├── tests/
│   │   └── Dockerfile
│   └── sales/               # Orders, Transactions & POS Integration
│       ├── src/
│       ├── tests/
│       └── Dockerfile
├── shared/
│   └── python/              # Shared core library (DB, NATS, Logging)
│       ├── core/
│       │   ├── database.py
│       │   ├── messaging.py
│       │   └── logger.py
│       └── setup.py
├── frontend/                # Next.js App Router Web Interface
│   ├── app/
│   ├── components/
│   └── public/
├── deployments/             # Infrastructure & Config
│   └── traefik/
│       └── traefik.yml
├── docker-compose.yml
└── .env.example
```

### Core Design Principles

- **Schema Isolation**: Each service owns its database schema. Inventory cannot directly query the Sales database.
- **Event-Driven**: All state changes (e.g., StockReduced) are published to NATS.
- **Unified Entry**: Traefik handles routing, SSL termination, and load balancing.
- **Shared Logic**: The /shared folder contains versioned utilities to ensure consistency across services.