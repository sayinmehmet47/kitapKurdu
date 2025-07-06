import { FC, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { LoadingSpinner } from '@/components/ui/loading';
import Layout from '@/components/Layout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiBaseUrl } from '@/redux/common.api';

// Types
interface ResendFormData {
  email: string;
}

// Form validation schema
const resendSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const VERIFICATION_STATUS = {
  VERIFYING: 'verifying',
  SUCCESS: 'success',
  ERROR: 'error',
  RESEND: 'resend',
} as const;

const EmailVerificationPage: FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>(VERIFICATION_STATUS.VERIFYING);
  const [message, setMessage] = useState<string>('');
  const [isResending, setIsResending] = useState<boolean>(false);

  // Resend form
  const resendForm = useForm<ResendFormData>({
    resolver: zodResolver(resendSchema),
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      verifyEmail(token);
    } else {
      setStatus(VERIFICATION_STATUS.RESEND);
      setMessage('No verification token provided');
    }
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await axios.get(
        `${apiBaseUrl}/user/verify-email/${token}`
      );

      if (response.data) {
        setStatus(VERIFICATION_STATUS.SUCCESS);
        setMessage(
          'Your email has been verified successfully! You can now sign in.'
        );
        toast.success('Email verified successfully!');
      }
    } catch (error: unknown) {
      setStatus(VERIFICATION_STATUS.ERROR);
      setMessage(
        (error as any).response?.data?.error ||
          'Verification failed. The link may be invalid or expired.'
      );
      toast.error('Email verification failed');
    }
  };

  const handleResendVerification = async (data: ResendFormData) => {
    setIsResending(true);
    try {
      await axios.post(`${apiBaseUrl}/user/resend-verification`, {
        email: data.email,
      });

      toast.success('Verification email sent! Please check your inbox.');
      setMessage(
        'A new verification email has been sent to your email address.'
      );
    } catch (error: unknown) {
      toast.error(
        (error as any).response?.data?.error ||
          'Failed to send verification email'
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const renderContent = () => {
    switch (status) {
      case VERIFICATION_STATUS.VERIFYING:
        return (
          <div className="text-center space-y-4">
            <LoadingSpinner size={48} className="mx-auto" />
            <p className="text-muted-foreground">Verifying your email...</p>
          </div>
        );

      case VERIFICATION_STATUS.SUCCESS:
        return (
          <div className="text-center space-y-4">
            <div className="rounded-full h-12 w-12 bg-green-100 text-green-600 flex items-center justify-center mx-auto">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600">
                Email Verified!
              </h3>
              <p className="text-muted-foreground mt-2">{message}</p>
            </div>
            <Button onClick={handleGoToLogin} className="w-full">
              Go to Sign In
            </Button>
          </div>
        );

      case VERIFICATION_STATUS.ERROR:
        return (
          <div className="text-center space-y-4">
            <div className="rounded-full h-12 w-12 bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-600">
                Verification Failed
              </h3>
              <p className="text-muted-foreground mt-2">{message}</p>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setStatus(VERIFICATION_STATUS.RESEND)}
                className="w-full"
              >
                Resend Verification Email
              </Button>
              <Button
                variant="ghost"
                onClick={handleGoToLogin}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        );

      case VERIFICATION_STATUS.RESEND:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">
                Resend Verification Email
              </h3>
              <p className="text-muted-foreground mt-2">
                Enter your email address and we'll send you a new verification
                link.
              </p>
            </div>

            <Form {...resendForm}>
              <form
                onSubmit={resendForm.handleSubmit(handleResendVerification)}
                className="space-y-4"
              >
                <FormField
                  control={resendForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          {...field}
                          disabled={isResending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isResending}>
                  {isResending ? 'Sending...' : 'Send Verification Email'}
                </Button>
              </form>
            </Form>

            <div className="text-center">
              <Button variant="ghost" onClick={handleGoToLogin}>
                Back to Sign In
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              Email Verification
            </CardTitle>
            <CardDescription className="text-center">
              Verify your email address to activate your account
            </CardDescription>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EmailVerificationPage;
