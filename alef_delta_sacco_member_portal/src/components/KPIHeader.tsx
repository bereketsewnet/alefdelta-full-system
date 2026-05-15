// KPI Header Component with animated statistics
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, CreditCard, Calendar, ArrowRight } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { KPISummary } from '@/types';
import { mockSavingsHistory } from '@/lib/api';

interface KPIHeaderProps {
  data: KPISummary;
  isLoading?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-ET', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export function KPIHeader({ data, isLoading }: KPIHeaderProps) {
  const { t } = useTranslation();
  
  if (isLoading) {
    return <KPIHeaderSkeleton />;
  }

  const kpiItems = [
    {
      label: t('dashboard.total_savings'),
      value: data.total_savings,
      icon: Wallet,
      trend: data.savings_change_percent,
      color: 'primary',
      sparkline: true,
    },
    {
      label: t('dashboard.loan_outstanding'),
      value: data.loan_outstanding,
      icon: CreditCard,
      color: data.loan_outstanding > 0 ? 'warning' : 'success',
    },
    {
      label: t('dashboard.next_payment'),
      value: data.next_payment_amount,
      icon: Calendar,
      subtitle: data.next_payment_date ? `${t('dashboard.due_on')} ${formatDate(data.next_payment_date)}` : undefined,
      color: 'accent',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main KPI - Total Savings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-hover p-6 text-primary-foreground shadow-glow-primary"
      >
        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary-foreground/80">
              {t('dashboard.total_savings')}
            </p>
            <motion.p
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-3xl font-bold numeric tracking-tight"
            >
              <span className="text-lg font-normal text-primary-foreground/70 mr-1">ETB</span>
              {formatCurrency(data.total_savings)}
            </motion.p>
            {data.savings_change_percent !== 0 && (
              <div className="flex items-center gap-1 text-sm">
                {data.savings_change_percent > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {data.savings_change_percent > 0 ? '+' : ''}
                  {data.savings_change_percent.toFixed(1)}%
                </span>
                <span className="text-primary-foreground/70">this month</span>
              </div>
            )}
          </div>
          <div className="h-16 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockSavingsHistory}>
                <defs>
                  <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth={2}
                  fill="url(#savingsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-accent/20 blur-xl" />
      </motion.div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-3">
        {/* Loan Outstanding */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "rounded-xl p-4 shadow-sm",
            data.loan_outstanding > 0 
              ? "bg-warning/10 border border-warning/20" 
              : "bg-success/10 border border-success/20"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "rounded-lg p-2",
              data.loan_outstanding > 0 ? "bg-warning/20" : "bg-success/20"
            )}>
              <CreditCard className={cn(
                "h-4 w-4",
                data.loan_outstanding > 0 ? "text-warning" : "text-success"
              )} />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('dashboard.loan_outstanding')}
            </span>
          </div>
          <p className={cn(
            "text-xl font-bold numeric",
            data.loan_outstanding > 0 ? "text-warning" : "text-success"
          )}>
            {formatCurrency(data.loan_outstanding)}
          </p>
        </motion.div>

        {/* Next Payment */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-accent/10 border border-accent/20 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-accent/20 p-2">
              <Calendar className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('dashboard.next_payment')}
            </span>
          </div>
          <p className="text-xl font-bold numeric text-accent-foreground">
            {formatCurrency(data.next_payment_amount)}
          </p>
          {data.next_payment_date && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.due_on')} {formatDate(data.next_payment_date)}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function KPIHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-32 rounded-2xl shimmer" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-xl shimmer" />
        <div className="h-24 rounded-xl shimmer" />
      </div>
    </div>
  );
}

export default KPIHeader;
