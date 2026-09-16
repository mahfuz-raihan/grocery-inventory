# Enterprise Retail & Inventory ERP

A modern, cloud-ready Enterprise Resource Planning (ERP) and Point of Sale (POS) system designed for retail, wholesale, and multi-warehouse distribution businesses.

Built with a high-performance modular frontend and decoupled microservices, the system streamlines stock control, sales transactions, customer relationships, and financial reporting in a unified interface.

---

## Key Features

### Point of Sale (POS)
- **Fast Cashier Checkout**: High-speed item search, barcode scanning, and instant cart calculations.
- **Sequential Invoicing**: Automated, date-based invoice identification (`INV-SOLD-YYYYMMDD-xxx`).
- **Flexible Payments**: Support for cash, card, and customer credit/due settlements.
- **A4 Compact Invoice Generation**: One-click preview, print, and PDF export formatted for standard A4 paper.

### Inventory & Warehouse Management
- **Multi-Warehouse Support**: Manage inventory across central warehouses, showrooms, and factory branches.
- **Stock Receiving (GRN)**: Structured goods receiving notes with landed cost distribution for freight and transport expenses.
- **Weighted Average Cost (WAC)**: Real-time inventory valuation and accurate cost tracking.
- **Price Protection**: Automatic floor enforcement to ensure selling prices stay aligned with product procurement costs.
- **Transfers & Adjustments**: Track inter-branch stock movements and variance audits.

### Customer Directory & CRM
- **Customer Profiles**: Unified directory tracking purchasing trends and contact records.
- **Customer Ledger**: Detailed transaction logs displaying product-level purchase history and cumulative balance.
- **Credit & Receivables**: Track paid vs. outstanding customer balances at a glance.

### Dashboard & Financial Analytics
- **Sales Analytics**: Revenue trends, sales volume, and performance grouped daily, weekly, or monthly.
- **Profitability Tracking**: Invoice-level cost of goods sold (COGS), net profit, and margin percentages.
- **Daily Sales Reports**: Standard A4 landscape daily reconciliation sheets complete with manager verification and audit sign-off lines.
- **Dead Stock & Runway Alerts**: Identify slow-moving items and monitor stock longevity.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js (App Router), React, TypeScript, Tailwind CSS |
| **Backend** | Python, FastAPI, Pydantic |
| **Database** | PostgreSQL |
| **Event Bus** | Asynchronous message broker (NATS) |
| **Gateway & Proxy** | Traefik Reverse Proxy |
| **Containerization** | Docker, Docker Compose |

---

## Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Python](https://www.python.org/) (3.11+ recommended)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd grocery-inventory
```

### 2. Environment Configuration
Copy the sample environment file and configure your local settings:
```bash
cp .env.example .env
```

### 3. Start Application with Docker
Launch the complete stack (services, databases, proxy, and frontend):
```bash
docker compose up -d --build
```

Once running, access the web portal in your browser:
- **Web Application**: `http://localhost`
- **Dashboard**: `http://localhost/dashboard`
- **Inventory Management**: `http://localhost/inventory`

---

## Project Structure

```text
├── frontend/                # Next.js web application (Pages, Components, Modals)
├── services/
│   ├── auth/                # Authentication & user role management
│   ├── inventory/           # Product catalog, stock tracking & warehouse logistics
│   └── sales/               # POS orders, billing & financial metrics
├── shared/                  # Common utilities & database connections
├── deployments/             # Proxy configuration & container definitions
└── docker-compose.yml       # Monorepo service orchestration
```

---

## Security & Best Practices

- **Role-Based Access Control (RBAC)**: Role-specific access for cashiers, inventory managers, and administrators.
- **Confidential Customer Invoicing**: Vendor/supplier information is restricted to internal procurement views and hidden from retail receipts.
- **Schema Separation**: Isolated data models for inventory, sales, and authentication.

---

## License
This project is licensed under the MIT License - see the LICENSE file for details.
