// Propósito: Crear pool de conexiones y funciones utilitarias 
// para consultas y transacciones, siempre con placeholders.

// backend/config/database.js (Importa mysql2/promise y .env.)
const mysql = require('mysql2/promise');
require('dotenv').config();






const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_esteban_orozco_linus', 
  port: Number(process.env.DB_PORT || 3306),

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  connectTimeout: 10000,
  charset: 'utf8mb4',
  multipleStatements: false,
};
// Lee configuración de BD con defaults sensatos.

const pool = mysql.createPool(dbConfig);

async function testConnection() {
  try {
    const cn = await pool.getConnection();
    console.log(`✅ Database connected: ${dbConfig.database}`);
    cn.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function executeQuery(query, params = []) {
  try {
    const [rows] = await pool.execute(query, params);
    return { success: true, data: rows };
  } catch (error) {
    const isDuplicate = error.code === 'ER_DUP_ENTRY';
    const isFK =
      error.code === 'ER_ROW_IS_REFERENCED_2' ||
      error.code === 'ER_NO_REFERENCED_ROW_2';

    console.error('SQL Error:', {
      code: error.code,
      sqlState: error.sqlState,
      message: error.sqlMessage || error.message,
    });

    return {
      success: false,
      code: error.code,
      sqlState: error.sqlState,
      message: error.sqlMessage || error.message,
      isDuplicate,
      isFK,
    };
  }
}

async function executeTransaction(queries = []) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const results = [];
    for (const q of queries) {
      const [rows] = await connection.execute(q.sql, q.params || []);
      results.push(rows);
    }

    await connection.commit();
    return { success: true, data: results };
  } catch (error) {
    await connection.rollback();

    const isDuplicate = error.code === 'ER_DUP_ENTRY';
    const isFK =
      error.code === 'ER_ROW_IS_REFERENCED_2' ||
      error.code === 'ER_NO_REFERENCED_ROW_2';

    console.error('TX Error:', {
      code: error.code,
      sqlState: error.sqlState,
      message: error.sqlMessage || error.message,
    });

    return {
      success: false,
      code: error.code,
      sqlState: error.sqlState,
      message: error.sqlMessage || error.message,
      isDuplicate,
      isFK,
    };
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  testConnection,
  executeQuery,
  executeTransaction,
};


