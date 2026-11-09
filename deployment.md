# Deployment and Run Guide

## Project: Distributor Order Management System (Company A, Jabalpur)

This document provides step-by-step instructions for running the application locally, deployment configuration, environment variables, and pre-configured reviewer credentials.

---

## 1. Demo Login & Reviewer Quick-Access

The application features an **instant role switcher** in the top navigation bar, allowing reviewers to evaluate the system across all user personas with a single click—no passwords or SMS OTP required. Alternatively, standard phone credentials with mock OTP `123456` are supported.

| Role | Name / Shop Name | Phone Number | Mock OTP | Key Review Scenario |
| :--- | :--- | :--- | :--- | :--- |
| **Retailer** | **Sharma General Store** | `9999999701` | `123456` | Healthy credit (₹62,500 avail); full catalogue browsing, scheme calculations, and order placement. |
| **Retailer** | **Gupta Kirana** | `9999999702` | `123456` | **High credit utilization** (₹48,200 / ₹50,000 used). Placing an order of ₹5,000 automatically triggers **CREDIT HOLD**. |
| **Retailer** | **Agrawal Provision** | `9999999703` | `123456` | High limit store (₹1,00,000 credit limit). |
| **Order Desk** | **Priya Sharma** | `9999999901` | `123456` | Central office desk; approve/reject credit holds, sync Tally XML, export van loading sheets. |
| **Order Desk** | **Amit Verma** | `9999999902` | `123456` | Secondary order entry desk operator. |
| **Salesman** | **Vikram Singh** | `9999999801` | `123456` | Field salesman mode; visit orders, 14-day inactive store follow-ups. |
| **Admin** | **Rajesh Kumar** | `9999999999` | `123456` | Owner-director; master control and system analytics. |

---

## 2. Running Locally (Step-by-Step)

### Prerequisites
- **Node.js**: v20.x or higher
- **npm** (comes with Node.js)

### Step 1: Clone and Enter the Directory
```bash
git clone https://github.com/satvikvatsa196-hash/distributor-order-management-system.git
cd distributor-order-management-system
```

### Step 2: Configure Environment Variables
Copy the example environment configuration:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Contents of `.env`:
```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="development-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
GEMINI_API_KEY="" # Optional: Google Gemini API Key for online AI parsing; falls back to offline parser if empty
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Initialize and Seed the Database
Initialize the SQLite database schema and populate realistic Jabalpur FMCG catalogue and user accounts:
```bash
npx prisma db push
npm run db:seed
```

### Step 5: Run Automated Verification Tests
Run the test suite covering the Scheme Engine, AI Parser, and Credit Risk rules:
```bash
npm test
```
*Expected output: `16 PASSED | 0 FAILED`*

### Step 6: Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to **`http://localhost:3000`**.

---

## 3. Production Build & Local Production Run

To test the optimized production build:
```bash
npm run build
npm start
```
The application will be served at `http://localhost:3000`.

---

## 4. Production Cloud Deployment (Vercel / Railway / Render)

### Option A: Vercel (Recommended)
1. Push the repository to GitHub.
2. Import the project into the [Vercel Dashboard](https://vercel.com).
3. Framework Preset: **Next.js**
4. Build Command: `npm run build`
5. For serverless SQLite on Vercel, switch `DATABASE_URL` to a hosted PostgreSQL/Neon instance (or Turso libSQL). The Prisma schema supports switching `provider = "postgresql"`.
6. Add the following environment variable names in Vercel Project Settings:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `GEMINI_API_KEY` (Optional)

### Option B: Railway / Docker (Containerized)
The app runs seamlessly as a standalone Node.js server with the included SQLite or Postgres database.
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 5. Required Environment Variables Reference

| Variable Name | Required | Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | **Yes** | Connection string for Prisma ORM (`file:./prisma/dev.db` for SQLite or `postgresql://...`). |
| `NEXTAUTH_SECRET` | **Yes** | Cryptographic secret for signing session JWT tokens. |
| `NEXTAUTH_URL` | **Yes** | Base canonical URL of the application (`http://localhost:3000` or production domain). |
| `GEMINI_API_KEY` | *Optional* | Google Gemini API key for natural language order extraction. If omitted, the deterministic offline phonetic & substring parser handles all requests with zero external network dependency. |

---

## 6. Verification Checklist for the Reviewer

1. **Catalogue & Stock Status**: View real FMCG sample SKUs (Glucose biscuit 75g, Detergent 1kg, Tea leaf 250g). Notice out-of-stock indicator on Tea leaf and low-stock warning on Detergent.
2. **Real-time Scheme Engine**:
   - Add 10 cases of Glucose Biscuit 75g to Cart → Notice applied scheme: **+1 Case Free**.
   - Add 5 cases of Detergent 1kg to Cart → Notice applied scheme: **3% Slab Discount**.
3. **Credit Hold Logic**:
   - Switch to **Gupta Kirana** via top switcher. Add items worth > ₹1,800.
   - Place order → Status is automatically flagged as **CREDIT_HOLD**.
   - Switch to **Order Desk (Priya Sharma)** → Go to "Order Desk" tab → Click **Approve** on credit hold order.
4. **AI Message Order Capture**:
   - Click **"AI Message Order"** button in navbar.
   - Click the pre-populated button containing the exact client brief prompt:
     `"bhaiya 5 peti biscuit chhota, 2 peti washing powder 1 kilo, chai patti 250 wala 1 peti."`
   - Click **"Parse & Match SKUs"**.
   - Notice: Original words, confidence score, units mapped from *peti* to *case*, alternative suggestions, and confirmation before order placement.
5. **Tally XML & Van Loading Export**:
   - Under the "Order Desk" tab, click **"Tally XML Sync"** to download the standard Tally Prime voucher XML.
   - Click **"Van Loading Sheet"** to view aggregated truck loading counts and store drop sequences.
6. **14-Day Inactive Kirana Dashboard**:
   - Click **"Inactive Stores (14d)"** tab to view retailers who haven't ordered in 14+ days.
   - Click **"Visit Order"** to simulate field salesman visit ordering.

