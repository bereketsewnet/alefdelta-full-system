// Status Badge Component
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { RequestStatus, LoanStatus, MemberStatus, AccountStatus } from '@/types';

type StatusType = RequestStatus | LoanStatus | MemberStatus | AccountStatus;

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
  // Request Status
  PENDING: {
    icon: <Clock className="h-3.5 w-3.5" />,
    className: 'status-pending',
    label: 'Pending',
  },
  APPROVED: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: 'status-approved',
    label: 'Approved',
  },
  REJECTED: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: 'status-rejected',
    label: 'Rejected',
  },
  
  // Loan Status
  UNDER_REVIEW: {
    icon: <Clock className="h-3.5 w-3.5" />,
    className: 'status-pending',
    label: 'Under Review',
  },
  DISBURSED: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: 'status-active',
    label: 'Disbursed',
  },
  FULLY_PAID: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: 'status-approved',
    label: 'Fully Paid',
  },
  
  // Member Status
  ACTIVE: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: 'status-active',
    label: 'Active',
  },
  INACTIVE: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    className: 'status-pending',
    label: 'Inactive',
  },
  SUSPENDED: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: 'status-rejected',
    label: 'Suspended',
  },
  TERMINATED: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: 'status-rejected',
    label: 'Terminated',
  },
  CLOSED: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: 'status-rejected',
    label: 'Closed',
  },
  
  // Account Status
  FROZEN: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    className: 'status-pending',
    label: 'Frozen',
  },
};

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    icon: null,
    className: 'bg-muted text-muted-foreground border-muted',
    label: status,
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap",
      config.className,
      sizeClasses[size]
    )}>
      {showIcon && config.icon}
      {config.label}
    </span>
  );
}

export default StatusBadge;
