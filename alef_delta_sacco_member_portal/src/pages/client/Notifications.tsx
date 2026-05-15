// Notifications Page
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, CheckCircle2, Info, AlertTriangle, XCircle, Check, TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'Just now';
  
  // Parse date - backend should now return ISO format, but handle both
  let date: Date;
  try {
    if (dateStr.includes('T')) {
      // ISO format
      date = new Date(dateStr);
    } else if (dateStr.includes(' ')) {
      // MySQL datetime format: treat as UTC
      date = new Date(dateStr + 'Z');
    } else {
      date = new Date(dateStr);
    }
  } catch (e) {
    return 'Just now';
  }
  
  const now = new Date();
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Just now';
  }
  
  const diffMs = now.getTime() - date.getTime();
  
  // Handle negative differences (future dates) - likely timezone issue
  if (diffMs < 0) {
    // If less than 1 hour in future, treat as timezone issue
    if (Math.abs(diffMs) < 3600000) {
      return 'Just now';
    }
    return 'Just now';
  }
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 10) return 'Just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-ET', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

const getNotificationConfig = (type: Notification['type']) => {
  const configs: Record<string, { icon: React.ReactNode; colorClass: string }> = {
    DEPOSIT: { icon: <TrendingUp className="h-5 w-5" />, colorClass: 'bg-success/10 text-success' },
    WITHDRAWAL: { icon: <TrendingDown className="h-5 w-5" />, colorClass: 'bg-warning/10 text-warning' },
    LOAN_APPROVED: { icon: <CheckCircle2 className="h-5 w-5" />, colorClass: 'bg-success/10 text-success' },
    LOAN_REJECTED: { icon: <XCircle className="h-5 w-5" />, colorClass: 'bg-destructive/10 text-destructive' },
    LOAN_DISBURSED: { icon: <DollarSign className="h-5 w-5" />, colorClass: 'bg-success/10 text-success' },
    LOAN_REPAYMENT: { icon: <FileText className="h-5 w-5" />, colorClass: 'bg-primary/10 text-primary' },
    LOAN_REPAYMENT_APPROVED: { icon: <CheckCircle2 className="h-5 w-5" />, colorClass: 'bg-success/10 text-success' },
    LOAN_REPAYMENT_REJECTED: { icon: <XCircle className="h-5 w-5" />, colorClass: 'bg-destructive/10 text-destructive' },
    DEPOSIT_REQUEST_APPROVED: { icon: <CheckCircle2 className="h-5 w-5" />, colorClass: 'bg-success/10 text-success' },
    DEPOSIT_REQUEST_REJECTED: { icon: <XCircle className="h-5 w-5" />, colorClass: 'bg-destructive/10 text-destructive' },
    PENALTY_APPLIED: { icon: <AlertTriangle className="h-5 w-5" />, colorClass: 'bg-destructive/10 text-destructive' },
    INTEREST_CREDITED: { icon: <TrendingUp className="h-5 w-5" />, colorClass: 'bg-success/10 text-success' },
    ACCOUNT_FROZEN: { icon: <AlertTriangle className="h-5 w-5" />, colorClass: 'bg-warning/10 text-warning' },
    ACCOUNT_UNFROZEN: { icon: <CheckCircle2 className="h-5 w-5" />, colorClass: 'bg-success/10 text-success' },
    PROFILE_UPDATE: { icon: <Info className="h-5 w-5" />, colorClass: 'bg-primary/10 text-primary' },
    SYSTEM: { icon: <Bell className="h-5 w-5" />, colorClass: 'bg-primary/10 text-primary' },
  };
  return configs[type] || { icon: <Info className="h-5 w-5" />, colorClass: 'bg-primary/10 text-primary' };
};

export default function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.client.getNotifications(),
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.client.getUnreadNotificationCount(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.client.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.client.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    const notificationId = notification.notification_id || notification.id;
    const isRead = notification.is_read !== undefined ? notification.is_read : notification.read;
    
    if (!isRead && notificationId) {
      markReadMutation.mutate(notificationId);
    }
    
    // Navigate to resource if available in metadata
    if (notification.metadata) {
      if (notification.metadata.loan_id) {
        navigate(`/client/loans/${notification.metadata.loan_id}`);
      } else if (notification.metadata.account_id) {
        navigate('/client/accounts');
      }
    }
    
    // Navigate based on notification type
    if (notification.type.includes('LOAN_REPAYMENT') || notification.type.includes('LOAN_')) {
      if (notification.metadata?.loan_id) {
        navigate(`/client/loans/${notification.metadata.loan_id}`);
      } else {
        navigate('/client/loans');
      }
    } else if (notification.type.includes('DEPOSIT_REQUEST') || notification.type.includes('REPAYMENT')) {
      navigate('/client/requests');
    } else if (notification.type === 'DEPOSIT' || notification.type === 'WITHDRAWAL') {
      navigate('/client/accounts');
    }
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
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
            <h1 className="text-lg font-semibold">{t('notifications.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              {markAllReadMutation.isPending ? 'Marking...' : t('notifications.mark_all_read')}
            </Button>
          )}
        </div>
      </header>

      <main className="px-4 py-4 max-w-3xl mx-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 shimmer rounded-xl" />
            ))}
          </div>
        ) : notifications?.length === 0 ? (
          <div className="p-8 text-center bg-card rounded-xl border border-border/50">
            <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">{t('notifications.no_notifications')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications?.map((notification, i) => {
              const notificationId = notification.notification_id || notification.id;
              const isRead = notification.is_read !== undefined ? notification.is_read : notification.read;
              const config = getNotificationConfig(notification.type);
              return (
                <motion.button
                  key={notificationId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full text-left bg-card rounded-xl border border-border/50 p-4 transition-all hover:shadow-sm",
                    !isRead && "bg-primary/5 border-primary/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn("p-2 rounded-lg shrink-0", config.colorClass)}>
                      {config.icon}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={cn(
                          "font-medium",
                          !isRead && "text-primary"
                        )}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                    
                    {/* Unread indicator */}
                    {!isRead && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
