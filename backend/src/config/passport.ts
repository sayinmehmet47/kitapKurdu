import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
} from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import passport from 'passport';
import { Request } from 'express';
import { User } from '../../models/User';
import { comparePassword } from '../../utils/bcrypt.util';
import { verifyRefreshToken } from '../../utils/jwt.utils';
import { logger } from '../../logger';

const cookieExtractor = (req: Request): string | null => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['accessToken'];
  }
  return token;
};

const opts: StrategyOptions = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.ACCESS_TOKEN_SECRET_KEY || '',
};

// Local Strategy for username/password authentication
passport.use(
  new LocalStrategy(
    {
      usernameField: 'username', // can be username or email
      passwordField: 'password',
    },
    async (usernameOrEmail: string, password: string, done) => {
      try {
        // Allow login with either username or email
        const user = await User.findOne({
          $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
        });

        if (!user || !user.password) {
          logger.error(`Login attempt failed for: ${usernameOrEmail}`);
          return done(null, false, { message: 'Invalid credentials' });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
          logger.error(`Invalid password for: ${usernameOrEmail}`);
          return done(null, false, { message: 'Invalid credentials' });
        }

        // Check if email is verified (only for users with passwords, not OAuth users)
        if (!user.isEmailVerified && user.password && !user.googleId) {
          return done(null, false, {
            message: 'Please verify your email address before signing in',
          });
        }

        logger.info(`User ${usernameOrEmail} logged in successfully`);
        return done(null, user);
      } catch (error) {
        logger.error(
          `Unexpected error during login for: ${usernameOrEmail}:`,
          error
        );
        return done(error);
      }
    }
  )
);

// JWT Strategy for token authentication
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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
      callbackURL: '/api/user/auth/google/callback',
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

// Custom Refresh Token Strategy
class RefreshTokenStrategy {
  name = 'refresh-token';

  authenticate(req: Request) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!refreshToken) {
        return this.fail({ message: 'Refresh token is required' }, 400);
      }

      const decoded = verifyRefreshToken(refreshToken) as any;

      // Find user by ID from token
      User.findById(decoded._id)
        .then((user) => {
          if (!user) {
            return this.fail({ message: 'User not found' }, 404);
          }
          return this.success(user);
        })
        .catch((error) => {
          logger.error('Refresh token verification error:', error);
          return this.error(error);
        });
    } catch (error: any) {
      logger.error('Refresh token error:', error);

      if (error.name === 'JsonWebTokenError') {
        return this.fail(
          { message: 'Invalid refresh token. Please login again.' },
          401
        );
      }
      if (error.name === 'TokenExpiredError') {
        return this.fail(
          { message: 'Refresh token expired. Please login again.' },
          401
        );
      }

      return this.fail({ message: 'Authentication failed' }, 401);
    }
  }

  success(user: any) {
    // This will be overridden by passport
  }

  fail(challenge: any, status?: number) {
    // This will be overridden by passport
  }

  error(err: any) {
    // This will be overridden by passport
  }
}

passport.use('refresh-token', new RefreshTokenStrategy() as any);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
