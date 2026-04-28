import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, or, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const configurePassport = () => {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret',
    callbackURL: '/api/auth/google/callback',
    proxy: true
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0].value;
      if (!email) return done(new Error('No email found from Google'), undefined);

      let user = await db.query.users.findFirst({
        where: or(
          and(eq(users.providerId, profile.id), eq(users.provider, 'google')),
          eq(users.email, email)
        )
      });

      if (user) {
        if (user.provider !== 'google') {
          await db.update(users).set({ provider: 'google', providerId: profile.id }).where(eq(users.id, user.id));
        }
      } else {
        const userId = uuidv4();
        await db.insert(users).values({
          id: userId,
          name: profile.displayName,
          email: email,
          provider: 'google',
          providerId: profile.id,
          role: 'user'
        });
        user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      }

      return done(null, { id: user?.id, twoFactorEnabled: user?.twoFactorEnabled === 1 });
    } catch (error) {
      return done(error, undefined);
    }
  }));

  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID || 'your_facebook_app_id',
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'your_facebook_app_secret',
    callbackURL: '/api/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'emails'],
    proxy: true
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0].value;
      if (!email) return done(new Error('No email found from Facebook'), undefined);

      let user = await db.query.users.findFirst({
        where: or(
          and(eq(users.providerId, profile.id), eq(users.provider, 'facebook')),
          eq(users.email, email)
        )
      });

      if (user) {
        if (user.provider !== 'facebook') {
          await db.update(users).set({ provider: 'facebook', providerId: profile.id }).where(eq(users.id, user.id));
        }
      } else {
        const userId = uuidv4();
        await db.insert(users).values({
          id: userId,
          name: profile.displayName,
          email: email,
          provider: 'facebook',
          providerId: profile.id,
          role: 'user'
        });
        user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      }

      return done(null, { id: user?.id, twoFactorEnabled: user?.twoFactorEnabled === 1 });
    } catch (error) {
      return done(error, undefined);
    }
  }));

  passport.serializeUser((user: any, done) => done(null, user));
  passport.deserializeUser((user: any, done) => done(null, user));
};
