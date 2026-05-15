import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { config } from './config/env';
import { getCookieOptions } from './config/cookies';
import { configurePassport } from './config/passport';
import { tenantMiddleware } from './middleware/tenantMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { sql } from 'drizzle-orm';
import { db } from './db';

// Import Routes
import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import agencyRoutes from './routes/agencyRoutes';
import teamRoutes from './routes/teamRoutes';
import projectRoutes from './routes/projectRoutes';
import clientRoutes from './routes/clientRoutes';
import brandingRoutes from './routes/brandingRoutes';
import adminBrandingRoutes from './routes/adminBrandingRoutes';
import adminRoutes from './routes/adminRoutes';
import onboardingRoutes from './routes/onboardingRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportRoutes from './routes/reportRoutes';
import documentRoutes from './routes/documentRoutes';
import settingsRoutes from './routes/settingsRoutes';
import campaignRoutes from './routes/campaignRoutes';
import automationRoutes from './routes/automationRoutes';
import clientPortalRoutes from './routes/clientPortalRoutes';
import assetRoutes from './routes/assetRoutes';
import analyticsRoutes from './routes/analytics';
import budgetRoutes from './routes/budget';
import attributionRoutes from './routes/attribution';
import socialRoutes from './routes/social';


import { authMiddleware, authorize } from './middleware/authMiddleware';

const app = express();

// --- Production Hardening ---
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
}));
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// --- Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Middleware Stack ---
app.use(cors({
  origin: [
    'https://digital-hub-1.onrender.com',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: [
    'GET', 'POST', 'PUT', 
    'PATCH', 'DELETE', 'OPTIONS'
  ],
  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ]
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(tenantMiddleware);
app.use('/api', limiter);

// --- Session & Auth ---
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: 'dmh.sid',
  cookie: getCookieOptions(7),
}));

configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// --- Health Checks ---
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ 
    success: true, 
    message: 'Digital Marketing Hub API',
    version: '1.0.0'
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    env: config.nodeEnv
  });
});

// --- API Route Mounting ---

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/branding', adminBrandingRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/client', clientPortalRoutes);
app.use('/api/assets', assetRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/attribution', attributionRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/budget', budgetRoutes);

// --- 404 & Error Handling ---
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use(errorHandler);

// --- Server Lifecycle ---
const server = app.listen(config.port, '0.0.0.0', async () => {
  console.log(`🚀 BACKEND READY: Port ${config.port} | Env: ${config.nodeEnv}`);
  
  // Verify DB Connectivity on start
  try {
    const result = await db.run(sql`SELECT 1`);
    console.log('✅ DATABASE CONNECTED: Latency check successful.');
  } catch (err: any) {
    console.error('❌ DATABASE CONNECTION FAILED:', err.message);
  }
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
  });
});
