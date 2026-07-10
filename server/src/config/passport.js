import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import { getJwtSecret } from '../utils/adminAuth.js';

const getClientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';
const getBackendUrl = () => (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
const defaultCallbackUrl = `${getBackendUrl()}/api/auth/google/callback`;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || defaultCallbackUrl,
  passReqToCallback: false
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value?.trim().toLowerCase();
    if (!email) {
      return done(new Error('Google account did not return an email address.'));
    }

    if (profile.emails?.[0]?.verified === false) {
      return done(new Error('Google email is not verified.'));
    }

    const profileImage = profile.photos?.[0]?.value || '';
    const displayName = profile.displayName || profile.name?.givenName || email.split('@')[0];

    let user = await User.findOne({ email });

    if (user) {
      const updates = {};
      if (!user.googleId) updates.googleId = profile.id;
      if (!user.provider || user.provider === 'email') updates.provider = 'google';
      if (!user.profileImage && profileImage) updates.profileImage = profileImage;
      if (!user.name && displayName) updates.name = displayName;

      if (Object.keys(updates).length > 0) {
        user = await User.findByIdAndUpdate(user._id, updates, { new: true });
      }
      return done(null, user, { isNewUser: false });
    }

    const randomPassword = crypto.randomBytes(24).toString('hex');
    user = await User.create({
      name: displayName,
      email,
      password: randomPassword,
      profileImage,
      googleId: profile.id,
      provider: 'google'
    });

    return done(null, user, { isNewUser: true });
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export const generateGoogleAuthToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  getJwtSecret(),
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

export const getGoogleCallbackRedirectUrl = () => `${getClientUrl()}/auth/google/callback`;

export default passport;
