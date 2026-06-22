require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { createLogger } = require('./utils/logger');

const logger = createLogger('Server');
const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cookieParser());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later.' }
}));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later.' }
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: msg => logger.http(msg.trim()) }
  }));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Royal Academy ERP API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/students',    require('./routes/students'));
app.use('/api/teachers',    require('./routes/teachers'));
app.use('/api/courses',     require('./routes/courses'));
app.use('/api/batches',     require('./routes/batches'));
app.use('/api/fees',        require('./routes/fees'));
app.use('/api/salary',      require('./routes/salary'));
app.use('/api/attendance',  require('./routes/attendance'));
app.use('/api/dashboard',   require('./routes/dashboard'));
app.use('/api/audit-logs',  require('./routes/auditLogs'));
app.use('/api/reports',     require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${err.message} - ${req.method} ${req.url}`);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─── Database Connection & Start ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI, {
  retryWrites: process.env.MONGODB_RETRY_WRITES === 'true',
  w: process.env.MONGODB_W || 'majority',
  journal: process.env.MONGODB_JOURNAL === 'true',
  maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
  minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 2,
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS) || 15000,
  socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS) || 45000,
  maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS) || 60000,
  heartbeatFrequencyMS: parseInt(process.env.MONGODB_HEARTBEAT_FREQUENCY_MS) || 10000,
  serverMonitoringMode: 'auto',
})
.then(() => {
  logger.info('✅ MongoDB connected successfully');
  app.listen(PORT, () => {
    logger.info(`🚀 Royal Academy ERP Server running on port ${PORT}`);
    logger.info(`📚 Environment: ${process.env.NODE_ENV}`);
  });
})
.catch(err => {
  logger.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(false, () => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app;
