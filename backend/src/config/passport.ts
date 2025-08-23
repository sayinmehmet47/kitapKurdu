import {
  Strategy as JwtStrategy,
  StrategyOptions,
  ExtractJwt,
} from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';
import { Request } from 'express';
import { User } from '../../models/User';
import { comparePassword } from '../../utils/bcrypt.util';

const cookieExtractor = (req: Request): string | null => {
  if (req?.cookies?.['accessToken']) return req.cookies['accessToken'];
  // Fallback: allow access token from query/hash relay (e.g., /auth?at=...)
  // Note: only used in immediate redirect flow; regular auth uses cookies
  const atParam = (req.query?.at as string) || undefined;
  return atParam || null;
};

const refreshTokenExtractor = (req: Request): string | null => {
  // Debug logging only in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('[REFRESH TOKEN EXTRACTOR] Extracting token from:', {
      hasCookie: !!req?.cookies?.['refreshToken'],
      hasQueryParam: !!req.query?.rt
    });
  }
  
  if (req?.cookies?.['refreshToken']) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[REFRESH TOKEN EXTRACTOR] Found refresh token in cookies');
    }
    return req.cookies['refreshToken'];
  }
  const rtParam = (req.query?.rt as string) || undefined; // optional fallback
  if (process.env.NODE_ENV !== 'production') {
    if (rtParam) {
      console.log('[REFRESH TOKEN EXTRACTOR] Found refresh token in query params');
    } else {
      console.log('[REFRESH TOKEN EXTRACTOR] No refresh token found');
    }
  }
  return rtParam || null;
};

// Also allow Authorization: Bearer <token> as a fallback (helps Safari flows)
const bearerExtractor = (req: Request): string | null => {
  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
};

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    (req) => cookieExtractor(req as Request),
    (req) => bearerExtractor(req as Request),
  ]),
  secretOrKey: process.env.ACCESS_TOKEN_SECRET_KEY || '',
};

// JWT Strategy for access token authentication
passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      // For stateless JWT, trust the verified payload instead of DB lookup
      // The JWT is already verified by passport-jwt, so payload is trusted
      const user = {
        _id: jwt_payload._id,
        username: jwt_payload.username,
        email: jwt_payload.email,
        isAdmin: jwt_payload.isAdmin || false,
      };
      
      return done(null, user);
      
      // Note: Only uncomment below if you need fresh user data from DB
      // This adds latency to every request but ensures data is current
      // const dbUser = await User.findById(jwt_payload._id);
      // if (dbUser) {
      //   return done(null, dbUser);
      // }
      // return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Local Strategy for email/password authentication
passport.use(
  new LocalStrategy(
    {
      usernameField: 'username', // Can be username or email
      passwordField: 'password',
    },
    async (username, password, done) => {
      try {
        // Allow login with either username or email
        const user = await User.findOne({
          $or: [{ username: username }, { email: username }],
        });

        if (!user || !user.password) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        if (user.isEmailVerified === false && user.password && !user.googleId) {
          return done(null, false, {
            message: 'Please verify your email address before signing in',
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Custom Refresh Token Strategy
passport.use(
  'refresh-token',
  new JwtStrategy(
    {
      jwtFromRequest: refreshTokenExtractor,
      secretOrKey: process.env.REFRESH_TOKEN_SECRET_KEY || '',
    },
    async (jwt_payload, done) => {
      try {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[REFRESH TOKEN STRATEGY] JWT payload received:', { userId: jwt_payload._id, exp: jwt_payload.exp });
        }
        
        const user = await User.findById(jwt_payload._id);
        if (user) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[REFRESH TOKEN STRATEGY] User found in database:', { userId: user._id, username: user.username });
          }
          return done(null, user);
        }
        if (process.env.NODE_ENV !== 'production') {
          console.log('[REFRESH TOKEN STRATEGY] User not found in database for ID:', jwt_payload._id);
        }
        return done(null, false, { message: 'Invalid refresh token' });
      } catch (error) {
        console.error('[REFRESH TOKEN STRATEGY] Database error:', error);
        return done(error, false);
      }
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',

      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        (process.env.NODE_ENV === 'production'
          ? `${process.env.SERVER_URL}/api/user/auth/google/callback`
          : 'http://localhost:5000/api/user/auth/google/callback'),
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.findOne({ email: profile.emails?.[0].value });
        }

        if (!user) {
          user = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails?.[0].value,
            isEmailVerified: true, // Google has already verified the email
          });
          await user.save();
        } else if (!user.isEmailVerified) {
          // If user exists but email not verified, verify it now since Google confirmed it
          user.isEmailVerified = true;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Note: No session serialization needed for stateless JWT authentication
// passport.serializeUser/deserializeUser are only required for session-based auth

export default passport;
