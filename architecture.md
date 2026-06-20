# Grocery ERP - System Architecture Visualization

This document outlines the high-level architecture for the Multi-Branch Grocery ERP, incorporating our existing infrastructure (Traefik, NATS, PostgreSQL) with the new requirements (Redis, Celery, Offline PWA).

## System Design Diagram

```mermaid
graph TD
    %% Client Layer
    subgraph client_layer [Client / Browser]
        POS[POS PWA App<br/>React/Next.js]
        HQ[HQ Dashboard<br/>React/Next.js]
        BranchDash[Branch Dashboard<br/>React/Next.js]
        SW[Service Worker<br/>Offline Cache]
        IDB[(IndexedDB<br/>Offline Queue)]
        POS <--> SW
        SW <--> IDB
    end

    %% Gateway Layer
    subgraph gateway_layer [API Gateway]
        Traefik[Traefik Reverse Proxy<br/>SSL / Routing]
    end

    %% API Layer
    subgraph backend_services [FastAPI Microservices]
        AuthAPI[Auth Service<br/>JWT / Roles]
        InvAPI[Inventory Service<br/>Stock Ledger / GRN]
        SalesAPI[Sales Service<br/>POS / Checkout]
        ReportAPI[Reporting Service<br/>Analytics]
    end

    %% Message & Cache Layer
    subgraph event_cache_layer [Event & Cache Layer]
        NATS[NATS Message Broker<br/>Real-time Events]
        Redis[Redis Cache<br/>Sessions / Sync Queue]
    end

    %% Background Workers
    subgraph async_processing [Async Processing]
        Celery[Celery Workers<br/>Reports / Alerts]
    end

    %% Data Layer
    subgraph database_layer [Database Layer]
        PG[(PostgreSQL 16<br/>Multi-Schema DB)]
    end

    %% Connections
    client_layer -->|HTTPS / REST / WS| Traefik
    Traefik --> AuthAPI
    Traefik --> InvAPI
    Traefik --> SalesAPI
    Traefik --> ReportAPI

    AuthAPI <--> PG
    InvAPI <--> PG
    SalesAPI <--> PG
    ReportAPI <--> PG

    InvAPI <--> NATS
    SalesAPI <--> NATS
    
    SalesAPI <--> Redis
    ReportAPI <--> Redis

    Redis <--> Celery
    Celery <--> PG
```

## Architectural Highlights

* Offline-First POS Safety Net: The POS app relies on standard HTTPS requests. If the connection drops, a Service Worker intercepts the request, saves the cart to IndexedDB, and queues it.

* The Stock Ledger Source of Truth: Instead of simply updating a number in a table, every single stock movement (sale, transfer, damage) is recorded as a line item in the stock_ledger table. This guarantees perfect auditability.

* Event-Driven Real-Time Updates: When a sale occurs, the Sales Service publishes to NATS. The HQ Dashboard subscribes to these events via WebSockets for sub-second live updates.

* Background Heavy Lifting: Generating monthly profit reports across 5 branches takes time. Celery workers will handle these async tasks so the API never blocks.
