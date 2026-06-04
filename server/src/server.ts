import express from 'express';
// Trigger reload comment
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environmental variables
dotenv.config();

// Routers
import authRoutes from './routes/auth';
import leadRoutes from './routes/leads';
import customerRoutes from './routes/customers';
import taskRoutes from './routes/tasks';
import notificationRoutes from './routes/notifications';
import reportRoutes from './routes/reports';
import userRoutes from './routes/users';
import searchRoutes from './routes/search';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/enterprise-crm';

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Security: Rate limiter for APIs (especially auth login/register)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 15000 : 300, // Limit each IP to 300 requests in production, 15000 in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 100, // Limit each IP to 100 requests in production, 5000 in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again in 15 minutes' }
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Dynamically allow the request origin to support credentials (CORS wildcard restriction bypass)
    callback(null, true);
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition'] // To allow downloading Excel/CSVs
}));
app.use(express.json());

// Routes mapping
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/leads', apiLimiter, leadRoutes);
app.use('/api/customers', apiLimiter, customerRoutes);
app.use('/api/tasks', apiLimiter, taskRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/reports', apiLimiter, reportRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/search', apiLimiter, searchRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Uncaught Error:', err);
  res.status(err.status || 500).json({ 
    message: err.message || 'An unexpected error occurred on the server',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  });
});

// Database connection & Startup
console.log('Connecting to database...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    app.listen(PORT, () => {
      console.log(`CRM Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB database connection failure:', err);
    console.log('Falling back to starting server without database for offline UI preview...');
    
    // We start the server anyway so the user's frontend doesn't crash if they run it offline
    app.listen(PORT, () => {
      console.log(`CRM Backend running in OFFLINE mode on port ${PORT}`);
    });
  });
