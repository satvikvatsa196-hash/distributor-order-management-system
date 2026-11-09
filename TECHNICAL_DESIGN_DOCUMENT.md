# Technical Design Document (TDD)
## Next-Generation Distributor Order Management System
**Client:** Company A, Jabalpur (FMCG Distributor — 1,800 Kirana Stores, 4 Brands, ₹85–100 Cr/year Revenue)  
**Project GitHub Repository:** `https://github.com/satvikvatsa196-hash/distributor-order-management-system`  
**Evaluation Mode:** Local Review at `http://localhost:3000` *(Step-by-step in `deployment.md`)*  
**Author / Lead Engineer:** Software Engineering Candidate  
**Date:** November 2026  

---

## Executive Summary & Problem Context

Company A operates as an established FMCG distributor in Jabalpur, Madhya Pradesh, supplying packaged foods and home care essentials to 1,800 kirana shops with a field force of 18 salesmen and an office operations team of 6 order entry staff. At ₹90 crore annual turnover (~600 orders/day at ₹5,000 average order value across 300 operating days), the company suffers significant financial leakage directly tied to manual order processing:
1. **Wrong Items & Redeliveries:** 5% error rate on 1,80,000 annual orders creates 9,000 misdelivered orders costing ₹350 each in reverse logistics, repackaging, and transit damages = **₹31.5 Lakh/year**.
2. **Order Entry Labor:** 6 office staff typing handwritten lists, WhatsApp texts, and Hindi voice notes into Tally ERP = **₹15.6 Lakh/year**.
3. **Stock-outs Found Post-Order:** Salesmen lack real-time visibility into godown inventory at shop counters, resulting in 1% lost sales cut after order receipt at 6% net margin = **₹5.4 Lakh/year**.
4. **Total Annual Cost of Problem:** **₹52.5 Lakh/year** against a development investment of ₹7.0 Lakh.

This document details the architectural decisions, data models, AI natural-language parsing engine, scheme computation algorithms, and design choices engineered to solve these problems end to end.

---

## 1. System Architecture & Rationale

```
+-----------------------------------------------------------------------------------------+
|                                    CLIENT LAYER                                         |
|  [Kirana Retailer Phone]          [Field Salesman (Visit)]          [Order Desk Console]|
|  - Fast Catalogue (<3s)           - Offline-capable visit           - Credit Hold Queue |
|  - Real-time Schemes              - Retailer impersonation          - Tally XML Export  |
|  - AI Message Order               - Inactive 14d store visit        - Van Loading Sheet |
+-----------------------------------------------------------------------------------------+
                                          |
                                    HTTPS / JSON
                                          v
+-----------------------------------------------------------------------------------------+
|                                APPLICATION BACKEND                                      |
|                       Next.js 16 (App Router) + Node.js 20                              |
|                                                                                         |
|  +--------------------+  +----------------------+  +---------------------------------+  |
|  |   Scheme Engine    |  |   AI Message Parser  |  |   Order & Credit Controller     |  |
|  | - Buy X Get Y Free |  | - Google Gemini 2.0  |  | - Hard Credit Limit Check       |  |
|  | - Slab % Discount  |  | - Offline Phonetic   |  | - Status Transition Engine      |  |
|  | - GST Calculation  |  | - Retailer Aliases   |  | - Inventory Reservation         |  |
|  +--------------------+  +----------------------+  +---------------------------------+  |
+-----------------------------------------------------------------------------------------+
                                          |
                                     Prisma ORM
                                          v
+-----------------------------------------------------------------------------------------+
|                                   DATA LAYER                                            |
|                  Relational DB (SQLite for Local / PostgreSQL for Prod)                 |
|  - Users (Retailers, Salesmen, Desk)       - Orders & OrderItems                        |
|  - Products & Inventory Stock              - SkuAliases (Learned Mappings)              |
|  - Schemes (B10G1, Slab Discounts)         - Credit Balances & Ledger                   |
+-----------------------------------------------------------------------------------------+
```

### Why Next.js 16 with App Router & React 19?
1. **Kirana 3G Performance Constraints:** Kirana store owners operate low-to-mid range Android smartphones over 3G/4G connections. Next.js App Router provides automatic route segment prefetching, zero-bundle server components, and compressed static assets, guaranteeing sub-3-second first contentful paint (FCP).
2. **Unified Full-Stack Architecture:** Single codebase for client UI, server-side credit verification, background analytics, and Tally export eliminates API contract drift between disconnected frontend and backend repositories.
3. **PWA Installability:** Native service worker support and manifest configuration allow kirana shopkeepers to install the portal directly to their Android home screen with an app icon.

