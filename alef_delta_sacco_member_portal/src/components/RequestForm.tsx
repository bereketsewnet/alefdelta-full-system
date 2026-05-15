// Request Form Modal Component
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const requestSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface RequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'DEPOSIT' | 'REPAYMENT';
  maxAmount?: number;
  accountId?: string;
  loanId?: string;
  onSuccess?: () => void;
}

export function RequestForm({
  isOpen,
  onClose,
  type,
  maxAmount,
  accountId,
  loanId,
  onSuccess,
}: RequestFormProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      amount: 0,
      description: '',
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true);
    try {
      await api.client.createRequest({
        type,
        amount: data.amount,
        description: data.description,
      });
      
      toast({
        title: t('success'),
        description: t('requests.request_submitted'),
      });
      
      reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : 'Failed to submit request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = type === 'DEPOSIT' ? t('requests.deposit_request') : t('requests.repayment_request');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-card rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">{t('requests.amount')} (ETB)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="numeric text-lg"
                  {...register('amount', { valueAsNumber: true })}
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
                {maxAmount && (
                  <p className="text-xs text-muted-foreground">
                    Maximum: ETB {maxAmount.toLocaleString()}
                  </p>
                )}
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('requests.description')}</Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder={type === 'DEPOSIT' 
                    ? "Monthly contribution payment..." 
                    : "December loan installment payment..."}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>
              
              {/* Info Box */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Your request will be submitted for staff approval. You will be notified once processed.
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary hover:bg-primary-hover"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('submit')
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default RequestForm;
