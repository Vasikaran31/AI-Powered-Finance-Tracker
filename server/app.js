import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173'
];

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin(origin, callback) {
    // In development, allow all origins (needed for tunneling tools like ngrok, localtunnel, etc.)
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    // Allow Render URLs and configured origins
    if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-finance-tracker');
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Serve client build in production
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Catch-all: serve index.html for client-side routing (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong'
  });
});

export default app;