### Why Prisma ORM with Relational Schema?
Financial transactions, FMCG schemes, and credit balances require strict **ACID compliance**. Prisma transactions (`prisma.$transaction`) ensure that stock decrements, credit balance increases, and order line item creations happen atomically. If stock is insufficient or a database constraint fails, the entire transaction rolls back cleanly without phantom inventory cuts.

---

## 2. Data Model & Entity Relationships

The schema is defined in Prisma (`prisma/schema.prisma`) with explicit relational integrity:

```
+--------------------+        +--------------------+        +--------------------+
|       User         | 1    * |       Order        | 1    * |     OrderItem      |
|--------------------|--------|--------------------|--------|--------------------|
| id (cuid)          |        | id (cuid)          |        | id (cuid)          |
| phone (unique)     |        | orderNumber (UQ)   |        | orderId (FK)       |
| name               |        | userId (FK)        |        | productId (FK)     |
| role (ENUM)        |        | status (ENUM)      |        | quantity           |
| shopName           |        | subtotal           |        | unitPrice          |
| creditLimit        |        | discount           |        | total              |
| creditUsed         |        | freeGoods (JSON)   |        | isFreeGood         |
| assignedSalesmanId |        | gstAmount          |        | originalText       |
+--------------------+        | source (APP/AI)    |        | confidence         |
                              | aiConfidence       |        +--------------------+
                              +--------------------+                  | *
                                                                      |
                                                                      | 1
+--------------------+ 1    * +--------------------+        +--------------------+
|      Product       |--------|       Scheme       |        |      SkuAlias      |
|--------------------|        |--------------------|        |--------------------|
| id (cuid)          |        | id (cuid)          |        | id (cuid)          |
| skuCode (unique)   |        | productId (FK)     |        | alias              |
| name               |        | type (B10G1/SLAB)  |        | productId (FK)     |
| nameHindi          |        | minQty             |        | retailerId (FK)    |
| retailerPrice      |        | freeQty            |        | language           |
| stock              |        | discountPercent    |        +--------------------+
| unit (case/piece)  |        | isActive           |
+--------------------+        +--------------------+
```

### Key Entity Specifications:
- **`User`**: Supports 4 distinct roles: `RETAILER`, `ORDER_DESK`, `SALESMAN`, and `ADMIN`. Contains credit management fields: `creditLimit` (default ₹50,000) and `creditUsed`. Self-referencing relation `assignedSalesman` maps field reps to their respective kirana accounts.
- **`Product`**: Models FMCG items with `skuCode`, English name, Hindi name (`nameHindi`), `retailerPrice`, `dealerPrice`, `mrp`, `unitsPerCase`, `stock`, and low-stock notification threshold.
- **`Scheme`**: Supports two core promotional structures:
  - `BUY_X_GET_Y`: e.g. Buy 10 cases of Glucose Biscuit, get 1 free case.
  - `SLAB_DISCOUNT`: e.g. Buy 5+ cases of Detergent Powder, get 3% invoice discount.
- **`Order` & `OrderItem`**: Stores financial breakdown (`subtotal`, `discount`, `gstAmount`, `total`), order status, source channel (`APP`, `AI_TEXT`, `AI_VOICE`, `SALESMAN`), and AI traceability fields (`originalText`, line-level `confidence`, `alternatives`).
- **`SkuAlias`**: Self-learning dictionary that maps retailer-specific colloquial terms (e.g., "biscuit chhota", "sabsay chhota surf") to concrete SKU IDs. Scoped globally or to individual retailers (`@@unique([alias, retailerId])`).

---

## 3. Core Business Logic & The Scheme Engine

The scheme engine (`src/lib/scheme-engine.ts`) is the computational core of the system. In Indian FMCG distribution, promotional schemes are governed by rigorous rules:

### A. Buy X Get Y Free Calculation
- **Threshold Slabs:** For every integer multiple of `minQty`, the retailer earns `freeQty` free cases.
  $$\text{Qualified Slabs} = \left\lfloor \frac{\text{Ordered Quantity}}{\text{minQty}} \right\rfloor$$
  $$\text{Free Cases} = \text{Qualified Slabs} \times \text{freeQty}$$
