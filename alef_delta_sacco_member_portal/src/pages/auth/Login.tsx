// Login Page
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const loginSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
      remember: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.phone, data.password, data.remember || false);
      
      // Check for pending loan request and auto-submit
      const pendingRequest = localStorage.getItem('pendingLoanRequest');
      if (pendingRequest) {
        try {
          const requestData = JSON.parse(pendingRequest);
          await api.public.createLoanRequest({
            loan_purpose: requestData.loan_purpose,
            other_purpose: requestData.other_purpose,
            requested_amount: parseFloat(requestData.requested_amount),
          });
          localStorage.removeItem('pendingLoanRequest');
          toast({
            title: 'Loan Request Submitted',
            description: 'Your loan request has been automatically submitted after login.',
          });
          navigate('/loan-request?submitted=true');
          return;
        } catch (error) {
          console.error('Failed to auto-submit loan request:', error);
          // Continue to dashboard even if auto-submit fails
        }
      }
      
      toast({
        title: 'Welcome back!',
        description: 'Successfully logged in.',
      });
      
      // Check for redirect parameter
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect');
      navigate(redirect || '/client/dashboard');
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-16 pb-8 px-6 text-center"
      >
        {/* Logo */}
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary-hover shadow-glow-primary flex items-center justify-center">
          <span className="text-3xl font-bold text-primary-foreground font-display">AD</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">ALEF-DELTA SACCO</h1>
        <p className="text-muted-foreground">Member Portal</p>
      </motion.div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 bg-card rounded-t-3xl shadow-lg -mt-2 px-6 pt-8 pb-safe"
      >
        <h2 className="text-xl font-semibold text-center mb-6">{t('login')}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-sm mx-auto">
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">{t('phone')}</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+251..."
                className="pl-10"
                {...register('phone')}
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" {...register('remember')} />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                {t('remember_device')}
              </Label>
            </div>
            <Link
              to="/auth/request-reset"
              className="text-sm text-primary hover:underline"
            >
              {t('forgot_password')}
            </Link>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-primary hover:bg-primary-hover text-lg font-semibold"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              t('login')
            )}
          </Button>

          {/* Info Note */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              Use your registered phone number and password (min. 6 characters)
            </p>
          </div>

          {/* Register Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/auth/register" className="text-primary hover:underline font-medium">
                Register as Member
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
