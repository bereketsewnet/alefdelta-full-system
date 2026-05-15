// Landing Page - Sign-in Chooser
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Wallet, CreditCard, Bell } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { parseDeepLink, getTargetRoute } from '@/lib/deeplink';

const features = [
  { icon: Wallet, title: 'Track Savings', description: 'Monitor all your accounts in real-time' },
  { icon: CreditCard, title: 'Manage Loans', description: 'View loan details and make repayments' },
  { icon: Bell, title: 'Stay Informed', description: 'Get notifications on your account activity' },
  { icon: Shield, title: 'Secure Access', description: 'Bank-level security for your data' },
];

export default function Index() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  // Handle deep links from Telegram bot
  useEffect(() => {
    const params = parseDeepLink(searchParams.toString());
    if (params.chat_id || params.member_id) {
      // If authenticated, redirect to target view
      if (isAuthenticated) {
        navigate(getTargetRoute(params));
      }
      // Otherwise, store params and redirect after login
    }
  }, [searchParams, isAuthenticated, navigate]);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/client/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-lg mx-auto px-6 pt-16 pb-12 text-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary to-primary-hover shadow-glow-primary flex items-center justify-center">
              <span className="text-4xl font-bold text-primary-foreground font-display">AD</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-2 font-display">
              ALEF-DELTA SACCO
            </h1>
            <p className="text-lg text-muted-foreground">
              Member Portal
            </p>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-muted-foreground"
          >
            Access your savings, track loans, and manage your finances securely from anywhere.
          </motion.p>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-lg mx-auto px-6 pb-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="bg-card rounded-xl border border-border/50 p-4 text-center"
            >
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <Link to="/auth/login" className="block">
            <Button className="w-full h-14 text-lg bg-primary hover:bg-primary-hover shadow-glow-primary font-semibold gap-2">
              Sign In to Your Account
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/auth/register" className="text-primary hover:underline">
              Register online
            </Link>
            {' '}or visit your nearest branch.
          </p>
          
          {/* Public Services */}
          <div className="mt-4 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground text-center">Public Services</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/loan-request" className="block">
                <Button variant="outline" className="w-full h-12 text-base">
                  Loan Request
                </Button>
              </Link>
              <Link to="/partner-registration" className="block">
                <Button variant="outline" className="w-full h-12 text-base">
                  Partner Registration
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="max-w-lg mx-auto px-6 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          © 2025 ALEF-DELTA SACCO. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Secure • Trusted • Member-owned
        </p>
      </footer>
    </div>
  );
}
