// Transaction History Page
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Filter, Download, Calendar } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { TransactionRow } from '@/components/TransactionRow';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function Transactions() {
  const { t } = useTranslation();
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [filterOpen, setFilterOpen] = useState(false);

  // Fetch accounts to find the selected account
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.client.getAccounts(),
    enabled: isAuthenticated,
  });

  // Find account details from fetched accounts
  const account = accounts?.find(a => a.id === accountId);
  
  // Fetch transactions with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['transactions', accountId],
    queryFn: ({ pageParam = 1 }) => api.client.getAccountTransactions(accountId || '', pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => lastPage.hasMore ? pages.length + 1 : undefined,
    enabled: isAuthenticated && !!accountId && !!accounts && accounts.length > 0,
  });

  const transactions = data?.pages.flatMap(page => page.data) || [];

  const handleExport = () => {
    // Mock CSV export
    const csv = transactions.map(t => 
      `${t.transaction_id},${t.type},${t.amount},${t.balance_after},${t.created_at}`
    ).join('\n');
    const blob = new Blob([`ID,Type,Amount,Balance After,Date\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${accountId}.csv`;
    a.click();
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
            <h1 className="text-lg font-semibold">{t('transactions.history')}</h1>
            {account && (
              <p className="text-sm text-muted-foreground">
                {t(`accounts.types.${account.account_type}`)}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <Filter className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleExport}>
            <Download className="h-5 w-5" />
          </Button>
        </div>

        {/* Filter Panel */}
        {filterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 border-t border-border"
          >
            <div className="flex gap-2 pt-4">
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                End Date
              </Button>
              <Button size="sm" className="ml-auto">
                Apply
              </Button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Account Summary */}
      {account && (
        <div className="px-4 py-4 max-w-3xl mx-auto">
          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('accounts.balance')}</p>
                <p className="text-2xl font-bold numeric">
                  ETB {account.balance.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                {account.account_number}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <main className="px-4 max-w-3xl mx-auto">
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 shimmer rounded-lg" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">{t('no_data')}</p>
            </div>
          ) : (
            <>
              {transactions.map((txn, i) => (
                <TransactionRow key={txn.id} transaction={txn} index={i} />
              ))}
              
              {/* Load More */}
              {hasNextPage && (
                <div className="p-4 border-t border-border">
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? 'Loading...' : t('see_more')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
