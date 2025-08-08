import { FC, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import { loginThunk, registerThunk } from '@/redux/authSlice';
import { RootState, useAppDispatch, useAppSelector } from '@/redux/store';

// Types
interface LoginFormData {
  username: string; // Can be username or email
  password: string;
}

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Form validation schemas
const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(20, 'Password must be at most 20 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const AUTH_TABS = {
  LOGIN: 'login',
  REGISTER: 'register',
} as const;

const AuthPage: FC = () => {
  const [activeTab, setActiveTab] = useState<string>(AUTH_TABS.LOGIN);
  const [showResendVerification, setShowResendVerification] =
    useState<boolean>(false);
  const [lastAttemptedEmail, setLastAttemptedEmail] = useState<string>('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/register') {
      setActiveTab(AUTH_TABS.REGISTER);
    } else {
      setActiveTab(AUTH_TABS.LOGIN);
    }
  }, [location.pathname]);

  const { isLoading } = useAppSelector((state: RootState) => state.authSlice);

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    try {
      setShowResendVerification(false);
      const result = await dispatch(loginThunk(data));
      if (result.meta.requestStatus === 'fulfilled') {
        toast.success('Login successful');
        navigate('/');
      } else {
        const errorMessage = (result.payload as string) || 'Login failed';
        if (errorMessage.includes('verify your email')) {
          setShowResendVerification(true);
          setLastAttemptedEmail(data.username);
          toast.error('Please verify your email address before signing in');
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      toast.error('Something went wrong during login');
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data;
      const result = await dispatch(registerThunk(registerData));
      if (result.meta.requestStatus === 'fulfilled') {
        toast.success(
          'Registration successful! Please check your email to verify your account.'
        );
        setActiveTab(AUTH_TABS.LOGIN);
        registerForm.reset();
      } else {
        toast.error((result.payload as string) || 'Registration failed');
      }
    } catch (error) {
      toast.error('Something went wrong during registration');
    }
  };

  const handleGoogleLogin = () => {
    const apiBaseUrl =
      process.env.REACT_APP_ENVIRONMENT === 'production'
        ? process.env.REACT_APP_PROD_API // Use absolute backend URL so Set-Cookie binds to backend domain
        : process.env.REACT_APP_ENVIRONMENT === 'development'
        ? process.env.REACT_APP_DEV_API
        : process.env.REACT_APP_LOCAL_API;

    window.location.href = `${apiBaseUrl}/user/auth/google`;
  };

  const handleResendVerification = async () => {
    try {
      const emailToUse = registerForm.getValues('email') || lastAttemptedEmail;

      if (!emailToUse) {
        toast.error('Please enter your email address first');
        return;
      }

      // Use the same environment-aware API base URL
      const apiBaseUrl =
        process.env.REACT_APP_ENVIRONMENT === 'production'
          ? process.env.REACT_APP_PROD_API
          : process.env.REACT_APP_ENVIRONMENT === 'development'
          ? process.env.REACT_APP_DEV_API
          : process.env.REACT_APP_LOCAL_API;

      const response = await fetch(`${apiBaseUrl}/user/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToUse }),
      });

      if (response.ok) {
        toast.success('Verification email sent! Please check your inbox.');
        setShowResendVerification(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send verification email');
      }
    } catch (error) {
      toast.error('Failed to send verification email');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value={AUTH_TABS.LOGIN}>Sign In</TabsTrigger>
                <TabsTrigger value={AUTH_TABS.REGISTER}>Sign Up</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value={AUTH_TABS.LOGIN} className="space-y-4">
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(handleLogin)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username or Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your username or email"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </Form>

                {showResendVerification && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800 mb-2">
                      Your email address hasn't been verified yet.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResendVerification}
                      className="w-full"
                    >
                      Resend Verification Email
                    </Button>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value={AUTH_TABS.REGISTER} className="space-y-4">
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(handleRegister)}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Choose a username"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Choose a password"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirm your password"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="text-xs text-muted-foreground">
                      By creating an account, you agree to our{' '}
                      <span className="underline underline-offset-4 cursor-pointer">
                        Terms of Service
                      </span>{' '}
                      and{' '}
                      <span className="underline underline-offset-4 cursor-pointer">
                        Privacy Policy
                      </span>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AuthPage;
