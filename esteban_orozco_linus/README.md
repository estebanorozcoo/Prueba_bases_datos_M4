# Financial Data Management System (ExpertSoft)

A minimal system to manage clients and financial reports, built with **Node.js + Express** and **MySQL**.

Meets the test requirements:

* CRUD for **one entity** (`clients`) with **soft delete**.
* **Server-side validations** (express-validator) and basic sanitization.
* **3 advanced queries** exposed as reports via **SQL views**:

  * Total paid by client
  * Pending invoices
  * Transactions by platform
* No extra/unrequested features.

---

## Tech Stack

* **Backend:** Node.js, Express, express-validator, mysql2/promise, CORS, dotenv
* **Database:** MySQL 8+ with SQL views
* **Frontend (optional):** Static HTML/Bootstrap (+ Bootstrap Icons) + vanilla JS served by Express

---

## Project Structure

```
.
├─ backend/
│  ├─ config/
│  │  └─ database.js
│  ├─ models/
│  │  └─ Client.js
│  ├─ routes/
│  │  ├─ clients.js
│  │  └─ reports.js
│  ├─ env.example
│  ├─ package.json
│  └─ server.js
├─ database/
│  └─ schema.sql
├─ frontend/
│  ├─ index.html
│  └─ js/
│     └─ app.js
├─ postman/
│  └─ collection.json
├─ docs/
│  └─ INSTALLATION.md
└─ README.md
```

> If you still have `routes/queries.js` or `routes/data-loader.js` in your copy, remove them (they’re deprecated and not mounted).

---

## Prerequisites

* Node.js v14+ (recommended v18)
* MySQL 8+
* (Optional) Postman

---

## Quick Setup

1. **Database**

```sql
CREATE DATABASE db_esteban_orozco_linus
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
```

Import the schema:

```bash
mysql -u root -p db_esteban_orozco_linus < database/schema.sql
```

2. **Backend**

```bash
cd backend
npm install
cp env.example .env
# edit .env if needed
npm start      # or: npm run dev for autoreload
```

3. **Open the app**

* API base: `http://localhost:3000/api`
* Frontend (static): `http://localhost:3000`

---

## Environment Variables (.env)

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=db_esteban_orozco_linus
DB_PORT=3306

# Server
PORT=3000
NODE_ENV=development

# CORS (comma-separated)
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:5500
```

---

## Endpoints

### Health

```
GET /api/health
```

### Clients (CRUD + soft delete)

```
GET    /api/clients
GET    /api/clients/:id
POST   /api/clients
PUT    /api/clients/:id
DELETE /api/clients/:id     # soft delete (is_active=false)
```

**Key validations**

* `client_code`: 3–20 chars, **A–Z/0–9**, normalized to **UPPERCASE**.
* `first_name`, `last_name`: 2–100, letters/spaces only (supports accents).
* `address` ≤ **255** (matches DDL).

### Reports (advanced queries via views)

```
GET /api/reports/total-payments
GET /api/reports/pending-invoices
GET /api/reports/transactions-by-platform
GET /api/reports/transactions-by-platform?platform=Nequi
```

**Views used**

* `client_total_payments`
* `pending_invoices`
* `transactions_by_platform`

---

## Quick Examples (curl)

```bash
# Create a client
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "client_code": "CLI001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }'

# List clients
curl http://localhost:3000/api/clients

# Report: total paid by client
curl http://localhost:3000/api/reports/total-payments
```

---

## Postman

* Import `postman/collection.json`
* Create an environment with:

```
base_url = http://localhost:3000
```

* Includes: health, clients CRUD, and reports.
  (No Data Loader endpoints.)

---

## Implementation Details

* **Soft delete:** `DELETE /api/clients/:id` → sets `is_active = FALSE`.
  `getAll` and `getById` **exclude** inactive records.
* **Uniqueness:** `clients.client_code` and `invoices.invoice_number` are `UNIQUE`.
  Backend checks duplicates before create/update.
* **Views** filter by active clients and power the reports.
* **Basic security:** configurable CORS, `.env`, optional `app.disable('x-powered-by')`.
* **Frontend note:** `index.html` includes Bootstrap and **Bootstrap Icons** via CDN (icons are used across the UI).

---

## Troubleshooting

* **DB access denied:** verify `.env` credentials, MySQL running, DB exists.
* **Port 3000 in use:** change `PORT` in `.env` or free the port.
* **CORS blocked:** add your frontend origin to `CORS_ORIGIN`, restart server.
* **Missing modules:** remove `node_modules` and reinstall:

  ```bash
  cd backend
  rm -rf node_modules
  npm install
  ```


