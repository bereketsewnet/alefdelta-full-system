// Loans List Page
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Filter, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LoanCard } from '@/components/LoanCard';
import { LoanRepaymentRequestForm } from '@/components/LoanRepaymentRequestForm';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import type { Loan } from '@/types';

export default function Loans() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'closed'>('active');
  const [showRepaymentForm, setShowRepaymentForm] = useState(false);

  const { data: loans, isLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: () => api.client.getLoans(),
  });

  const filterLoans = (status: 'active' | 'pending' | 'closed'): Loan[] => {
    if (!loans) return [];
    switch (status) {
      case 'active':
        return loans.filter(l => l.status === 'APPROVED' || l.status === 'DISBURSED');
      case 'pending':
        return loans.filter(l => l.status === 'PENDING' || l.status === 'UNDER_REVIEW');
      case 'closed':
        return loans.filter(l => l.status === 'FULLY_PAID' || l.status === 'REJECTED');
      default:
        return loans;
    }
  };

  const totalOutstanding = loans?.reduce((sum, l) => 
    ['APPROVED', 'DISBURSED'].includes(l.status) ? sum + l.outstanding_balance : sum, 0
  ) || 0;

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
            <h1 className="text-lg font-semibold">{t('loans.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {loans?.length || 0} loans
            </p>
          </div>
        </div>
      </header>

      {/* Total Outstanding Card */}
      <div className="px-4 py-4 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/30 rounded-2xl p-5"
        >
          <p className="text-sm text-muted-foreground mb-1">{t('loans.outstanding')}</p>
          <p className="text-3xl font-bold numeric text-warning">
            <span className="text-lg font-normal text-muted-foreground mr-1">ETB</span>
            {totalOutstanding.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>
      </div>

      {/* Tabs & Loans List */}
      <main className="px-4 max-w-3xl mx-auto">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="active">
              Active ({filterLoans('active').length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({filterLoans('pending').length})
            </TabsTrigger>
            <TabsTrigger value="closed">
              Closed ({filterLoans('closed').length})
            </TabsTrigger>
          </TabsList>

          {['active', 'pending', 'closed'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-48 rounded-xl shimmer" />
                  ))}
                </div>
              ) : filterLoans(tab as 'active' | 'pending' | 'closed').length === 0 ? (
                <div className="p-8 text-center bg-card rounded-xl border border-border/50">
                  <p className="text-muted-foreground">{t('no_data')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filterLoans(tab as 'active' | 'pending' | 'closed').map((loan, i) => (
                    <LoanCard key={loan.id} loan={loan} index={i} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Floating Action Button */}
      {filterLoans('active').length > 0 && (
        <Button
          onClick={() => setShowRepaymentForm(true)}
          className="fixed right-4 bottom-24 md:bottom-8 h-14 w-14 rounded-full bg-primary hover:bg-primary-hover shadow-glow-primary"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Loan Repayment Request Modal */}
      <LoanRepaymentRequestForm
        isOpen={showRepaymentForm}
        onClose={() => {
          setShowRepaymentForm(false);
        }}
        onSuccess={() => {
          // Refetch loans after successful request
          // The query will automatically refetch
        }}
      />

      <BottomNav />
    </div>
  );
}
