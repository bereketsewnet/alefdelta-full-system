// Deposit Request Form Modal Component
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const depositRequestSchema = z.object({
  account_id: z.string().min(1, 'Please select an account'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  reference_number: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  receipt: z.instanceof(File).optional(),
});

type DepositRequestFormData = z.infer<typeof depositRequestSchema>;

interface DepositRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DepositRequestForm({
  isOpen,
  onClose,
  onSuccess,
}: DepositRequestFormProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  
  // Fetch accounts for dropdown
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.client.getAccounts(),
    enabled: isOpen,
  });
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DepositRequestFormData>({
    resolver: zodResolver(depositRequestSchema),
    defaultValues: {
      account_id: '',
      amount: 0,
      reference_number: '',
      description: '',
    },
  });

  const receiptFile = watch('receipt');

  // Handle receipt file change
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('receipt', file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: DepositRequestFormData) => {
    setIsSubmitting(true);
    try {
      await api.client.createDepositRequest({
        account_id: data.account_id,
        amount: data.amount,
        reference_number: data.reference_number || undefined,
        description: data.description,
        receipt: data.receipt,
      });
      
      toast({
        title: t('success'),
        description: 'Deposit request submitted successfully. Waiting for approval.',
      });
      
      reset();
      setReceiptPreview(null);
      onClose();
      onSuccess?.();
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : 'Failed to submit deposit request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setReceiptPreview(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          
          {/* Modal Container - Centers on desktop */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            {/* Modal - Fixed positioning and scrollable */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-card rounded-2xl shadow-xl flex flex-col pointer-events-auto"
              style={{ maxHeight: '90vh' }}
            >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
              <h2 className="text-lg font-semibold">Deposit Request</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
              {/* Scrollable Form Content */}
              <div className="overflow-y-auto flex-1 min-h-0">
                <div className="p-4 space-y-4 pb-2">
                  {/* Account Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="account_id">Select Account *</Label>
                    <Select
                      value={watch('account_id')}
                      onValueChange={(value) => setValue('account_id', value)}
                    >
                      <SelectTrigger id="account_id" className={cn(errors.account_id && 'border-destructive')}>
                        <SelectValue placeholder="Select account to deposit to" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_type} - {account.account_number}
                            {' '}(ETB {account.balance.toLocaleString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.account_id && (
                      <p className="text-sm text-destructive">{errors.account_id.message}</p>
                    )}
                  </div>
                  
                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (ETB) *</Label>
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
                  </div>
                  
                  {/* Reference Number */}
                  <div className="space-y-2">
                    <Label htmlFor="reference_number">Reference Number</Label>
                    <Input
                      id="reference_number"
                      type="text"
                      placeholder="e.g., Transaction ID, Receipt Number"
                      {...register('reference_number')}
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional: Enter the transaction reference or receipt number from your payment
                    </p>
                  </div>
                  
                  {/* Receipt Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="receipt">Deposit Receipt/Screenshot</Label>
                    <div className="space-y-2">
                      <label
                        htmlFor="receipt"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        {receiptPreview ? (
                          <div className="relative w-full h-full">
                            <img
                              src={receiptPreview}
                              alt="Receipt preview"
                              className="w-full h-full object-contain rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReceiptPreview(null);
                                setValue('receipt', undefined);
                              }}
                              className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload receipt
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              PNG, JPG, PDF up to 5MB
                            </p>
                          </div>
                        )}
                        <input
                          id="receipt"
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={handleReceiptChange}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload a screenshot or photo of your deposit receipt
                    </p>
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      rows={3}
                      placeholder="e.g., Monthly contribution payment for December 2024..."
                      {...register('description')}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">{errors.description.message}</p>
                    )}
                  </div>
                  
                  {/* Info Box */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Your deposit request will be submitted for staff approval. You will be notified once it's processed.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Fixed Footer with Buttons */}
              <div className="flex gap-3 p-4 border-t border-border flex-shrink-0 bg-card">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
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
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    t('submit')
                  )}
                </Button>
              </div>
            </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default DepositRequestForm;

