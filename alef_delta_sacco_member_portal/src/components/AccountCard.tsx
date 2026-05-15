// Account Card Component
import { motion } from 'framer-motion';
import { Copy, ExternalLink, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Account, Transaction } from '@/types';

interface AccountCardProps {
  account: Account;
  recentTransactions?: Transaction[];
  index?: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const accountTypeIcons: Record<Account['account_type'], string> = {
  COMPULSORY: '🔒',
  VOLUNTARY: '💰',
  FIXED: '📈',
  SHARE_CAPITAL: '🏦',
};

const accountTypeColors: Record<Account['account_type'], string> = {
  COMPULSORY: 'from-primary/20 to-primary/5 border-primary/30',
  VOLUNTARY: 'from-success/20 to-success/5 border-success/30',
  FIXED: 'from-accent/20 to-accent/5 border-accent/30',
  SHARE_CAPITAL: 'from-secondary to-secondary/50 border-secondary-foreground/20',
};

export function AccountCard({ account, recentTransactions = [], index = 0 }: AccountCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(account.account_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Safety check: ensure account_type exists in the record, default to VOLUNTARY
  const accountType = account.account_type && accountTypeColors[account.account_type] 
    ? account.account_type 
    : 'VOLUNTARY';
  const colorClass = accountTypeColors[accountType] || accountTypeColors['VOLUNTARY'];
  const icon = accountTypeIcons[accountType] || accountTypeIcons['VOLUNTARY'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "rounded-xl border bg-gradient-to-br p-4 shadow-sm transition-shadow hover:shadow-md",
        colorClass
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-foreground">
              {t(`accounts.types.${accountType}`)}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <code className="text-xs text-muted-foreground font-mono">
                {account.account_number}
              </code>
              <button
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            account.status === 'ACTIVE' && "status-active",
            account.status === 'FROZEN' && "status-pending",
            account.status === 'CLOSED' && "status-rejected"
          )}
        >
          {account.status}
        </span>
      </div>

      {/* Balance */}
      <div className="space-y-2 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">{t('accounts.balance')}</p>
          <p className="text-2xl font-bold numeric text-foreground">
            <span className="text-sm font-normal text-muted-foreground mr-1">ETB</span>
            {formatCurrency(account.balance)}
          </p>
        </div>
        
        {account.lien_amount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('accounts.available_balance')}</span>
            <span className="font-medium numeric text-foreground">
              ETB {formatCurrency(account.available_balance)}
            </span>
          </div>
        )}

        {account.interest_rate > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('accounts.interest_rate')}</span>
            <span className="font-medium text-success">{account.interest_rate}% p.a.</span>
          </div>
        )}
      </div>

      {/* Recent Transactions Preview */}
      {recentTransactions.length > 0 && (
        <div className="border-t border-border/50 pt-3 mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Recent</p>
          <div className="space-y-1.5">
            {recentTransactions.slice(0, 2).map((txn) => (
              <div key={txn.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate max-w-[60%]">
                  {txn.reference || txn.type}
                </span>
                <span className={cn(
                  "font-medium numeric",
                  txn.type === 'DEPOSIT' || txn.type === 'INTEREST' 
                    ? "text-success" 
                    : "text-foreground"
                )}>
                  {txn.type === 'DEPOSIT' || txn.type === 'INTEREST' ? '+' : '-'}
                  {formatCurrency(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => navigate(`/client/accounts/${account.id}/transactions`)}
        >
          {t('accounts.view_transactions')}
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}

export default AccountCard;
