// Accounts List Page
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Coins } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AccountCard } from '@/components/AccountCard';
import { DepositRequestForm } from '@/components/DepositRequestForm';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

const proofUrl = (value?: string | null) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://sacco-api.alefdelta.com/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}${value.startsWith('/') ? value : `/${value}`}`;
};

export default function Accounts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showShareForm, setShowShareForm] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.client.getAccounts(),
  });
  const { data: shareSummary } = useQuery({
    queryKey: ['share-summary'],
    queryFn: () => api.client.getShareSummary(),
  });
  const { data: shareEntries } = useQuery({
    queryKey: ['share-entries'],
    queryFn: () => api.client.getShareEntries(),
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

      {shareSummary && (
        <div className="px-4 pb-4 max-w-3xl mx-auto">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2"><Coins className="h-5 w-5 text-primary" /><h2 className="font-semibold">Share Capital</h2></div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-muted-foreground">Contributed</p><p className="font-semibold">ETB {Number(shareSummary.balance).toFixed(2)}</p></div>
              <div><p className="text-muted-foreground">Fractional units</p><p className="font-mono font-semibold">{shareSummary.share_units}</p></div>
              <div><p className="text-muted-foreground">New purchase price</p><p>ETB {Number(shareSummary.active_share_price).toFixed(2)}</p></div>
              <div><p className="text-muted-foreground">Target (informational)</p><p className="font-mono">{shareSummary.minimum_share_target}</p></div>
              <div><p className="text-muted-foreground">Units to target</p><p className="font-mono">{shareSummary.unit_deficit}</p></div>
              <div><p className="text-muted-foreground">Estimated ETB to target</p><p>ETB {Number(shareSummary.estimated_target_deficit).toFixed(2)}</p></div>
              <div><p className="text-muted-foreground">Actual lien</p><p>ETB {Number(shareSummary.actual_lien).toFixed(2)}</p></div>
              <div><p className="text-muted-foreground">Available share capital</p><p>ETB {Number(shareSummary.available_balance).toFixed(2)}</p></div>
            </div>
            <Button className="mt-4 w-full" onClick={() => setShowShareForm(true)}>Request Share Purchase</Button>
            <p className="mt-2 text-xs text-muted-foreground">The minimum target is not a lien. Requests move no money until staff approval.</p>
            <div className="mt-4 border-t pt-3">
              <p className="mb-2 text-sm font-medium">Share Statement</p>
              {shareEntries?.length ? <div className="space-y-2">
                {shareEntries.map((entry: any) => (
                  <div key={entry.share_entry_id} className="rounded-md bg-muted/40 p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div><p className="font-medium">{entry.entry_type === 'PURCHASE' ? 'Share Purchase' : 'Share Redemption'}</p><p className="text-muted-foreground">{new Date(entry.effective_at).toLocaleDateString()}</p></div>
                      <div className="text-right"><p>ETB {Number(entry.amount).toFixed(2)}</p><p className="font-mono text-muted-foreground">{entry.unit_delta} units</p></div>
                    </div>
                    <div className="mt-2 space-y-1 border-t pt-2 text-muted-foreground">
                      <p>Company receipt: {entry.reference || 'N/A'}</p>
                      <p>Bank receipt: {entry.bank_receipt_no || 'N/A'}</p>
                      {entry.remark && <p>Remark: {entry.remark}</p>}
                      <div className="flex gap-3">
                        {proofUrl(entry.receipt_photo_url) && <a className="text-primary underline" href={proofUrl(entry.receipt_photo_url)!} target="_blank" rel="noreferrer">Company proof</a>}
                        {proofUrl(entry.bank_receipt_photo_url) && <a className="text-primary underline" href={proofUrl(entry.bank_receipt_photo_url)!} target="_blank" rel="noreferrer">Bank proof</a>}
                      </div>
                    </div>
                  </div>
                ))}
              </div> : <p className="text-xs text-muted-foreground">No share transactions yet.</p>}
            </div>
          </div>
        </div>
      )}

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
                recentTransactions={[]}
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

      <DepositRequestForm
        mode="SHARE_PURCHASE"
        isOpen={showShareForm}
        onClose={() => setShowShareForm(false)}
      />

      <BottomNav />
    </div>
  );
}
