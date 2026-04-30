import express, { Request, Response } from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { config } from './config/env';
import { corsOptions } from './config/cors';
import { getCookieOptions } from './config/cookies';
import { configurePassport } from './config/passport';
import { tenantMiddleware } from './middleware/tenantMiddleware';

import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import agencyRoutes from './routes/agencyRoutes';
import taskRoutes from './routes/taskRoutes';
import clientRoutes from './routes/clientRoutes';
import brandingRoutes from './routes/brandingRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportRoutes from './routes/reportRoutes';
import documentRoutes from './routes/documentRoutes';

const app = express();

// Trust proxy is required for secure cookies and correct OAuth redirects behind Render's load balancer
app.set('trust proxy', 1);

// Passport configuration
configurePassport();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Tenant Detection
app.use(tenantMiddleware);

app.use('/api', limiter);

// Session configuration using our cookie helper
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: 'dmh.sid',
  cookie: getCookieOptions(7), // 7 days
}));

app.use(passport.initialize());
app.use(passport.session());

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('Digital Marketing Hub API is running');
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    env: config.nodeEnv,
    port: config.port
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

// Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[SERVER_ERROR]', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: config.isProduction ? {} : err
  });
});

// Start server
app.listen(config.port, '0.0.0.0', () => {
  console.log(`🚀 BACKEND READY: Server running on port ${config.port} in ${config.nodeEnv} mode`);
});
