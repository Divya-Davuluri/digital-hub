import { Router } from 'express';
import passport from 'passport';
import { 
  register, login, refresh, setup2FA, verify2FA, validate2FA, 
  forgotPassword, resetPassword, 
  reset2FARequest, reset2FAConfirm,
  updateProfile,
  disable2FA_Dev, generateTokens
} from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// --- Local Auth ---
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/update-profile', authMiddleware, updateProfile);

// --- 2FA ---
router.post('/2fa/setup', authMiddleware, setup2FA);
router.post('/2fa/verify', authMiddleware, verify2FA);
router.post('/2fa/validate', validate2FA);

// --- Recovery ---
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/forgot-2fa-request', reset2FARequest);
router.post('/forgot-2fa-confirm', reset2FAConfirm);

// --- OAuth ---
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), async (req: any, res) => {
  const { id, twoFactorEnabled } = req.user;
  if (twoFactorEnabled) {
    return res.redirect(`http://localhost:3000/login?2fa_required=true&userId=${id}`);
  }
  const { token, refreshToken } = await generateTokens(id);
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  const userData = encodeURIComponent(JSON.stringify({ id: user?.id, email: user?.email, name: user?.name }));
  res.redirect(`http://localhost:3000/login?token=${token}&refreshToken=${refreshToken}&user=${userData}`);
});

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), async (req: any, res) => {
  const { id, twoFactorEnabled } = req.user;
  if (twoFactorEnabled) {
    return res.redirect(`http://localhost:3000/login?2fa_required=true&userId=${id}`);
  }
  const { token, refreshToken } = await generateTokens(id);
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  const userData = encodeURIComponent(JSON.stringify({ id: user?.id, email: user?.email, name: user?.name }));
  res.redirect(`http://localhost:3000/login?token=${token}&refreshToken=${refreshToken}&user=${userData}`);
});

// --- Dev ---
router.post('/dev/disable-2fa', disable2FA_Dev);

export default router;
