import { Router } from 'express';
import passport from 'passport';
import { 
  register, login, refresh, setup2FA, verify2FA, validate2FA, 
  forgotPassword, resetPassword, 
  reset2FARequest, reset2FAConfirm,
  updateProfile,
  disable2FA_Dev, generateTokens,
  inviteUser, checkInvitation
} from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { config } from '../config/env';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// --- Safety Validation Helper ---
const safeAttach = (method: 'get' | 'post' | 'put' | 'delete', path: string, ...handlers: any[]) => {
  handlers.forEach(handler => {
    if (typeof handler !== 'function') {
      throw new Error(`Invalid route handler for ${method.toUpperCase()} ${path}: Expected function but got ${typeof handler}. Ensure the controller is properly exported.`);
    }
  });
  (router as any)[method](path, ...handlers);
};

// --- Local Auth ---
safeAttach('post', '/register', register);
safeAttach('post', '/login', login);
safeAttach('post', '/refresh', refresh);
safeAttach('post', '/update-profile', authMiddleware, updateProfile);
safeAttach('post', '/invite', authMiddleware, inviteUser);
safeAttach('get', '/check-invite', checkInvitation);

// --- 2FA ---
safeAttach('post', '/2fa/setup', authMiddleware, setup2FA);
safeAttach('post', '/2fa/verify', authMiddleware, verify2FA);
safeAttach('post', '/2fa/validate', validate2FA);

// --- Recovery ---
safeAttach('post', '/forgot-password', forgotPassword);
safeAttach('post', '/reset-password', resetPassword);
safeAttach('post', '/forgot-2fa-request', reset2FARequest);
safeAttach('post', '/forgot-2fa-confirm', reset2FAConfirm);

// --- OAuth ---
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), async (req: any, res) => {
  const { id, twoFactorEnabled } = req.user;
  if (twoFactorEnabled) {
    return res.redirect(`${config.frontendUrl}/login?2fa_required=true&userId=${id}`);
  }
  
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  const { token, refreshToken } = await generateTokens(id, user?.role || 'admin', user?.tenantId || '');
  
  const userData = encodeURIComponent(JSON.stringify({ id: user?.id, email: user?.email, name: user?.name }));
  res.redirect(`${config.frontendUrl}/login?token=${token}&refreshToken=${refreshToken}&user=${userData}`);
});

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), async (req: any, res) => {
  const { id, twoFactorEnabled } = req.user;
  if (twoFactorEnabled) {
    return res.redirect(`${config.frontendUrl}/login?2fa_required=true&userId=${id}`);
  }
  
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  const { token, refreshToken } = await generateTokens(id, user?.role || 'admin', user?.tenantId || '');
  
  const userData = encodeURIComponent(JSON.stringify({ id: user?.id, email: user?.email, name: user?.name }));
  res.redirect(`${config.frontendUrl}/login?token=${token}&refreshToken=${refreshToken}&user=${userData}`);
});

// --- Dev ---
safeAttach('post', '/dev/disable-2fa', disable2FA_Dev);

export default router;
