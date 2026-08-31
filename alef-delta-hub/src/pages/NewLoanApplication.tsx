import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Member } from "@/types";
import { api } from "@/lib/api";
import type { LoanProduct, EligibilityCheck, LoanProductTier } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, Search, X, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { calculateFlatInterest, calculateDecliningInterest } from "@/lib/utils/financial";
import { useDebounce } from "@/hooks/use-debounce";

const loanSchema = z.object({
  member_id: z.string().min(1, "Please select a member"),
  product_code: z.string().min(1, "Please select a loan product"),
  selected_tier_id: z.string().min(1, "Please select a loan tier"),
  applied_amount: z.string().min(1, "Loan amount is required"),
  term_months: z.string().min(1, "Term is required"),
  purpose_description: z.string().min(10, "Purpose must be at least 10 characters"),
  repayment_frequency: z.enum(["MONTHLY", "QUARTERLY"]),
  borrower_age: z.string().min(1, "Borrower age is required"),
  fee_payment_method: z.enum(["DEDUCT_FROM_LOAN", "OUT_OF_POCKET"]),
  fee_receipt_number: z.string().max(120).optional(),
});

type LoanFormData = z.infer<typeof loanSchema>;

const NewLoanApplication = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityCheck | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");
  const [pendingSubmission, setPendingSubmission] = useState<LoanFormData | null>(null);
  const [feeReceipt, setFeeReceipt] = useState<File | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Search Members (only when searching, max 10 results)
  const { data: membersData } = useQuery({
    queryKey: ['members-search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return [];
      const res = await api.get<{ data: Member[] }>(`/members?search=${debouncedSearch}&status=ACTIVE&limit=10`);
      return res.data.data;
    },
    enabled: !!debouncedSearch && !selectedMember && !!user
  });

  // Fetch loan products from API
  const { data: loanProductsData } = useQuery({
    queryKey: ['loan-products'],
    queryFn: async () => {
      const res = await api.get<{ data: LoanProduct[] }>('/loan-products');
      return res.data.data || [];
    },
    enabled: !!user
  });

  const loanProducts = loanProductsData || [];

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      member_id: "",
      product_code: "",
      selected_tier_id: "",
      applied_amount: "",
      term_months: "",
      purpose_description: "",
      repayment_frequency: "MONTHLY",
      borrower_age: "",
      fee_payment_method: "DEDUCT_FROM_LOAN",
      fee_receipt_number: "",
    },
  });

  const watchedProductCode = form.watch("product_code");
  const watchedTierId = form.watch("selected_tier_id");
  const watchedAmount = form.watch("applied_amount");
  const watchedTerm = form.watch("term_months");
  const watchedAge = form.watch("borrower_age");
  const watchedFeePaymentMethod = form.watch("fee_payment_method");
  const selectedTier: LoanProductTier | null = selectedProduct?.tiers?.find((tier) => tier.tier_id === watchedTierId) || null;

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      if (!["CREDIT_OFFICER", "MANAGER", "ADMIN"].includes(userData.role)) {
        navigate("/dashboard");
      }
    }
  }, [navigate]);

  useEffect(() => {
    const product = loanProducts.find((p) => p.code === watchedProductCode);
    setSelectedProduct(product || null);
    if (product && !product.tiers.some((tier) => tier.tier_id === form.getValues('selected_tier_id'))) {
      form.setValue('selected_tier_id', '');
    }
  }, [watchedProductCode, loanProducts, form]);

  const amount = parseFloat(watchedAmount) || 0;
  const term = parseInt(watchedTerm) || 0;
  const interestRate = selectedTier?.interest_rate ?? selectedProduct?.interest_rate ?? 0;
  const serviceCharge = selectedProduct?.service_charge_mode === 'FIXED'
    ? Number(selectedProduct.service_charge_fixed_amount || 0)
    : Number(((amount * Number(selectedProduct?.service_charge_rate || 0)) / 100).toFixed(2));

  const flatCalc = amount > 0 && term > 0 ? calculateFlatInterest(amount, interestRate, term) : null;
  const decliningCalc = amount > 0 && term > 0 ? calculateDecliningInterest(amount, interestRate, term) : null;
  const { data: insuranceQuote } = useQuery({ queryKey: ['insurance-quote', watchedAge, term, amount, selectedMember?.marital_status], queryFn: async () => (await api.post('/loans/insurance-quote', { age: Number(watchedAge), termMonths: term, maritalStatus: selectedMember?.marital_status, principal: amount })).data, enabled: !!selectedMember && Number(watchedAge) >= 18 && term > 0 && term <= 120 && amount > 0 });
  const debouncedEligibilityKey = useDebounce(`${form.watch('member_id')}|${watchedProductCode}|${watchedTierId}|${watchedAmount}|${watchedTerm}`, 500);
  const eligibilityQuery = useQuery({
    queryKey: ['new-loan-eligibility', debouncedEligibilityKey],
    queryFn: async () => (await api.post<EligibilityCheck>('/loans/check-eligibility', {
      member_id: form.getValues('member_id'), product_code: watchedProductCode, selected_tier_id: watchedTierId,
      applied_amount: Number(watchedAmount), term_months: Number(watchedTerm), borrower_age: Number(watchedAge)
    })).data,
    enabled: Boolean(form.getValues('member_id') && watchedProductCode && watchedTierId && amount > 0 && term > 0),
    retry: false
  });

  useEffect(() => {
    if (eligibilityQuery.data) setEligibilityResult(eligibilityQuery.data);
  }, [eligibilityQuery.data]);

  const insurancePremium = Number(insuranceQuote?.premium || 0);
  const totalUpfrontFees = Number((serviceCharge + insurancePremium).toFixed(2));
  const netDisbursement = watchedFeePaymentMethod === 'DEDUCT_FROM_LOAN'
    ? Number((amount - totalUpfrontFees).toFixed(2))
    : amount;

  if (!user) return null;

  const checkEligibility = async () => {
    const data = form.getValues();
    if (!data.member_id || !data.product_code || !data.selected_tier_id || !data.applied_amount || !data.term_months) {
      toast({
        title: "Incomplete Form",
        description: "Please select a member, product, amount and term first.",
        variant: "destructive",
      });
      return;
    }
    setEligibilityLoading(true);
    setEligibilityResult(null);
    try {
      const res = await api.post<EligibilityCheck>('/loans/check-eligibility', {
        member_id: data.member_id,
        product_code: data.product_code,
        selected_tier_id: data.selected_tier_id,
        applied_amount: Number(data.applied_amount),
        term_months: Number(data.term_months),
        borrower_age: Number(data.borrower_age),
      });
      setEligibilityResult(res.data);
    } catch (error: any) {
      const details = error.response?.data?.details;
      const message = Array.isArray(details)
        ? details.map((detail: any) => detail.message || String(detail)).join('; ')
        : error.response?.data?.message || "Could not run eligibility check.";
      toast({
        title: "Eligibility Check Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setEligibilityLoading(false);
    }
  };

  const submitApplication = async (data: LoanFormData, exceptionReasonValue?: string) => {
    try {
      const payload = new FormData();
      Object.entries(data).forEach(([key, value]) => payload.append(key, value ?? ''));
      payload.set('applied_amount', String(Number(data.applied_amount)));
      payload.set('term_months', String(Number(data.term_months)));
      if (exceptionReasonValue) payload.set('exception_reason', exceptionReasonValue);
      if (feeReceipt) payload.set('fee_receipt', feeReceipt);
      await api.post('/loans', payload);
    
      const member = membersData?.find((m) => m.member_id === data.member_id);
    
      // Invalidate loans query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    
      toast({
        title: "Loan Application Submitted",
        description: `Application for ${member?.first_name} ${member?.last_name} has been created.`,
      });

      navigate("/loans");
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.response?.data?.message || "Failed to create loan application.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: LoanFormData) => {
    if (data.fee_payment_method === 'OUT_OF_POCKET' && !feeReceipt) {
      toast({ title: 'Receipt Required', description: 'Upload the cash or bank receipt for out-of-pocket fees.', variant: 'destructive' });
      return;
    }
    if (data.fee_payment_method === 'DEDUCT_FROM_LOAN' && netDisbursement <= 0) {
      toast({ title: 'Invalid Fee Amount', description: 'Service charge and insurance must be less than the loan amount.', variant: 'destructive' });
      return;
    }
    if (!eligibilityResult) {
      toast({ title: 'Eligibility Required', description: 'Wait for or run the eligibility check before submitting.', variant: 'destructive' });
      return;
    }
    if (!eligibilityResult.passed) {
      setPendingSubmission(data);
      setExceptionDialogOpen(true);
      return;
    }
    await submitApplication(data);
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/loans")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">New Loan Application</h1>
              <p className="text-sm text-muted-foreground">Create a new loan application</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
                <CardDescription>
                  Enter loan application information. All fields are required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="member_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Member *</FormLabel>
                          {!selectedMember ? (
                            <div className="space-y-2">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search by name, member no, or phone..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="pl-10"
                                  autoFocus
                                />
                              </div>
                              {debouncedSearch && debouncedSearch.length > 0 && !membersData && (
                                <p className="text-sm text-muted-foreground">Searching...</p>
                              )}
                              {debouncedSearch && membersData && membersData.length === 0 && (
                                <p className="text-sm text-muted-foreground">No members found. Try a different search term.</p>
                              )}
                              {membersData && membersData.length > 0 && (
                                <div className="border rounded-md shadow-md bg-popover max-h-60 overflow-y-auto">
                                  {membersData.map(member => (
                                    <div
                                      key={member.member_id}
                                      className="p-3 hover:bg-accent cursor-pointer border-b last:border-0"
                                      onClick={() => {
                                        setSelectedMember(member);
                                        setSearchQuery("");
                                        field.onChange(member.member_id);
                                        form.setValue('borrower_age', String(member.age || ''));
                                      }}
                                    >
                                      <p className="font-medium">{member.first_name} {member.middle_name} {member.last_name}</p>
                                      <p className="text-xs text-muted-foreground">{member.phone_primary} • {member.membership_no}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {!debouncedSearch && (
                                <p className="text-xs text-muted-foreground">
                                  Start typing to search for members...
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                              <div className="flex-1">
                                <p className="font-medium">{selectedMember.first_name} {selectedMember.middle_name} {selectedMember.last_name}</p>
                                <p className="text-xs text-muted-foreground">{selectedMember.phone_primary} • {selectedMember.membership_no}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedMember(null);
                                  field.onChange("");
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField control={form.control} name="borrower_age" render={({ field }) => <FormItem><FormLabel>Borrower Age *</FormLabel><FormControl><Input type="number" min="18" max="120" {...field} /></FormControl><FormDescription>Defaulted from member record; adjust only when verified.</FormDescription><FormMessage /></FormItem>} />

                    <FormField
                      control={form.control}
                      name="product_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Product *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select loan product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {loanProducts.map((product) => (
                                <SelectItem key={product.code} value={product.code}>
                                  {product.name} ({product.interest_rate}% {product.interest_type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField control={form.control} name="selected_tier_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Tier *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={!selectedProduct}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select the policy tier" /></SelectTrigger></FormControl>
                          <SelectContent>{selectedProduct?.tiers?.map((tier) => <SelectItem key={tier.tier_id} value={tier.tier_id}>{tier.name} · ETB {tier.loan_amount_min_etb.toLocaleString()}–{tier.loan_amount_max_etb?.toLocaleString() || 'No ceiling'} · {tier.min_savings_duration_months} months</SelectItem>)}</SelectContent>
                        </Select>
                        <FormDescription>The officer selects the tier; the server validates every rule.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {selectedProduct && selectedTier && (
                      <div className="p-4 bg-muted rounded-lg text-sm space-y-1">
                        {selectedProduct.category && (
                          <p><span className="font-medium">Category:</span> {selectedProduct.category}</p>
                        )}
                        <p>
                          <span className="font-medium">Interest Type:</span>{" "}
                          {selectedProduct.interest_type}
                        </p>
                        <p>
                          <span className="font-medium">Term Range:</span>{" "}
                          {selectedProduct.min_term_months} – {selectedTier.max_term_months} months
                        </p>
                        <p>
                          <span className="font-medium">Penalty Rate:</span>{" "}
                          {selectedProduct.penalty_rate}%
                        </p>

                        {/* Tier / policy requirements */}
                        {selectedTier && (
                          <div className="mt-3 pt-3 border-t border-border space-y-1">
                            <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Member Requirements</p>
                            <p><span className="font-medium">Min Savings Duration:</span> {selectedTier.min_savings_duration_months} months</p>
                            {(selectedTier.loan_amount_min_etb != null || selectedTier.loan_amount_max_etb != null) && (
                              <p>
                                <span className="font-medium">Loan Range:</span>{" "}
                                {selectedTier.loan_amount_min_etb != null
                                  ? `ETB ${Number(selectedTier.loan_amount_min_etb).toLocaleString()}`
                                  : 'ETB 0'}{" "}
                                –{" "}
                                {selectedTier.loan_amount_max_etb != null
                                  ? `ETB ${Number(selectedTier.loan_amount_max_etb).toLocaleString()}`
                                  : 'No limit'}
                              </p>
                            )}
                            <p><span className="font-medium">Pre-Savings Required:</span> {selectedTier.required_pre_savings_pct}%</p>
                            <p><span className="font-medium">Share Purchase Required:</span> {selectedTier.required_share_purchase_pct}%</p>
                            <p><span className="font-medium">Eligible Savings Accounts:</span> {selectedTier.eligible_savings_products.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="applied_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loan Amount (ETB) *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="50000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="term_months"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Term (Months) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="24"
                                {...field}
                                min={selectedProduct?.min_term_months}
                                max={selectedTier?.max_term_months ?? selectedProduct?.max_term_months}
                              />
                            </FormControl>
                            {selectedProduct && (
                              <FormDescription>
                                Between {selectedProduct.min_term_months} and{" "}
                                {selectedTier?.max_term_months ?? selectedProduct.max_term_months} months
                              </FormDescription>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="rounded-lg border p-4 space-y-4">
                      <div>
                        <h3 className="font-semibold">Upfront Service Charge & Insurance</h3>
                        <p className="text-sm text-muted-foreground">Choose how the member will pay these fees. They are collected only when the loan is finally approved and disbursed.</p>
                      </div>
                      <FormField control={form.control} name="fee_payment_method" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fee Payment Method *</FormLabel>
                          <Select value={field.value} onValueChange={(value) => { field.onChange(value); if (value === 'DEDUCT_FROM_LOAN') setFeeReceipt(null); }}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="DEDUCT_FROM_LOAN">Deduct from Loan</SelectItem>
                              <SelectItem value="OUT_OF_POCKET">Pay Out-of-Pocket</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>{field.value === 'DEDUCT_FROM_LOAN' ? 'Fees reduce the amount delivered to the member.' : 'The member receives the full principal after a receipt is verified.'}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                      {watchedFeePaymentMethod === 'OUT_OF_POCKET' && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField control={form.control} name="fee_receipt_number" render={({ field }) => <FormItem><FormLabel>Receipt Number</FormLabel><FormControl><Input placeholder="Bank or cash receipt number" {...field} /></FormControl><FormMessage /></FormItem>} />
                          <div className="space-y-2">
                            <Label htmlFor="fee-receipt">Receipt File *</Label>
                            <Input id="fee-receipt" type="file" accept="image/*,.pdf" onChange={(event) => setFeeReceipt(event.target.files?.[0] || null)} />
                            <p className="text-xs text-muted-foreground">Upload an image or PDF receipt before submission.</p>
                          </div>
                        </div>
                      )}
                      <div className="grid gap-2 rounded-md bg-muted p-3 text-sm sm:grid-cols-2">
                        <div className="flex justify-between gap-3"><span>Gross loan</span><strong>ETB {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                        <div className="flex justify-between gap-3"><span>Service charge</span><strong>ETB {serviceCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                        <div className="flex justify-between gap-3"><span>Insurance held</span><strong>ETB {insurancePremium.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                        <div className="flex justify-between gap-3"><span>Total upfront fees</span><strong>ETB {totalUpfrontFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                        <div className="flex justify-between gap-3 border-t pt-2 sm:col-span-2"><span className="font-semibold">Member receives at disbursement</span><strong className={netDisbursement <= 0 ? 'text-destructive' : 'text-primary'}>ETB {netDisbursement.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="repayment_frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repayment Frequency *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MONTHLY">Monthly</SelectItem>
                              <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="purpose_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Purpose *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the purpose of this loan..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Minimum 10 characters</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-4 pt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={checkEligibility}
                        disabled={eligibilityLoading}
                        className="flex-1"
                      >
                        {eligibilityLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <AlertCircle className="mr-2 h-4 w-4" />
                        )}
                        Check Eligibility
                      </Button>
                    </div>

                    {eligibilityResult && (
                      <div className={`p-4 rounded-lg border ${eligibilityResult.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          {eligibilityResult.passed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className={`font-semibold ${eligibilityResult.passed ? 'text-green-700' : 'text-red-700'}`}>
                            {eligibilityResult.passed ? 'All Eligibility Checks Passed' : 'Eligibility Checks Failed'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {eligibilityResult.breakdown && <div className="mb-4 grid gap-3 rounded-lg border bg-background p-4 sm:grid-cols-2">
                            <div><p className="text-xs text-muted-foreground">Requested Amount</p><CurrencyDisplay amount={eligibilityResult.breakdown.requested_amount} className="font-semibold" /></div>
                            <div><p className="text-xs text-muted-foreground">Savings Duration</p><p className="font-semibold">{eligibilityResult.breakdown.savings_duration_months} months</p></div>
                            <div><p className="text-xs text-muted-foreground">Required / Actual Compulsory Savings</p><p className="font-semibold">ETB {eligibilityResult.breakdown.required_pre_savings_amount.toLocaleString()} / ETB {eligibilityResult.breakdown.eligible_savings_balance.toLocaleString()}</p><p className={eligibilityResult.breakdown.savings_deficit > 0 ? 'text-red-700' : 'text-green-700'}>Deficit: ETB {eligibilityResult.breakdown.savings_deficit.toLocaleString()}</p></div>
                            <div><p className="text-xs text-muted-foreground">Required / Accumulated Shares</p><p className="font-semibold">ETB {eligibilityResult.breakdown.required_share_amount.toLocaleString()} / ETB {eligibilityResult.breakdown.accumulated_share_balance.toLocaleString()}</p><p className={eligibilityResult.breakdown.share_deficit > 0 ? 'text-red-700' : 'text-green-700'}>Deficit: ETB {eligibilityResult.breakdown.share_deficit.toLocaleString()}</p></div>
                            <div className="sm:col-span-2 rounded bg-amber-50 p-3"><p className="text-xs text-amber-800">Final amount needed to satisfy savings and share policy</p><p className="text-xl font-bold text-amber-900">ETB {eligibilityResult.breakdown.total_upfront_deficit.toLocaleString()}</p><p className="text-xs text-amber-800">Informational only. This screen never deposits, withdraws, or transfers money.</p></div>
                          </div>}
                          {eligibilityResult.checks.map((check) => (
                            <div key={check.name} className="flex items-start gap-2 text-sm">
                              {check.pass ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                              )}
                              <div>
                                <span className={check.pass ? 'text-green-700' : 'text-red-700'}>
                                  {check.message || <>
                                  {check.name === 'status' && 'Member status is ACTIVE'}
                                  {check.name === 'income' && 'Member has monthly income'}
                                  {check.name === 'affordability' && `Monthly installment (ETB ${(check.data as any)?.installment?.toLocaleString() || 'N/A'}) does not exceed 1/3 of monthly income (ETB ${(check.data as any)?.maxInstallment?.toLocaleString() || 'N/A'})`}
                                  {check.name === 'savings_duration' && `Savings duration: ${(check.data as any)?.months_saved || 0} months (required: ${(check.data as any)?.required || 0} months)`}
                                  {check.name === 'pre_savings' && `Pre-savings balance: ETB ${(check.data as any)?.savings_balance?.toLocaleString() || '0'} (required: ETB ${(check.data as any)?.required_balance?.toLocaleString() || '0'})`}
                                  {check.name === 'loan_ceiling' && `Loan amount exceeds ceiling of ETB ${(check.data as any)?.ceiling?.toLocaleString() || 'N/A'}`}
                                  {check.name === 'loan_floor' && `Loan amount is below minimum of ETB ${(check.data as any)?.floor?.toLocaleString() || 'N/A'}`}
                                  </>}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 pt-4">
                      <Button type="submit" className="flex-1">
                        <FileText className="mr-2 h-4 w-4" />
                        {eligibilityResult && !eligibilityResult.passed ? 'Submit as Exception' : 'Submit Application'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/loans")}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-1 space-y-6">
            {flatCalc && selectedProduct?.interest_type === "FLAT" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Flat Interest Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Installment</p>
                    <CurrencyDisplay
                      amount={flatCalc.monthlyInstallment}
                      className="text-xl font-bold text-primary"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Interest</p>
                    <CurrencyDisplay amount={flatCalc.totalInterest} className="text-lg font-semibold" />
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Total Repayment</p>
                    <CurrencyDisplay
                      amount={flatCalc.totalRepayment}
                      className="text-2xl font-bold"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {decliningCalc && selectedProduct?.interest_type === "DECLINING" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Declining Balance Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Installment</p>
                    <CurrencyDisplay
                      amount={decliningCalc.monthlyInstallment}
                      className="text-xl font-bold text-primary"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Interest</p>
                    <CurrencyDisplay
                      amount={decliningCalc.totalInterest}
                      className="text-lg font-semibold"
                    />
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Total Repayment</p>
                    <CurrencyDisplay
                      amount={decliningCalc.totalRepayment}
                      className="text-2xl font-bold"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {insuranceQuote && amount > 0 && selectedMember && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader><CardTitle className="text-base">Loan Life Insurance</CardTitle><CardDescription>Calculated from the SACCO insurance matrix. The rate cannot exceed its age, term, and marital-status ceiling.</CardDescription></CardHeader>
                <CardContent className="space-y-2 text-sm"><p>Borrower age: <strong>{watchedAge}</strong> • {selectedMember.marital_status === 'MARRIED' ? 'Married' : 'Single'} • Term: <strong>{term} months</strong></p><p>Configured rate: <strong>{insuranceQuote.rate}%</strong> <span className="text-muted-foreground">(official ceiling {insuranceQuote.ceilingRate}%)</span></p><p>One-year premium: <strong>ETB {Number(insuranceQuote.premium).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></p>{insuranceQuote.annualRenewalRequired && <p className="text-amber-700">Annual renewal is required while the loan remains active.</p>}</CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Process Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                  <li className={eligibilityResult?.passed ? "text-green-600 font-medium" : ""}>
                    {eligibilityResult?.passed ? "✓ " : ""}Check eligibility
                  </li>
                  <li>Submit application for review</li>
                  <li>Add guarantors and collateral</li>
                  <li>Await manager approval</li>
                  <li>Loan disbursement</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Dialog open={exceptionDialogOpen} onOpenChange={setExceptionDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Failed Eligibility as an Exception?</DialogTitle><DialogDescription>The application will remain under review. One Manager/Admin and every assigned Board Member must explicitly accept the failed checks. No money will be moved.</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label htmlFor="exception-reason">Credit Officer Exception Reason *</Label><Textarea id="exception-reason" rows={5} value={exceptionReason} onChange={(event) => setExceptionReason(event.target.value)} placeholder="Explain why this application should be reviewed despite the failed policy checks..." /></div>
          <DialogFooter><Button variant="outline" onClick={() => setExceptionDialogOpen(false)}>Cancel</Button><Button variant="destructive" disabled={exceptionReason.trim().length < 10 || !pendingSubmission} onClick={async () => { if (!pendingSubmission) return; await submitApplication(pendingSubmission, exceptionReason.trim()); setExceptionDialogOpen(false); }}>Submit Exception</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewLoanApplication;
