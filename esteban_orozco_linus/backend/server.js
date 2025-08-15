const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const clientsRouter = require('./routes/clients');
const reportsRouter = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS desde .env (coma-separado)
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Postman/Insomnia
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, '../frontend')));

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Health
app.get('/api/health', async (_req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      success: true,
      message: 'Financial Data Management System API',
      status: 'healthy',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Health check failed', error: error.message });
  }
});

// Rutas requeridas 
app.use('/api/clients', clientsRouter);
app.use('/api/reports', reportsRouter);


async function startServer() {
  try {
    const ok = await testConnection();
    if (!ok) {
      console.error('❌ No se pudo conectar a la base de datos. Revisa tu configuración y que MySQL esté corriendo.');
      process.exit(1);
    }
    app.listen(PORT, () => {
      console.log('🚀 Financial Data Management System Server');
      console.log('==========================================');
      console.log(`📡 Server on port: ${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      console.log(`💾 Database: ${process.env.DB_NAME || 'db_esteban_orozco_linus'} (connected)`);
      console.log('==========================================\n');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Apagado elegante y errores no controlados
process.on('SIGINT', () => { console.log('\n🛑 Shutting down server gracefully (SIGINT)...'); process.exit(0); });
process.on('SIGTERM', () => { console.log('\n🛑 Shutting down server gracefully (SIGTERM)...'); process.exit(0); });
process.on('uncaughtException', (e) => { console.error('❌ Uncaught Exception:', e); process.exit(1); });
process.on('unhandledRejection', (r, p) => { console.error('❌ Unhandled Rejection at:', p, 'reason:', r); process.exit(1); });

startServer();

