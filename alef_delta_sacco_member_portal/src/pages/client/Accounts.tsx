// Accounts List Page
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AccountCard } from '@/components/AccountCard';
import { DepositRequestForm } from '@/components/DepositRequestForm';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { api, mockTransactions } from '@/lib/api';

export default function Accounts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.client.getAccounts(),
  });

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0;

  const handleRequestDeposit = (accountId: string) => {
    setSelectedAccountId(accountId);
    setShowDepositForm(true);
  };

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
            <h1 className="text-lg font-semibold">{t('accounts.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {accounts?.length || 0} accounts
            </p>
          </div>
        </div>
      </header>

      {/* Total Balance Card */}
      <div className="px-4 py-4 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-primary-hover rounded-2xl p-5 text-primary-foreground shadow-glow-primary"
        >
          <p className="text-sm text-primary-foreground/70 mb-1">Total Balance</p>
          <p className="text-3xl font-bold numeric">
            <span className="text-lg font-normal text-primary-foreground/70 mr-1">ETB</span>
            {totalBalance.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>
      </div>

      {/* Accounts List */}
      <main className="px-4 pb-6 max-w-3xl mx-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl shimmer" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {accounts?.map((account, i) => (
              <AccountCard
                key={account.id}
                account={account}
                recentTransactions={mockTransactions.filter(t => t.account_id === account.id).slice(0, 2)}
                index={i}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <Button
        onClick={() => setShowDepositForm(true)}
        className="fixed right-4 bottom-24 md:bottom-8 h-14 w-14 rounded-full bg-primary hover:bg-primary-hover shadow-glow-primary"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Request Deposit Modal */}
      <DepositRequestForm
        isOpen={showDepositForm}
        onClose={() => {
          setShowDepositForm(false);
          setSelectedAccountId(null);
        }}
        onSuccess={() => {
          // Refresh accounts or show success message
        }}
      />

      <BottomNav />
    </div>
  );
}
