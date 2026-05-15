// Transaction Row Component with Expandable Details
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Receipt, User, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/types';

interface TransactionRowProps {
  transaction: Transaction;
  index?: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateStr: string, detailed = false) => {
  const date = new Date(dateStr);
  if (detailed) {
    return date.toLocaleDateString('en-ET', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return date.toLocaleDateString('en-ET', {
    month: 'short',
    day: 'numeric',
  });
};

const transactionTypeConfig: Record<Transaction['type'], { icon: string; colorClass: string; sign: string }> = {
  DEPOSIT: { icon: '↓', colorClass: 'text-success bg-success/10', sign: '+' },
  WITHDRAWAL: { icon: '↑', colorClass: 'text-destructive bg-destructive/10', sign: '-' },
  INTEREST: { icon: '✦', colorClass: 'text-accent bg-accent/10', sign: '+' },
  TRANSFER: { icon: '↔', colorClass: 'text-primary bg-primary/10', sign: '' },
  LOAN_DISBURSEMENT: { icon: '💵', colorClass: 'text-success bg-success/10', sign: '+' },
  LOAN_REPAYMENT: { icon: '📤', colorClass: 'text-warning bg-warning/10', sign: '-' },
  FEE: { icon: '💳', colorClass: 'text-muted-foreground bg-muted', sign: '-' },
  PENALTY: { icon: '⚠', colorClass: 'text-destructive bg-destructive/10', sign: '-' },
};

export function TransactionRow({ transaction, index = 0 }: TransactionRowProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const config = transactionTypeConfig[transaction.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-border/50 last:border-0"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-card-hover transition-colors"
      >
        {/* Type Icon */}
        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-lg", config.colorClass)}>
          {config.icon}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground truncate">
              {t(`transactions.types.${transaction.type}`)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {transaction.reference || transaction.transaction_id}
          </p>
        </div>

        {/* Amount & Date */}
        <div className="text-right">
          <p className={cn(
            "font-semibold numeric",
            config.sign === '+' ? 'text-success' : config.sign === '-' ? 'text-foreground' : 'text-foreground'
          )}>
            {config.sign}{formatCurrency(transaction.amount)}
          </p>
          <p className="text-xs text-muted-foreground">{formatDate(transaction.created_at)}</p>
        </div>

        {/* Expand Icon */}
        <ChevronDown className={cn(
          "h-5 w-5 text-muted-foreground transition-transform",
          isExpanded && "rotate-180"
        )} />
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 bg-muted/30">
              {/* Transaction ID */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-24">Reference:</span>
                <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {transaction.transaction_id}
                </code>
              </div>

              {/* Full Date */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(transaction.created_at, true)}</span>
              </div>

              {/* Balance After */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-24">Balance After:</span>
                <span className="font-medium numeric">ETB {formatCurrency(transaction.balance_after)}</span>
              </div>

              {/* Performed By */}
              {transaction.performed_by && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{transaction.performed_by}</span>
                </div>
              )}

              {/* Receipt - Only show if receipt URL exists */}
              {transaction.receipt_url && (
                <div className="flex items-center gap-2 text-sm">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={transaction.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    View Receipt
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default TransactionRow;
