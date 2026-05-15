// Member Dashboard Page
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, CreditCard, FileText, Bell, ChevronRight, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { KPIHeader } from '@/components/KPIHeader';
import { TransactionRow } from '@/components/TransactionRow';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

const quickActions = [
  { icon: Wallet, label: 'Accounts', path: '/client/accounts', color: 'bg-primary/10 text-primary' },
  { icon: CreditCard, label: 'Loans', path: '/client/loans', color: 'bg-accent/10 text-accent-foreground' },
  { icon: FileText, label: 'Requests', path: '/client/requests', color: 'bg-success/10 text-success' },
  { icon: Bell, label: 'Notifications', path: '/client/notifications', color: 'bg-warning/10 text-warning' },
];

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { member, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, navigate]);

  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['kpi-summary'],
    queryFn: () => api.client.getKPISummary(),
    enabled: isAuthenticated,
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.client.getAccounts(),
    enabled: isAuthenticated,
  });

  // Get recent transactions from all accounts
  const { data: recentTransactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () => api.client.getTransactions(1, 5),
    enabled: isAuthenticated,
  });

  const { data: unreadNotifications = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.client.getUnreadNotificationCount(),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  const recentTransactions = recentTransactionsData?.data || [];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary via-primary to-primary-hover text-primary-foreground px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-primary-foreground/70">{greeting()}</p>
              <h1 className="text-xl font-bold">
                {member?.first_name} {member?.last_name}
              </h1>
            </div>
            <Link
              to="/client/notifications"
              className="relative p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Link>
          </div>

          {/* Member ID */}
          <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
            <span>Member ID:</span>
            <code className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono">
              {member?.member_id}
            </code>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 -mt-4 max-w-3xl mx-auto">
        {/* KPI Section */}
        <KPIHeader data={kpiData!} isLoading={kpiLoading} />

        {/* Quick Actions */}
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            {t('dashboard.quick_actions')}
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action, i) => (
              <motion.div
                key={action.path}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <Link
                  to={action.path}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <div className={`p-2.5 rounded-lg ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{action.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Loan Request Section */}
        <section className="mt-6">
          <div className="bg-card rounded-xl border border-border/50 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Request a Loan</h3>
                <p className="text-sm text-muted-foreground">Submit a loan request application</p>
              </div>
              <Link to="/loan-request">
                <Button variant="outline" size="sm" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Apply Now
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {t('dashboard.recent_transactions')}
            </h2>
            <Link
              to="/client/accounts"
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              {t('view_all')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
            {recentTransactions.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No recent transactions
              </div>
            ) : (
              recentTransactions.slice(0, 3).map((txn, i) => (
                <TransactionRow key={txn.id} transaction={txn} index={i} />
              ))
            )}
          </div>
        </section>

        {/* Desktop Sidebar Placeholder - visible on larger screens */}
        <div className="hidden lg:block fixed right-8 top-24 w-72">
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
            <h3 className="font-semibold mb-3">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Contact our support team for any assistance with your account.
            </p>
            <a
              href="tel:+251988888000"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg transition-colors font-medium"
            >
              <Phone className="h-4 w-4" />
              <span>Contact Support</span>
            </a>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
