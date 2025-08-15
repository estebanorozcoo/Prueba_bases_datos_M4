# Installation & Setup Guide

## Requirements

* **Node.js** v14+ (v18 recommended)
* **MySQL** 8+
* (Optional) **Postman**

Verify versions:

```bash
node --version
npm --version
mysql --version
```

---

## 1) Database

### 1.1 Create the database

Connect to MySQL and create the DB:

```sql
CREATE DATABASE db_esteban_orozco_linus
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
```

### 1.2 Import the schema

From the **project root**, run:

```bash
mysql -u root -p db_esteban_orozco_linus < database/schema.sql
```

> **Windows PowerShell:** same command works. If you prefer backslashes:
>
> ```powershell
> mysql -u root -p db_esteban_orozco_linus < database\schema.sql
> ```

### 1.3 Quick verification

```sql
USE db_esteban_orozco_linus;

-- You should see these tables
SHOW TABLES;

-- There should be 5 default platforms
SELECT COUNT(*) FROM platforms;
```

---

## 2) Backend

### 2.1 Install dependencies

```bash
cd backend
npm install
```

### 2.2 Configure environment variables

Copy the example and edit as needed:

```bash
cp env.example .env
```

Example (`backend/.env`):

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

### 2.3 Start the server

```bash
npm start
# or, for autoreload during development:
# npm run dev
```

You should see something like:

```
🚀 Financial Data Management System Server
==========================================
📡 Server on port: 3000
🔗 API Base: http://localhost:3000/api
💾 Database: db_esteban_orozco_linus (connected)
==========================================
```

---

## 3) Frontend

The frontend is served by Express.

* Open: `http://localhost:3000`
* API base: `http://localhost:3000/api`

> **Note:** `frontend/index.html` uses **Bootstrap** and **Bootstrap Icons** via CDN.

---

## 4) Quick Tests

### 4.1 Health check

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Financial Data Management System API",
  "status": "healthy",
  "database": "connected",
  "timestamp": "...",
  "version": "1.0.0"
}
```

### 4.2 Clients CRUD

```bash
# List clients
curl http://localhost:3000/api/clients

# Create a client
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "client_code": "CLI001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }'

# Get by ID (e.g. 1)
curl http://localhost:3000/api/clients/1

# Update (e.g. 1)
curl -X PUT http://localhost:3000/api/clients/1 \
  -H "Content-Type: application/json" \
  -d '{
    "client_code": "CLI001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }'

# Soft delete
curl -X DELETE http://localhost:3000/api/clients/1
```

### 4.3 Reports (advanced queries via SQL views)

```bash
# Total paid by client
curl http://localhost:3000/api/reports/total-payments

# Pending invoices
curl http://localhost:3000/api/reports/pending-invoices

# Transactions by platform (all)
curl http://localhost:3000/api/reports/transactions-by-platform

# Filter by platform (e.g., Nequi)
curl "http://localhost:3000/api/reports/transactions-by-platform?platform=Nequi"
```

---

## 5) Postman

1. Import `postman/collection.json`.
2. Create an **Environment** with:

   ```
   base_url = http://localhost:3000
   ```
3. Run the requests in:

   * `Health`
   * `Clients`
   * `Reports`

> **Note:** The collection does not include “data loader” endpoints.
> If your repo still contains `routes/queries.js` or `routes/data-loader.js`, remove them (deprecated and not mounted).

---

## 6) Troubleshooting

* **DB access denied**
  Check `.env` credentials, ensure MySQL is running, and the DB exists.

* **Port 3000 already in use**
  Change `PORT` in `.env` or free the port (Linux/macOS):

  ```bash
  lsof -i :3000
  kill -9 <PID>
  ```

* **CORS blocked**
  Add your frontend origin to `CORS_ORIGIN` in `.env` and restart the server.

* **Missing modules**
  Reinstall everything:

  ```bash
  cd backend
  rm -rf node_modules package-lock.json
  npm install
  ```

* **Schema path mismatch**
  The correct path in this project is:

  ```
  database/schema.sql
  ```

---

## 7) Implementation Notes

* **Soft delete:** `DELETE /api/clients/:id` sets `is_active = FALSE`.
  `getAll` and `getById` **exclude** inactive records.
* **Validations (server-side):**

  * `client_code`: 3–20 (A–Z, 0–9), normalized to **UPPERCASE**.
  * `first_name` / `last_name`: 2–100, letters/spaces only (accents supported).
  * `address` **≤ 255** (aligned with the DDL).
* **Uniqueness:** `clients.client_code` and `invoices.invoice_number` are `UNIQUE`.
  The backend checks duplicates before create/update.
* **SQL Views:** `client_total_payments`, `pending_invoices`, `transactions_by_platform`.




# Guía de Instalación y Puesta en Marcha

## Requisitos

* **Node.js** v14+ (recomendado v18)
* **MySQL** 8+
* (Opcional) **Postman**

Verifica versiones:

```bash
node --version
npm --version
mysql --version
```

---

## 1) Base de Datos

### 1.1 Crear la base de datos

Conéctate a MySQL y crea la base:

```sql
CREATE DATABASE db_esteban_orozco_linus
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
```

### 1.2 Importar el esquema

Desde la **raíz del proyecto**, ejecuta:

```bash
mysql -u root -p db_esteban_orozco_linus < database/schema.sql
```

> **Nota:** Si usas Windows PowerShell, el comando es el mismo. Si prefieres la ruta con backslashes:
>
> ```powershell
> mysql -u root -p db_esteban_orozco_linus < database\schema.sql
> ```

### 1.3 Verificación rápida

```sql
-- Conéctate a la BD
USE db_esteban_orozco_linus;

