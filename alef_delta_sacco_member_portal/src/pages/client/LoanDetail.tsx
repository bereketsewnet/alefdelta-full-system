// Loan Detail Page
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, AlertTriangle, CheckCircle2, Clock, Download } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { StatusBadge } from '@/components/StatusBadge';
import { LoanRepaymentRequestForm } from '@/components/LoanRepaymentRequestForm';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, mockLoanSchedule } from '@/lib/api';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-ET', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function LoanDetail() {
  const { t } = useTranslation();
  const { loanId } = useParams();
  const navigate = useNavigate();
  const [showRepaymentForm, setShowRepaymentForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['loan', loanId],
    queryFn: () => api.client.getLoanDetail(loanId!),
  });

  const loan = data;
  const schedule = data?.schedule || mockLoanSchedule;

  if (isLoading || !loan) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-4">
          <div className="h-12 shimmer rounded-lg" />
          <div className="h-48 shimmer rounded-xl" />
          <div className="h-64 shimmer rounded-xl" />
        </div>
      </div>
    );
  }

  // Safely calculate repayment progress
  const totalAmount = (loan.approved_amount || 0) + (loan.total_interest || 0);
  const repaymentProgress = totalAmount > 0 
    ? ((loan.total_paid || 0) / totalAmount) * 100 
    : 0;
  const isOverdue = (loan.days_overdue || 0) > 0;
  
  // Ensure all numeric values are valid
  const outstandingBalance = Number(loan.outstanding_balance) || Number(loan.approved_amount) || 0;
  const monthlyInstallment = Number(loan.monthly_installment) || 0;
  const totalPaid = Number(loan.total_paid) || 0;
  const totalInterest = Number(loan.total_interest) || 0;
  const totalPenalty = Number(loan.total_penalty) || 0;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-4 p-4 max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{loan.product_name}</h1>
            <p className="text-sm text-muted-foreground font-mono">{loan.loan_id}</p>
          </div>
          <StatusBadge status={loan.status} />
        </div>
      </header>

      <main className="px-4 py-4 max-w-3xl mx-auto space-y-4">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl p-5 border",
            isOverdue 
              ? "bg-destructive/10 border-destructive/30" 
              : "bg-card border-border/50"
          )}
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground">{t('loans.approved_amount')}</p>
              <p className="text-xl font-bold numeric">ETB {formatCurrency(loan.approved_amount!)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('loans.outstanding')}</p>
              <p className={cn("text-xl font-bold numeric", isOverdue && "text-destructive")}>
                ETB {formatCurrency(outstandingBalance)}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">{t('loans.progress')}</span>
              <span className="text-sm font-medium">{repaymentProgress.toFixed(0)}% paid</span>
            </div>
            <Progress value={repaymentProgress} className="h-2.5" />
          </div>

          {/* Next Payment */}
          {loan.status === 'APPROVED' && loan.next_payment_date && (
            <div className={cn(
              "flex items-center justify-between p-3 rounded-lg",
              isOverdue ? "bg-destructive/20" : "bg-accent/10"
            )}>
              <div className="flex items-center gap-2">
                <Calendar className={cn("h-5 w-5", isOverdue ? "text-destructive" : "text-accent-foreground")} />
                <div>
                  <p className="text-sm font-medium">
                    {isOverdue ? `${loan.days_overdue} days overdue` : 'Next Payment'}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(loan.next_payment_date)}</p>
                </div>
              </div>
              <p className={cn("text-lg font-bold numeric", isOverdue && "text-destructive")}>
                ETB {formatCurrency(monthlyInstallment)}
              </p>
            </div>
          )}

          {/* Penalty Warning */}
          {totalPenalty > 0 && (
            <div className="mt-3 p-3 bg-destructive/20 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="text-sm text-destructive font-medium">
                Penalty accumulated: ETB {formatCurrency(totalPenalty)}
              </span>
            </div>
          )}
        </motion.div>

        {/* Details Tabs */}
        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="schedule">{t('loans.repayment_schedule')}</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4 space-y-3">
            <div className="bg-card rounded-xl border border-border/50 divide-y divide-border/50">
              {[
                { label: t('loans.interest_rate'), value: `${loan.interest_rate}%` },
                { label: t('loans.interest_type'), value: loan.interest_type },
                { label: t('loans.term'), value: `${loan.term_months} months` },
                { label: t('loans.monthly_payment'), value: `ETB ${formatCurrency(monthlyInstallment)}` },
                { label: t('loans.total_paid'), value: `ETB ${formatCurrency(totalPaid)}` },
                { label: t('loans.total_interest'), value: `ETB ${formatCurrency(totalInterest)}` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>

            {loan.purpose && (
              <div className="bg-card rounded-xl border border-border/50 p-4">
                <p className="text-sm text-muted-foreground mb-1">{t('loans.purpose')}</p>
                <p className="text-sm">{loan.purpose}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="mt-4">
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-5 gap-2 p-3 bg-muted/50 text-xs font-medium text-muted-foreground">
                <span>#</span>
                <span>{t('loans.due_date')}</span>
                <span className="text-right">{t('loans.principal')}</span>
                <span className="text-right">{t('loans.interest')}</span>
                <span className="text-right">Status</span>
              </div>
              
              {/* Table Body */}
              <div className="divide-y divide-border/50 max-h-80 overflow-y-auto custom-scrollbar">
                {schedule.map((item) => (
                  <div
                    key={item.period}
                    className={cn(
                      "grid grid-cols-5 gap-2 p-3 text-sm",
                      item.status === 'PAID' && "bg-success/5",
                      item.status === 'OVERDUE' && "bg-destructive/5"
                    )}
                  >
                    <span className="font-medium">{item.period}</span>
                    <span className="text-muted-foreground">{formatDate(item.due_date)}</span>
                    <span className="text-right numeric">{formatCurrency(item.principal || item.principal_component || 0)}</span>
                    <span className="text-right numeric">{formatCurrency(item.interest || item.interest_component || 0)}</span>
                    <span className="text-right">
                      {item.status === 'PAID' && <CheckCircle2 className="h-4 w-4 text-success inline" />}
                      {item.status === 'PENDING' && <Clock className="h-4 w-4 text-muted-foreground inline" />}
                      {item.status === 'OVERDUE' && <AlertTriangle className="h-4 w-4 text-destructive inline" />}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Button */}
        {loan.status === 'APPROVED' && (
          <Button
            onClick={() => setShowRepaymentForm(true)}
            className="w-full h-12 bg-primary hover:bg-primary-hover text-lg font-semibold"
          >
            {t('loans.request_repayment')}
          </Button>
        )}
      </main>

      {/* Repayment Form */}
      <LoanRepaymentRequestForm
        isOpen={showRepaymentForm}
        onClose={() => setShowRepaymentForm(false)}
        onSuccess={() => {
          // Member portal request modal will create the repayment request.
          // After success, refetch the loan detail so outstanding/next payment can update if needed.
          // React Query will refetch automatically when user navigates, but we can refresh immediately.
        }}
      />

      <BottomNav />
    </div>
  );
}