- **Partial Slab Protection:** Surplus cases that do not fulfill a complete slab do *not* qualify for fractional free goods.
  - *Example:* Order 10 cases → 1 free case.
  - *Example:* Order 15 cases → 1 free case (5 remaining cases carry over, but don't qualify).
  - *Example:* Order 20 cases → 2 free cases.
- **Billed vs Free Stock Allocation:** Free goods are created as discrete `OrderItem` rows with `unitPrice = 0` and `isFreeGood = true`. Warehouse loading deducts both billed and free cases from godown inventory to prevent stock imbalances.

### B. Slab Discounts
- If $\text{Ordered Quantity} \ge \text{minQty}$, a percentage discount is applied across the product line total:
  $$\text{Discount Amount} = \text{round}\left( \frac{\text{Line Total} \times \text{discountPercent}}{100}, 2 \right)$$
- If the quantity falls below `minQty`, discount is strictly 0.

### C. GST Accounting (Reverse Backout from Inclusive Pricing)
The client brief mandates that prices show clearly whether GST is included. In FMCG retail, dealer and retailer prices are presented GST-inclusive so kirana owners know their exact cash outlay. The engine calculates the embedded tax component:
$$\text{GST Amount} = \text{round}\left( \frac{\text{Gross Total} \times 18}{118}, 2 \right)$$

---

## 4. AI Message & Natural Language Order Parser

### The Problem
Shopkeepers send unstructured messages over WhatsApp in Hindi, Hinglish, and colloquial dialects:
> *"bhaiya 5 peti biscuit chhota, 2 peti washing powder 1 kilo, chai patti 250 wala 1 peti."*

### Two-Tier Hybrid Architecture
```
Unstructured Input Text
          │
          ▼
   ┌──────────────┐      Success
   │ Gemini 2.0   │─────────────────► Structured JSON Order
   │ Flash API    │
   └──────────────┘
          │ (Timeout / No Key / Offline)
          ▼
   ┌──────────────┐
   │ Offline Rule │
   │ & Phonetic   │─────────────────► Deterministic Fallback
   │ Parser       │
   └──────────────┘
```

1. **Primary Tier (Google Gemini 2.0 Flash):**
   - Prompt-engineered specifically for Central Indian FMCG retail terminology.
   - Extracts quantity, normalizes units (`peti`, `petti`, `dabba`, `carton` $\to$ `case`; `packet`, `piece`, `khula` $\to$ `piece`).
   - Computes confidence scores ($0.0 - 1.0$) per line.
   - Enforces 5-second timeout with `AbortController` to prevent client stalls.

2. **Secondary Tier (Deterministic Offline Phonetic & Substring Parser):**
   - Runs with zero external network connectivity.
   - Strips conversational Hindi greetings (`bhaiya`, `are bhai`, `namaste`, `ji`, `chahiye`, `bhej dena`).
   - Normalizes Devanagari numerals (`ek`, `do`, `teen`, `paanch`, `das`).
   - Performs Levenshtein edit distance and token substring matching against SKU names and `SkuAlias` tables.

### Handling Ambiguity & Corrections (Safety Guardrails)
- **No Order Placed Without Human Confirmation:** The parsed output is displayed in an editable review table before any order is submitted.
- **Traceability:** Each line displays the exact original words submitted by the shopkeeper.
- **Alternative SKU Chips:** When confidence is $< 0.8$, the engine presents 2 alternative SKU suggestions with 1-click swap buttons.
- **Unclear Unit Detection:** If a message specifies `"10 biscuit"` without `peti` or `packet`, `needsUnitClarification` is set to `true`. The UI explicitly flags the item with a prompt asking the user to confirm **Case** or **Piece** rather than guessing.
- **Continuous Learning (Alias Capture):** When the Order Desk or shopkeeper re-maps an SKU, the system persists the correction to `SkuAlias`. Future orders matching that phrase achieve $\ge 95\%$ confidence automatically.

---

## 5. Order Desk, Credit Risk & Tally Integration

### A. Credit Limit & Hold Enforcement
- Retailers operate under agreed credit limits (e.g., Sharma General Store: ₹75,000; Gupta Kirana: ₹50,000).
- When an order is placed:
  $$\text{Projected Credit Used} = \text{Current Credit Used} + \text{Order Total}$$
  - If $\text{Projected Credit Used} \le \text{Credit Limit}$: Order status becomes **`CONFIRMED`**.
  - If $\text{Projected Credit Used} > \text{Credit Limit}$: Order status is automatically routed to **`CREDIT_HOLD`**.
- An order under `CREDIT_HOLD` cannot be dispatched until an authorized Order Desk operator or Admin reviews the account and clicks **Approve Credit Hold**.

### B. Tally Prime / ERP 9 XML Export
The operations team currently spends 6 clerk salaries re-typing orders into Tally. The portal provides a native `Tally XML Sync` endpoint (`/api/desk/export/tally?format=xml`) that generates standard Tally XML vouchers:
- XML Envelope: `TALLYREQUEST` $\to$ `Import Data` $\to$ `Vouchers`
- Voucher Type: `Sales Order`
- Ledger allocation: Debits Customer Ledger (`PARTYLEDGERNAME`) and credits Sales Account.
- Inventory allocation: `STOCKITEMNAME`, `RATE`, `BILLEDQTY` vs `ACTUALQTY` (for free scheme goods), and godown routing (`Jabalpur Central Godown`).

### C. Delivery Van Loading Sheet
To eliminate loading bottlenecks at the warehouse:
1. **Aggregated SKU Loading Table:** Summarizes total cases per product across all confirmed orders (e.g. Glucose Biscuit: 45 billed cases + 4 free cases = 49 total cases to load).
2. **Delivery Drop Sequence:** Ordered delivery manifest with stop numbers, shop names, street addresses, phone numbers, and case counts for the van driver.

### D. Inactive Retailer Dashboard (14+ Days)
At 600 orders/day across 1,800 kiranas, an average shop orders every 3 days. A store that has not ordered in 14 days represents severe churn risk. The system scans all accounts where $\text{Days Since Last Order} \ge 14$, highlighting assigned salesmen, last order value, and providing 1-click **Call**, **WhatsApp**, and **Visit Order** shortcuts.

---

## 6. UI & UX Design Decisions

The client emphasized: *"clean layouts, white space, a restrained palette and clear type, with nothing on screen that lacks a purpose. Shopkeepers order between customers: a fast, uncluttered catalogue with large images, clear prices and a quick cart."*

1. **Large Touch Targets (Min 44px):** Kirana store owners frequently hold phones with one hand while serving store customers with the other. All quantity buttons, category filters, and action CTAs feature minimum 44px touch targets with active press scaling.
2. **High-Contrast, Restrained Palette:**
   - Primary Blue (`#2563EB`): Structural navigation and order confirmation.
   - Emerald Green (`#059669`): Scheme benefits, discounts, and in-stock badges.
   - Amber (`#D97706`): Low-stock warnings and credit review notices.
   - Coral Red (`#DC2626`): Out of stock and credit limit exceeded flags.
   - Slate (`#0F172A` / `#F8FAFC`): Clean, neutral typography and backgrounds.
3. **Dual Language Support (Hindi & English):** Instant language toggle in the header switches catalogue labels, scheme descriptions, and order statuses between Hindi and English without reloading the page.
4. **Frictionless Demo Persona Switcher:** Reviewers can switch between **Sharma General Store** (Retailer), **Gupta Kirana** (High Credit Retailer), **Priya Sharma** (Order Desk), **Vikram Singh** (Salesman), and **Rajesh Kumar** (Owner) in one click without SMS dependencies.

---

## 7. Assumptions Labeled (Per Brief Rules)

1. **GST Rate:** Assumed at standard FMCG blended rate of **18%**, calculated as embedded tax in gross prices.
2. **Credit Limit Default:** Assumed default credit limit of ₹50,000 for standard kirana stores, adjustable per store.
3. **Operating Slabs:** Assumed Company A operates 300 business days/year with 600 orders/day averaging ₹5,000 each.
4. **Mock Authentication:** In production, OTP is dispatched via SMS gateway (DLT-registered template). For development and review, OTP `123456` or the 1-click persona switcher provides immediate authenticated access.
5. **Inventory Units:** Standard wholesale ordering unit is the **Case** (`peti`), with sub-units represented as **Piece** (`packet`).

---

## 8. What Was Cut & Roadmap for Next Phase

### What Was Intentionally Cut (Scope Discipline)
Per the problem statement:
- **Delivery GPS Tracking:** Out of scope for this slice (addressed via van loading sheets).
- **Payment Gateway Processing:** Out of scope (B2B kirana settlement occurs via cash on delivery or weekly ledger credit).
- **GST e-Invoicing:** Retained in Tally Prime via the XML export rather than duplicating tax portal integrations.

### What Would Be Built Next (Phase 2 Roadmap)
1. **Offline Background Sync via IndexedDB & Service Worker:** Full offline catalogue caching and order queuing when salesmen visit remote rural kiranas outside cellular signal.
2. **Direct WhatsApp Webhook Integration:** Bi-directional WhatsApp Business API webhook so kirana shopkeepers can send audio voice notes or text directly to the distributor's WhatsApp number and receive a confirmation link.
3. **Automated Tally ODBC / Direct API Connector:** Automated daemon service running on the office Windows server to post approved orders directly into Tally Prime via XML over HTTP port 9000 without requiring manual file uploads.