-- Debes ver estas tablas
SHOW TABLES;

-- Debes tener 5 plataformas por defecto
SELECT COUNT(*) FROM platforms;
```

---

## 2) Backend

### 2.1 Instalar dependencias

```bash
cd backend
npm install
```

### 2.2 Configurar variables de entorno

Copia el ejemplo y edita según tu entorno:

```bash
cp env.example .env
```

Contenido de ejemplo (`backend/.env`):

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

# CORS (separar por comas)
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:5500
```

### 2.3 Iniciar el servidor

```bash
npm start
# o en desarrollo:
# npm run dev
```

Deberías ver algo como:

```
🚀 Financial Data Management System Server
==========================================
📡 Server on port: 3000
🔗 API Base: http://localhost:3000/api
💾 Database: db_esteban_orozco_linus (connected)
==========================================
```

---

## 3) Frontend

El frontend está servido por Express.

* Abre: `http://localhost:3000`
* La API está en: `http://localhost:3000/api`

> **Nota:** `frontend/index.html` usa **Bootstrap** y **Bootstrap Icons** por CDN.

---

## 4) Pruebas Rápidas

### 4.1 Salud del sistema

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada:

```json
{
  "success": true,
  "message": "Financial Data Management System API",
  "status": "healthy",
  "database": "connected",
  "timestamp": "...",
  "version": "1.0.0"
}
```

### 4.2 CRUD de clientes

```bash
# Listar clientes
curl http://localhost:3000/api/clients

# Crear cliente
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "client_code": "CLI001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }'

# Obtener por ID (ej: 1)
curl http://localhost:3000/api/clients/1

# Actualizar (ej: 1)
curl -X PUT http://localhost:3000/api/clients/1 \
  -H "Content-Type: application/json" \
  -d '{
    "client_code": "CLI001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }'

# Borrado lógico (soft delete)
curl -X DELETE http://localhost:3000/api/clients/1
```

### 4.3 Reportes (consultas avanzadas vía vistas)

```bash
# Total pagado por cliente
curl http://localhost:3000/api/reports/total-payments

# Facturas pendientes
curl http://localhost:3000/api/reports/pending-invoices

# Transacciones por plataforma (todas)
curl http://localhost:3000/api/reports/transactions-by-platform

# Filtrar por plataforma (ej: Nequi)
curl "http://localhost:3000/api/reports/transactions-by-platform?platform=Nequi"
```

---

## 5) Postman

1. Importa `postman/collection.json`.
2. Crea un **Environment** con:

   ```
   base_url = http://localhost:3000
   ```
3. Ejecuta los requests de:

   * `Health`
   * `Clients`
   * `Reports`

> **Nota:** La colección no incluye endpoints de “data loader”.
> Si en tu repo quedan archivos `routes/queries.js` o `routes/data-loader.js`, elimínalos (están deprecados y no se montan).

---

## 6) Solución de Problemas

* **Acceso a BD denegado**
  Verifica credenciales en `.env`, que MySQL esté corriendo y que la BD exista.

* **Puerto 3000 en uso**
  Cambia `PORT` en `.env` o libera el puerto (Linux/macOS):

  ```bash
  lsof -i :3000
  kill -9 <PID>
  ```

* **CORS bloqueado**
  Agrega el origen del frontend a `CORS_ORIGIN` en `.env` y reinicia el server.

* **Módulos faltantes**
  Reinstala todo:

  ```bash
  cd backend
  rm -rf node_modules package-lock.json
  npm install
  ```

---

## 7) Notas de Implementación

* **Soft delete:** `DELETE /api/clients/:id` marca `is_active = FALSE`.
  Los métodos `getAll`/`getById` **excluyen** registros inactivos.
* **Validaciones clave:**

  * `client_code`: 3–20 (A–Z, 0–9), normalizado a **MAYÚSCULAS**.
  * `first_name`/`last_name`: 2–100, solo letras y espacios (con acentos).
  * `address` **≤ 255** (alineado con el DDL).
* **Restricciones únicas:** `clients.client_code`, `invoices.invoice_number`.
  El backend verifica duplicados antes de crear/actualizar.
* **Vistas SQL:** `client_total_payments`, `pending_invoices`, `transactions_by_platform`.
