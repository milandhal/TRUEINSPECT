const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { testConnection } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const repairCostRoutes = require('./routes/repairCostRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server (default port 5173) and production
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded inspection images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health & System Status Endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.status(200).json({
    status: 'ok',
    app: 'TRUEINSPECT Backend API',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/repair-costs', repairCostRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`=======================================================`);
  console.log(`  TRUEINSPECT Backend Service running on port ${PORT}`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`=======================================================`);

  const dbStatus = await testConnection();
  if (dbStatus.success) {
    console.log(`[Database] ${dbStatus.message}`);
  } else {
    console.warn(`[Database Notice] ${dbStatus.message}`);
    console.warn(`[Database Error] ${dbStatus.error}`);
    console.warn(`Please ensure MySQL is running and execute database/schema.sql in MySQL Workbench.`);
  }
});

module.exports = app;
