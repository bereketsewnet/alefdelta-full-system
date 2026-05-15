// My Requests Page
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle2, XCircle, ChevronRight, User, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { StatusBadge } from '@/components/StatusBadge';
import { BottomNav } from '@/components/BottomNav';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Request } from '@/types';

const formatCurrency = (amount?: number) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-ET', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const requestTypeIcons: Record<Request['type'], string> = {
  DEPOSIT: '💰',
  REPAYMENT: '💳',
  LOAN_REQUEST: '📋',
  PROFILE_UPDATE: '👤',
  PASSWORD_RESET: '🔐',
  DOCUMENT_UPLOAD: '📄',
};

export default function Requests() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: depositRequestsData, isLoading: depositLoading } = useQuery({
    queryKey: ['deposit-requests'],
    queryFn: () => api.client.getDepositRequests(),
  });

  const { data: loanRepaymentRequestsData, isLoading: loanRepaymentLoading } = useQuery({
    queryKey: ['loan-repayment-requests'],
    queryFn: () => api.client.getLoanRepaymentRequests(),
  });

  const { data: loanRequestsData, isLoading: loanRequestsLoading } = useQuery({
    queryKey: ['loan-requests'],
    queryFn: () => api.client.getLoanRequests(),
  });

  const isLoading = depositLoading || loanRepaymentLoading || loanRequestsLoading;

  // Transform deposit requests to match Request type
  const depositRequests: Request[] = depositRequestsData?.map((req: any) => ({
    id: req.request_id,
    request_id: req.request_id,
    type: 'DEPOSIT' as Request['type'],
    status: req.status as Request['status'],
    amount: Number(req.amount || 0),
    description: req.description || '',
    staff_notes: req.rejection_reason || (req.status === 'APPROVED' ? `Approved by ${req.approver_username || 'Staff'}` : null),
    processed_by: req.approver_username || null,
    created_at: req.created_at,
  })) || [];

  // Transform loan repayment requests to match Request type
  const loanRepaymentRequests: Request[] = loanRepaymentRequestsData?.map((req: any) => ({
    id: req.request_id,
    request_id: req.request_id,
    type: 'REPAYMENT' as Request['type'],
    status: req.status as Request['status'],
    amount: Number(req.amount || 0),
    description: req.notes || `Loan Repayment${req.loan_product_code ? ` - ${req.loan_product_code}` : ''} (${req.payment_method || 'CASH'})`,
    staff_notes: req.rejection_reason || (req.status === 'APPROVED' ? `Approved by ${req.approver_username || 'Staff'}` : null),
    processed_by: req.approver_username || null,
    created_at: req.created_at,
  })) || [];

  // Transform loan requests to match Request type
  const loanRequests: Request[] = loanRequestsData?.map((req: any) => {
    const purposeMap: Record<string, string> = {
      'CAR': 'Car',
      'HOUSE': 'House',
      'SCHOOL': 'School',
      'CHILDREN': 'Children',
      'BUSINESS': 'Business',
      'MEDICAL': 'Medical',
      'WEDDING': 'Wedding',
      'AGRICULTURE': 'Agriculture',
      'OTHER': req.other_purpose || 'Other',
    };
    const purposeLabel = purposeMap[req.loan_purpose] || req.loan_purpose;
    
    // Build staff notes: if approved, show default message + staff notes if available
    let staffNotes = null;
    if (req.status === 'APPROVED') {
      const defaultMessage = 'Approved. Please visit our office to complete your loan application.';
      if (req.notes && req.notes.trim()) {
        staffNotes = `${defaultMessage}\n\n${req.notes}`;
      } else {
        staffNotes = defaultMessage;
      }
    } else if (req.status === 'REJECTED' && req.rejection_reason) {
      staffNotes = req.rejection_reason;
    }
    
    return {
      id: req.request_id,
      request_id: req.request_id,
      type: 'LOAN_REQUEST' as Request['type'],
      status: req.status as Request['status'],
      amount: Number(req.requested_amount || 0),
      description: `Loan Request - ${purposeLabel}`,
      staff_notes: staffNotes,
      processed_by: req.approver_username || null,
      created_at: req.created_at,
    };
  }) || [];

  // Combine all types of requests and sort by created_at descending
  const requests: Request[] = [...depositRequests, ...loanRepaymentRequests, ...loanRequests].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

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
            <h1 className="text-lg font-semibold">{t('requests.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {requests?.length || 0} requests
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-3xl mx-auto">
        {/* Info Banner */}
        <div className="p-4 mb-4 bg-primary/5 border border-primary/20 rounded-xl">
          <p className="text-sm text-muted-foreground">
            All deposit and repayment requests require staff approval before being processed.
          </p>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 shimmer rounded-xl" />
            ))}
          </div>
        ) : requests?.length === 0 ? (
          <div className="p-8 text-center bg-card rounded-xl border border-border/50">
            <p className="text-muted-foreground">{t('no_data')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests?.map((request, i) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border/50 p-4 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{requestTypeIcons[request.type]}</span>
                    <div>
                      <h3 className="font-medium">{t(`requests.types.${request.type}`)}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{request.request_id}</p>
                    </div>
                  </div>
                  <StatusBadge status={request.status} size="sm" />
                </div>

                {/* Amount */}
                {request.amount && (
                  <div className="mb-3">
                    <p className="text-2xl font-bold numeric">
                      ETB {formatCurrency(request.amount)}
                    </p>
                  </div>
                )}

                {/* Description */}
                {request.description && (
                  <p className="text-sm text-muted-foreground mb-3">{request.description}</p>
                )}

                {/* Staff Notes */}
                {request.staff_notes && (
                  <div className="p-2.5 bg-muted/50 rounded-lg mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Staff Notes</span>
                    </div>
                    <p className="text-sm whitespace-pre-line">{request.staff_notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDate(request.created_at)}</span>
                  </div>
                  {request.processed_by && (
                    <div className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      <span>{request.processed_by}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
