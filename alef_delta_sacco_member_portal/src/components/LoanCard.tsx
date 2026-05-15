// Loan Card and Detail Components
import { motion } from 'framer-motion';
import { Calendar, AlertTriangle, CheckCircle2, Clock, ChevronRight, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import type { Loan } from '@/types';

interface LoanCardProps {
  loan: Loan;
  index?: number;
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

const loanStatusConfig: Record<Loan['status'], { icon: React.ReactNode; colorClass: string }> = {
  PENDING: { icon: <Clock className="h-4 w-4" />, colorClass: 'status-pending' },
  UNDER_REVIEW: { icon: <Clock className="h-4 w-4" />, colorClass: 'status-pending' },
  APPROVED: { icon: <CheckCircle2 className="h-4 w-4" />, colorClass: 'status-active' },
  REJECTED: { icon: <AlertTriangle className="h-4 w-4" />, colorClass: 'status-rejected' },
  DISBURSED: { icon: <CheckCircle2 className="h-4 w-4" />, colorClass: 'status-active' },
  FULLY_PAID: { icon: <CheckCircle2 className="h-4 w-4" />, colorClass: 'status-approved' },
};

export function LoanCard({ loan, index = 0 }: LoanCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const statusConfig = loanStatusConfig[loan.status];
  const repaymentProgress = loan.approved_amount 
    ? ((loan.total_paid / (loan.approved_amount + loan.total_interest)) * 100)
    : 0;
  
  const isOverdue = loan.days_overdue > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => navigate(`/client/loans/${loan.id}`)}
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-primary/30",
        isOverdue && "border-destructive/50"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground">{loan.product_name}</h3>
          <p className="text-xs text-muted-foreground font-mono">{loan.loan_id}</p>
        </div>
        <span className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full", statusConfig.colorClass)}>
          {statusConfig.icon}
          {t(`loans.status.${loan.status}`)}
        </span>
      </div>

      {/* Amount */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">{t('loans.approved_amount')}</p>
          <p className="text-lg font-bold numeric">
            ETB {formatCurrency(loan.approved_amount || loan.applied_amount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('loans.outstanding')}</p>
          <p className={cn("text-lg font-bold numeric", isOverdue ? "text-destructive" : "text-foreground")}>
            ETB {formatCurrency(loan.outstanding_balance)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {loan.status === 'APPROVED' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">{t('loans.progress')}</span>
            <span className="text-xs font-medium">{repaymentProgress.toFixed(0)}%</span>
          </div>
          <Progress value={repaymentProgress} className="h-2" />
        </div>
      )}

      {/* Details Row */}
      <div className="flex items-center justify-between text-sm border-t border-border/50 pt-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-muted-foreground">
            <TrendingDown className="h-4 w-4" />
            <span>{loan.interest_type}</span>
          </div>
          <span className="text-muted-foreground">{loan.interest_rate}%</span>
        </div>
        
        {loan.status === 'APPROVED' && loan.next_payment_date && (
          <div className={cn("flex items-center gap-1", isOverdue ? "text-destructive" : "text-muted-foreground")}>
            <Calendar className="h-4 w-4" />
            <span className="text-xs">
              {isOverdue ? `${loan.days_overdue} days overdue` : formatDate(loan.next_payment_date)}
            </span>
          </div>
        )}
        
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Overdue Warning */}
      {isOverdue && loan.total_penalty > 0 && (
        <div className="mt-3 p-2 bg-destructive/10 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-xs text-destructive font-medium">
            Penalty: ETB {formatCurrency(loan.total_penalty)}
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default LoanCard;
