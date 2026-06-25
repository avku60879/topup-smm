import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

// Import Route modules
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import orderRoutes from './routes/orders.js';
import affiliateRoutes from './routes/affiliate.js';
import ticketRoutes from './routes/tickets.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB Database
let isDbConnected = false;
connectDB().then((connected) => {
  isDbConnected = connected;
  app.locals.isDbConnected = isDbConnected;
});

// Resilient Mockup Storage
app.locals.mockDb = {
  users: [],
  orders: [],
  transactions: [],
  tickets: []
};

// API Route mounting
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/tickets', ticketRoutes);

// Serve static frontend files from Vite 'dist' folder
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve React app
app.get('*', (req, res) => {
  if (!req.url.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  TopBoost Pro Clone backend running on port ${PORT} `);
  console.log(`=================================================`);
});
