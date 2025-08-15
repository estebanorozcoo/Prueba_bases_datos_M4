// Propósito: Consultar vistas SQL ya 
// calculadas (más mantenible y rápido de ajustar en BD).

const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// 1) Total pagado por cada cliente
router.get('/total-payments', async (req, res) => {
  try {
    const sql = `
      SELECT client_id, client_code, client_name, total_paid, total_transactions
      FROM client_total_payments
      ORDER BY total_paid DESC, client_name ASC
    `;
    const result = await executeQuery(sql);
    if (!result.success) {
      return res.status(500).json({ success:false, message:'Error al obtener el total pagado por cliente', error: result.message });
    }
    res.json({ success:true, data: result.data, count: result.data.length });
  } catch (error) {
    console.error('Error en /api/reports/total-payments:', error);
    res.status(500).json({ success:false, message:'Error interno del servidor', error: error.message });
  }
});

// 2) Facturas pendientes con cliente
router.get('/pending-invoices', async (req, res) => {
  try {
    const sql = `
      SELECT invoice_id, invoice_number, client_code, client_name, billing_period,
             total_amount, paid_amount, pending_amount, status, description
      FROM pending_invoices
      ORDER BY pending_amount DESC, invoice_number ASC
    `;
    const result = await executeQuery(sql);
    if (!result.success) {
      return res.status(500).json({ success:false, message:'Error al obtener facturas pendientes', error: result.message });
    }
    res.json({ success:true, data: result.data, count: result.data.length });
  } catch (error) {
    console.error('Error en /api/reports/pending-invoices:', error);
    res.status(500).json({ success:false, message:'Error interno del servidor', error: error.message });
  }
});

// 3) Transacciones por plataforma 
router.get('/transactions-by-platform', async (req, res) => {
  try {
    const { platform } = req.query;
    let sql = `
      SELECT platform_name, transaction_reference, client_code, client_name,
             invoice_number, transaction_date, amount, transaction_type, status
      FROM transactions_by_platform
    `;
    const params = [];
    if (platform && platform.trim()) {
      sql += ` WHERE platform_name = ?`;
      params.push(platform.trim());
    }
    sql += ` ORDER BY transaction_date DESC`;

    const result = await executeQuery(sql, params);
    if (!result.success) {
      return res.status(500).json({ success:false, message:'Error al obtener transacciones por plataforma', error: result.message });
    }
    res.json({ success:true, data: result.data, count: result.data.length, filter: platform?.trim() || null });
  } catch (error) {
    console.error('Error en /api/reports/transactions-by-platform:', error);
    res.status(500).json({ success:false, message:'Error interno del servidor', error: error.message });
  }
});

module.exports = router;
