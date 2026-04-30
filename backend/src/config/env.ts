import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const requiredEnvs = [
  'JWT_SECRET',
  'REFRESH_SECRET',
  'SESSION_SECRET',
  'TURSO_DATABASE_URL',
  'TURSO_AUTH_TOKEN'
];

// Only enforce strict validation in production or if not in CI
if (process.env.NODE_ENV === 'production' || !process.env.CI) {
  requiredEnvs.forEach((env) => {
    if (!process.env[env]) {
      throw new Error(`❌ Missing required environment variable: ${env}`);
    }
  });

  // Strict check for Turso in Production
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      throw new Error('❌ PRODUCTION ERROR: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in production!');
    }
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://digital-hub-3h88.onrender.com',
  frontendUrl: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://digital-hub-1.onrender.com' 
    : 'http://localhost:3000'),
  jwtSecret: process.env.JWT_SECRET as string,
  refreshSecret: process.env.REFRESH_SECRET as string,
  sessionSecret: process.env.SESSION_SECRET as string,
  database: {
    url: process.env.TURSO_DATABASE_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN as string,
  },
  isProduction: process.env.NODE_ENV === 'production',
};
