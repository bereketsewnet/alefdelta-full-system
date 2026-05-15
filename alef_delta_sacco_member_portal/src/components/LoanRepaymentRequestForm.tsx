// Loan Repayment Request Form Modal Component
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

const loanRepaymentRequestSchema = z.object({
  loan_id: z.string().min(1, 'Please select a loan'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  payment_method: z.string().min(1, 'Please select a payment method'),
  bank_receipt_no: z.string().min(1, 'Bank receipt number is required'),
  notes: z.string().optional(),
  bank_receipt: z.instanceof(File),
});

type LoanRepaymentRequestFormData = z.infer<typeof loanRepaymentRequestSchema>;

interface LoanRepaymentRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoanRepaymentRequestForm({
  isOpen,
  onClose,
  onSuccess,
}: LoanRepaymentRequestFormProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  
  // Fetch loans for dropdown (only approved/active loans)
  const { data: loans } = useQuery({
    queryKey: ['loans'],
    queryFn: () => api.client.getLoans(),
    enabled: isOpen,
  });
  
  // Filter to only show approved loans that are not fully paid
  const activeLoans = loans?.filter(
    loan => (loan.status === 'APPROVED' || loan.status === 'DISBURSED') && loan.outstanding_balance > 0
  ) || [];
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoanRepaymentRequestFormData>({
    resolver: zodResolver(loanRepaymentRequestSchema),
    defaultValues: {
      loan_id: '',
      amount: 0,
      payment_method: 'CASH',
      bank_receipt_no: '',
      notes: '',
    },
  });

  const receiptFile = watch('bank_receipt');

  // Handle receipt file change
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('bank_receipt', file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: LoanRepaymentRequestFormData) => {
    setIsSubmitting(true);
    try {
      await api.client.createLoanRepaymentRequest({
        loan_id: data.loan_id,
        amount: data.amount,
        payment_method: data.payment_method,
        bank_receipt_no: data.bank_receipt_no,
        notes: data.notes || undefined,
        bank_receipt: data.bank_receipt,
      });
      
      toast({
        title: t('success'),
        description: 'Loan repayment request submitted successfully. Waiting for approval.',
      });
      
      reset();
      setReceiptPreview(null);
      onClose();
      onSuccess?.();
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : 'Failed to submit loan repayment request',
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
              className="w-full max-w-2xl bg-card rounded-2xl shadow-xl flex flex-col pointer-events-auto md:w-[600px] md:max-w-[90vw]"
              style={{ maxHeight: '90vh' }}
            >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
              <h2 className="text-lg font-semibold">Loan Repayment Request</h2>
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
                  {/* Loan Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="loan_id">Select Loan *</Label>
                    <Select
                      value={watch('loan_id')}
                      onValueChange={(value) => setValue('loan_id', value)}
                    >
                      <SelectTrigger id="loan_id" className={cn(errors.loan_id && 'border-destructive')}>
                        <SelectValue placeholder="Select loan to repay" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeLoans.length === 0 ? (
                          <SelectItem value="" disabled>No active loans available</SelectItem>
                        ) : (
                          activeLoans.map((loan) => (
                            <SelectItem key={loan.id} value={loan.id}>
                              {loan.product_name} - ETB {loan.outstanding_balance.toLocaleString()} outstanding
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.loan_id && (
                      <p className="text-sm text-destructive">{errors.loan_id.message}</p>
                    )}
                    {activeLoans.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        You don't have any active loans to repay.
                      </p>
                    )}
                  </div>
                  
                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Repayment Amount (ETB) *</Label>
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
                  
                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method *</Label>
                    <Select
                      value={watch('payment_method')}
                      onValueChange={(value) => setValue('payment_method', value)}
                    >
                      <SelectTrigger id="payment_method" className={cn(errors.payment_method && 'border-destructive')}>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                        <SelectItem value="CHECK">Check</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.payment_method && (
                      <p className="text-sm text-destructive">{errors.payment_method.message}</p>
                    )}
                  </div>
                  
                  {/* Receipt Number */}
                  <div className="space-y-2">
                    <Label htmlFor="bank_receipt_no">Bank Receipt Number *</Label>
                    <Input
                      id="bank_receipt_no"
                      type="text"
                      placeholder="e.g., BANK-REC-2024-001"
                      {...register('bank_receipt_no')}
                    />
                    {errors.bank_receipt_no && (
                      <p className="text-sm text-destructive">{errors.bank_receipt_no.message}</p>
                    )}
                  </div>
                  
                  {/* Receipt Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="receipt">Bank Receipt Photo *</Label>
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
                                setValue('bank_receipt', undefined as any);
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
                    {errors.bank_receipt && (
                      <p className="text-sm text-destructive">Bank receipt photo is required</p>
                    )}
                  </div>
                  
                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      rows={3}
                      placeholder="e.g., Additional payment information..."
                      {...register('notes')}
                    />
                  </div>
                  
                  {/* Info Box */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Your loan repayment request will be submitted for staff approval. You will be notified once it's processed.
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
                  disabled={isSubmitting || activeLoans.length === 0}
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

export default LoanRepaymentRequestForm;


