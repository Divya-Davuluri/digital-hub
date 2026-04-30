import { CookieOptions } from 'express';
import { config } from './env';

export const getCookieOptions = (expiresInDays: number = 7): CookieOptions => {
  return {
    httpOnly: true,
    secure: config.isProduction, // true on Render, false on Localhost
    sameSite: config.isProduction ? 'none' : 'lax', // 'none' for cross-domain production, 'lax' for local
    maxAge: expiresInDays * 24 * 60 * 60 * 1000, // Convert days to milliseconds
    path: '/',
  };
};
