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

requiredEnvs.forEach((env) => {
  if (!process.env[env]) {
    throw new Error(`❌ Missing required environment variable: ${env}`);
  }
});

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://digital-hub.onrender.com' 
    : 'http://localhost:5001'),
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
