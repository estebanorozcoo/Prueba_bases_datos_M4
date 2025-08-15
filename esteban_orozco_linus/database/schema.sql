-- Database: db_esteban_orozco_linus
-- Propósito: crear la BD completa con relaciones 
-- e índices donde aplica, y vistas de reportes.

CREATE DATABASE IF NOT EXISTS db_esteban_orozco_linus
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE db_esteban_orozco_linus;

-- Drop tables (clean setup)
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS platforms;

-- Platforms
CREATE TABLE platforms (
  platform_id   INT PRIMARY KEY AUTO_INCREMENT,
  platform_name VARCHAR(50)  NOT NULL UNIQUE,
  platform_type VARCHAR(30)  NOT NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clients
CREATE TABLE clients (
  client_id   INT PRIMARY KEY AUTO_INCREMENT,
  client_code VARCHAR(20)  NOT NULL UNIQUE,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE,
  phone       VARCHAR(20),
  address     VARCHAR(255),
  city        VARCHAR(100),
  department  VARCHAR(100),
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoices
CREATE TABLE invoices (
  invoice_id     INT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(50)  NOT NULL UNIQUE,
  client_id      INT          NOT NULL,
  billing_period VARCHAR(20)  NOT NULL,
  total_amount   DECIMAL(15,2) NOT NULL,
  paid_amount    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  status         ENUM('PENDING','PARTIAL','PAID','OVERDUE') NOT NULL DEFAULT 'PENDING',
  description    TEXT,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoices_client
    FOREIGN KEY (client_id) REFERENCES clients(client_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactions
CREATE TABLE transactions (
  transaction_id        INT PRIMARY KEY AUTO_INCREMENT,
  transaction_reference VARCHAR(100) NOT NULL UNIQUE,
  invoice_id            INT NOT NULL,
  platform_id           INT NOT NULL,
  transaction_date      DATETIME NOT NULL,
  amount                DECIMAL(15,2) NOT NULL,
  transaction_type      ENUM('PAYMENT','REFUND','ADJUSTMENT') NOT NULL DEFAULT 'PAYMENT',
  status                ENUM('PENDING','COMPLETED','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  description           TEXT,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tx_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_tx_platform
    FOREIGN KEY (platform_id) REFERENCES platforms(platform_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices recomendados
CREATE INDEX idx_clients_code     ON clients(client_code);
CREATE INDEX idx_invoices_num     ON invoices(invoice_number);
CREATE INDEX idx_invoices_client  ON invoices(client_id);
CREATE INDEX idx_invoices_status  ON invoices(status);           -- NUEVO
CREATE INDEX idx_tx_ref           ON transactions(transaction_reference);
CREATE INDEX idx_tx_date          ON transactions(transaction_date);
CREATE INDEX idx_tx_invoice       ON transactions(invoice_id);
CREATE INDEX idx_tx_platform      ON transactions(platform_id);
CREATE INDEX idx_platform_name    ON platforms(platform_name);

-- Vistas filtrando clientes activos (soft delete consistente)
CREATE OR REPLACE VIEW client_total_payments AS
SELECT
  c.client_id,
  c.client_code,
  CONCAT(c.first_name, ' ', c.last_name) AS client_name,
  COALESCE(SUM(t.amount), 0) AS total_paid,
  COUNT(t.transaction_id)    AS total_transactions
FROM clients c
LEFT JOIN invoices i ON c.client_id = i.client_id
LEFT JOIN transactions t
  ON i.invoice_id = t.invoice_id
 AND t.status = 'COMPLETED'
WHERE c.is_active = TRUE
GROUP BY c.client_id, c.client_code, c.first_name, c.last_name;

CREATE OR REPLACE VIEW pending_invoices AS
SELECT
  i.invoice_id,
  i.invoice_number,
  c.client_code,
  CONCAT(c.first_name, ' ', c.last_name) AS client_name,
  i.billing_period,
  i.total_amount,
  i.paid_amount,
  (i.total_amount - i.paid_amount) AS pending_amount,
  i.status,
  i.description
FROM invoices i
JOIN clients c ON i.client_id = c.client_id
WHERE c.is_active = TRUE
  AND i.status IN ('PENDING','PARTIAL','OVERDUE');

CREATE OR REPLACE VIEW transactions_by_platform AS
SELECT
  p.platform_name,
  t.transaction_reference,
  c.client_code,
  CONCAT(c.first_name, ' ', c.last_name) AS client_name,
  i.invoice_number,
  t.transaction_date,
  t.amount,
  t.transaction_type,
  t.status
FROM transactions t
JOIN platforms p ON t.platform_id = p.platform_id
JOIN invoices  i ON t.invoice_id  = i.invoice_id
JOIN clients   c ON i.client_id   = c.client_id
WHERE c.is_active = TRUE
ORDER BY t.transaction_date DESC;

-- Datos iniciales de plataformas
INSERT INTO platforms (platform_name, platform_type) VALUES
('Nequi','DIGITAL_WALLET'),
('Daviplata','DIGITAL_WALLET'),
('Bancolombia','BANK'),
('Banco de Bogotá','BANK'),
('BBVA Colombia','BANK');
