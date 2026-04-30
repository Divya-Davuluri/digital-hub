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
import clientRoutes from './routes/clientRoutes';
import brandingRoutes from './routes/brandingRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportRoutes from './routes/reportRoutes';
import documentRoutes from './routes/documentRoutes';
import rateLimit from 'express-rate-limit';
import { tenantMiddleware } from './middleware/tenantMiddleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Trust proxy is required for secure cookies and correct OAuth redirects behind Render's load balancer
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased for development
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Passport configuration
configurePassport();

// Middleware
app.use(cors({
  origin: true, // Allow all origins for debugging, will tighten later
  credentials: true
}));
app.use(express.json());
app.use(tenantMiddleware);
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

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    env: process.env.NODE_ENV,
    db: process.env.TURSO_DATABASE_URL ? 'turso' : 'local'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/documents', documentRoutes);

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 BACKEND READY: Server running on http://localhost:${PORT}`);
});
