import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
} from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';
import { Request } from 'express';
import { User } from '../../models/User';
import { comparePassword } from '../../utils/bcrypt.util';

const cookieExtractor = (req: Request): string | null => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['accessToken'];
  }
  return token;
};

const refreshTokenExtractor = (req: Request): string | null => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['refreshToken'];
  }
  return token;
};

const opts: StrategyOptions = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.ACCESS_TOKEN_SECRET_KEY || '',
};

// JWT Strategy for access token authentication
passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const user = await User.findById(jwt_payload._id);
      if (user) {
        return done(null, user);
      }
      return done(null, false);
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
        const user = await User.findById(jwt_payload._id);
        if (user) {
          return done(null, user);
        }
        return done(null, false, { message: 'Invalid refresh token' });
      } catch (error) {
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

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
