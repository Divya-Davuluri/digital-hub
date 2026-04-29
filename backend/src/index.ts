import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import { configurePassport } from './config/passport';
import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import agencyRoutes from './routes/agencyRoutes';
import taskRoutes from './routes/taskRoutes';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy is required for secure cookies and correct OAuth redirects behind Render's load balancer
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Passport configuration
configurePassport();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5001',
      'https://digital-hub-frontend.onrender.com',
      'https://digital-hub-1.onrender.com' // Adding the user's new Render URL
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use('/api', limiter);
app.use(session({
  secret: process.env.SESSION_SECRET || 'digital-marketing-hub-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('API is running with Turso + Drizzle');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/tasks', taskRoutes);

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 BACKEND READY: Server running on http://localhost:${PORT}`);
});
