import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { User, Account, Member } from "@/types";
import { api } from "@/lib/api";
import { generateIdempotencyKey, calculateAvailableBalance, validateWithdrawal, formatCurrency } from "@/lib/utils/financial";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, Search, X, Upload, RefreshCw, Coins } from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useDebounce } from "@/hooks/use-debounce";

const transactionSchema = z.object({
  account_id: z.string().min(1, "Please select an account"),
  type: z.enum(["DEPOSIT", "WITHDRAWAL", "SHARE_PURCHASE", "SHARE_REDEMPTION"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  reference: z.string().trim().min(1, "Reference is required").max(120, "Company receipt number must not exceed 120 characters"),
  bank_receipt_no: z.string().trim().max(160, "Bank receipt number is too long").optional(),
  remark: z.string().trim().max(2000, "Remark must not exceed 2,000 characters").optional(),
});

type TransactionForm = z.infer<typeof transactionSchema>;
const formatShareUnits = (value: string | number | null | undefined) => {
  const [whole = '0', fraction = ''] = String(value ?? '0').split('.');
  return `${whole}.${fraction.padEnd(8, '0').slice(0, 8)}`;
};

const NewTransaction = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [idempotencyKey] = useState(generateIdempotencyKey());
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [bankReceiptFile, setBankReceiptFile] = useState<File | null>(null);
  const [bankReceiptPreview, setBankReceiptPreview] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingReference, setIsCheckingReference] = useState(false);
  const receiptFileRef = useRef<HTMLInputElement>(null);
  const bankReceiptFileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Get transaction type from URL params
  const urlType = searchParams.get("type")?.toUpperCase();
  const allowedTypes = ["DEPOSIT", "WITHDRAWAL", "SHARE_PURCHASE", "SHARE_REDEMPTION"] as const;
  const defaultType = allowedTypes.includes(urlType as typeof allowedTypes[number]) ? urlType : "DEPOSIT";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: defaultType as TransactionForm["type"],
      account_id: "",
      reference: "",
      bank_receipt_no: "",
      remark: "",
    },
  });

  // Set type from URL on mount
  useEffect(() => {
    if (allowedTypes.includes(urlType as typeof allowedTypes[number])) {
      setValue("type", urlType as TransactionForm["type"]);
    }
  }, [urlType, setValue]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  // Search Members
  const { data: membersData } = useQuery({
    queryKey: ['members-search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return [];
      const res = await api.get<{ data: Member[] }>(`/members?search=${debouncedSearch}&limit=5`);
      return res.data.data;
    },
    enabled: !!debouncedSearch && !selectedMember
  });

  // Fetch Accounts for Selected Member
  const { data: accountsResponse, isLoading: loadingAccounts } = useQuery({
    queryKey: ['member-accounts', selectedMember?.member_id],
    queryFn: async () => {
      if (!selectedMember) return { data: [] };
      try {
        const res = await api.get<{ data: Account[] }>(`/accounts/member/${selectedMember.member_id}`);
        // Return the same structure as MemberDetail for consistency
        return res.data;
      } catch (error) {
        console.error('Error fetching accounts:', error);
        return { data: [] };
      }
    },
    enabled: !!selectedMember
  });

  // Extract accounts array from response
  const accountsData = accountsResponse?.data || [];

  const accountId = watch("account_id");
  const transactionType = watch("type");
  const amount = watch("amount");
  const isShareTransaction = transactionType === "SHARE_PURCHASE" || transactionType === "SHARE_REDEMPTION";
  const isWithdrawal = transactionType === "WITHDRAWAL" || transactionType === "SHARE_REDEMPTION";

  useEffect(() => {
    if (!accountsData.length) return;
    const eligible = accountsData.find((account) => isShareTransaction
      ? account.product_code === 'SHR_CAP' && account.status !== 'CLOSED'
      : account.product_code !== 'SHR_CAP' && account.status !== 'CLOSED');
    if (isShareTransaction) {
      setValue('account_id', eligible?.account_id || '');
    } else if (selectedAccount?.product_code === 'SHR_CAP') {
      setValue('account_id', '');
    }
  }, [accountsData, isShareTransaction, selectedAccount?.product_code, setValue]);

  const shareMemberIsActive = selectedMember?.status === 'ACTIVE';
  const { data: shareQuoteResponse, isFetching: loadingShareQuote, error: shareQuoteError } = useQuery({
    queryKey: ['share-quote', accountId, transactionType, amount],
    queryFn: async () => api.post<{ data: any }>('/shares/quote', {
      account_id: accountId,
      action: transactionType === 'SHARE_PURCHASE' ? 'PURCHASE' : 'REDEMPTION',
      amount: Number(amount).toFixed(2),
    }),
    enabled: isShareTransaction && shareMemberIsActive && !!accountId && Number(amount) > 0,
    retry: false,
  });
  const shareQuote = shareQuoteResponse?.data.data;
  const shareQuoteErrorMessage = (shareQuoteError as any)?.response?.data?.message
    || ((shareQuoteError as any)?.message && (shareQuoteError as any).message !== 'Network Error'
      ? (shareQuoteError as any).message
      : null);

  const checkReferenceAvailability = async (
    reference: string,
    field: "reference" | "bank_receipt_no" = "reference",
    required = true
  ) => {
    const cleanedReference = reference.trim();
    if (!cleanedReference) {
      if (required) {
        setError(field, { type: "required", message: "Reference / Receipt No. is required" });
        return false;
      }
      clearErrors(field);
      return true;
    }

    setIsCheckingReference(true);
    try {
      const response = await api.get<{ available: boolean; message: string }>("/financial-references/check", {
        params: { reference: cleanedReference },
      });
      if (!response.data.available) {
        setError(field, { type: "validate", message: response.data.message });
        return false;
      }
      clearErrors(field);
      return true;
    } catch (error: any) {
      setError(field, {
        type: "validate",
        message: error.response?.data?.message || "Unable to validate this reference number",
      });
      return false;
    } finally {
      setIsCheckingReference(false);
    }
  };

  useEffect(() => {
    if (accountId && accountsData) {
      const account = accountsData.find((a) => a.account_id === accountId);
      setSelectedAccount(account || null);
    }
  }, [accountId, accountsData]);

  const handleReceiptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBankReceiptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBankReceiptFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setBankReceiptPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: TransactionForm) => {
    if (!selectedAccount) return;

    if (!(await checkReferenceAvailability(data.reference))) return;
    if (data.bank_receipt_no && !(await checkReferenceAvailability(data.bank_receipt_no, "bank_receipt_no", false))) return;

    // For withdrawals: block on frozen or closed accounts
    if (data.type === 'WITHDRAWAL' || data.type === 'SHARE_REDEMPTION') {
      if (selectedAccount.status === 'FROZEN') {
        toast({
          title: "Withdrawal Blocked",
          description: "Cannot withdraw from a frozen account. Deposits are allowed.",
          variant: "destructive",
        });
        return;
      }
      if (selectedAccount.status === 'CLOSED') {
        toast({
          title: "Transaction Blocked",
          description: "Cannot perform transactions on a closed account.",
          variant: "destructive",
        });
        return;
      }
    }
    if (isShareTransaction && selectedAccount.status === 'FROZEN') {
      toast({
        title: "Share Transaction Blocked",
        description: "Share purchases and redemptions cannot be posted to a frozen Share Capital account.",
        variant: "destructive",
      });
      return;
    }
    if (isShareTransaction && selectedMember?.status !== 'ACTIVE') {
      toast({
        title: "Share Transaction Blocked",
        description: "Only an ACTIVE member may purchase or redeem shares.",
        variant: "destructive",
      });
      return;
    }
    
    // For deposits: only block on closed accounts (frozen accounts allow deposits)
    if ((data.type === 'DEPOSIT' || data.type === 'SHARE_PURCHASE') && selectedAccount.status === 'CLOSED') {
      toast({
        title: "Transaction Blocked",
        description: "Cannot perform transactions on a closed account.",
        variant: "destructive",
      });
      return;
    }

    // Set processing state
    setIsProcessing(true);
    
    // Show loading toast for withdrawals (which take longer)
    let loadingToast: { id: string | number; dismiss: () => void } | undefined;
    if (data.type === 'WITHDRAWAL' || data.type === 'SHARE_REDEMPTION') {
      loadingToast = toast({
        title: "Processing Withdrawal...",
        description: "This may take a few moments. Please wait...",
        duration: 0, // Don't auto-dismiss
      });
    }

    try {
      const endpoint = data.type === "DEPOSIT" ? "/transactions/deposit"
        : data.type === "WITHDRAWAL" ? "/transactions/withdraw"
          : data.type === "SHARE_PURCHASE" ? "/shares/purchases" : "/shares/redemptions";
      
      // Use multipart whenever either proof photo is present.
      if (receiptFile || bankReceiptFile) {
        const formData = new FormData();
        formData.append("account_id", data.account_id);
        formData.append("amount", data.amount.toString());
        formData.append("reference", data.reference || '');
        if (data.bank_receipt_no) formData.append("bank_receipt_no", data.bank_receipt_no);
        if (data.remark) formData.append("remark", data.remark);
        if (receiptFile) formData.append("company_receipt", receiptFile);
        if (bankReceiptFile) formData.append("bank_receipt", bankReceiptFile);
        
        await api.post(endpoint, formData, {
          headers: {
            "Idempotency-Key": idempotencyKey,
            "Content-Type": "multipart/form-data"
          }
        });
      } else {
        const payload = {
          account_id: data.account_id,
          amount: data.amount,
          reference: data.reference || '',
          bank_receipt_no: data.bank_receipt_no || undefined,
          remark: data.remark || undefined
        };
        
        await api.post(endpoint, payload, {
          headers: {
            "Idempotency-Key": idempotencyKey
          }
        });
      }

      // Dismiss loading toast if it exists
      if (loadingToast) {
        loadingToast.dismiss();
      }

      toast({
        title: "Transaction Successful",
        description: `${data.type.replaceAll('_', ' ')} of ${formatCurrency(data.amount)} completed.`,
      });

      // Reset form
      setReceiptFile(null);
      setReceiptPreview(null);
      setBankReceiptFile(null);
      setBankReceiptPreview(null);
      setAmountInput("");
      if (receiptFileRef.current) receiptFileRef.current.value = '';
      if (bankReceiptFileRef.current) bankReceiptFileRef.current.value = '';
      
      // Small delay to show success message before navigation
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (error: any) {
      // Dismiss loading toast if it exists
      if (loadingToast) {
        loadingToast.dismiss();
      }
      
      toast({
        title: "Transaction Failed",
        description: error.response?.data?.message || "Processing failed",
        variant: "destructive",
      });
    } finally {
      // Always reset processing state
      setIsProcessing(false);
    }
  };

  if (!user) return null;

  const availableBalance = selectedAccount
    ? Number(selectedAccount.balance) - Number(selectedAccount.lien_amount)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">New Transaction</h1>
            <p className="text-sm text-muted-foreground">Process savings and fractional share transactions</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Member Selection</CardTitle>
            <CardDescription>
              Search for a member to process {transactionType.replaceAll('_', ' ').toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedMember ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, member no, or phone (any format)..."
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
                        }}
                      >
                        <p className="font-medium">{member.first_name} {member.middle_name} {member.last_name}</p>
                        <p className="text-xs text-muted-foreground">{member.phone_primary} • {member.membership_no}</p>
                      </div>
                    ))}
                  </div>
                )}
                {!debouncedSearch && (
                  <p className="text-sm text-muted-foreground">Start typing to search for a member...</p>
                )}
              </div>
            ) : (
              <div className="flex justify-between items-center p-3 border rounded-md bg-accent/10">
                <div>
                  <p className="font-bold">{selectedMember.first_name} {selectedMember.middle_name} {selectedMember.last_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedMember.membership_no} • {selectedMember.phone_primary}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  setSelectedMember(null);
                  setSelectedAccount(null);
                  setValue("account_id", "");
                  setSearchQuery("");
                }}>
                  <X className="h-4 w-4 mr-1" /> Change
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedMember && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
              <CardDescription>
                Idempotency Key: <span className="font-mono text-xs">{idempotencyKey}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant={transactionType === "DEPOSIT" ? "default" : "outline"}
                    className="h-20"
                    onClick={() => setValue("type", "DEPOSIT")}
                  >
                    <ArrowUpCircle className="mr-2 h-5 w-5" />
                    Deposit
                  </Button>
                  <Button
                    type="button"
                    variant={transactionType === "WITHDRAWAL" ? "default" : "outline"}
                    className="h-20"
                    onClick={() => setValue("type", "WITHDRAWAL")}
                  >
                    <ArrowDownCircle className="mr-2 h-5 w-5" />
                    Withdrawal
                  </Button>
                  <Button
                    type="button"
                    variant={transactionType === "SHARE_PURCHASE" ? "default" : "outline"}
                    className="h-20"
                    onClick={() => setValue("type", "SHARE_PURCHASE")}
                  >
                    <Coins className="mr-2 h-5 w-5" />
                    Share Purchase
                  </Button>
                  <Button
                    type="button"
                    variant={transactionType === "SHARE_REDEMPTION" ? "default" : "outline"}
                    className="h-20"
                    onClick={() => setValue("type", "SHARE_REDEMPTION")}
                  >
                    <Coins className="mr-2 h-5 w-5" />
                    Share Redemption
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share transactions use the dedicated SHR_CAP account and record fractional ownership. They are member equity, not SACCO revenue.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_id">Select Account</Label>
                {loadingAccounts ? (
                  <div className="p-4 border rounded-md bg-muted/50">
                    <p className="text-sm text-muted-foreground">Loading accounts...</p>
                  </div>
                ) : accountsData && accountsData.length === 0 ? (
                  <div className="p-4 border rounded-md bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      No accounts found for this member. Please create an account first.
                    </p>
                  </div>
                ) : selectedMember && selectedMember.status === 'PENDING' && isWithdrawal ? (
                  <div className="p-4 border rounded-md bg-warning/10 border-warning/20">
                    <p className="text-sm font-medium text-warning">
                      ⚠️ Pending Member - Activate First
                    </p>
                    <p className="text-xs text-warning/80 mt-1">
                      This member is pending activation. Withdrawals are not allowed until the member is activated by a manager.
                    </p>
                  </div>
                ) : (
                  <Select
                    value={accountId || ""}
                    onValueChange={(value) => setValue("account_id", value)}
                    disabled={isShareTransaction || (selectedMember?.status === 'PENDING' && isWithdrawal)}
                  >
                    <SelectTrigger id="account_id">
                      <SelectValue placeholder="Choose an account" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(accountsData) && accountsData.length > 0 ? (
                        accountsData
                          .filter(account => account.status !== 'CLOSED')
                          .filter(account => isShareTransaction ? account.product_code === 'SHR_CAP' : account.product_code !== 'SHR_CAP')
                          .map((account) => (
                            <SelectItem key={account.account_id} value={account.account_id}>
                              {account.product_code} - {formatCurrency(account.balance)}
                              {account.status === 'FROZEN' && ' (Frozen)'}
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="no-accounts" disabled>
                          No accounts available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
                {errors.account_id && (
                  <p className="text-sm text-destructive">{errors.account_id.message}</p>
                )}
                {isShareTransaction && selectedMember?.status !== 'ACTIVE' && (
                  <div className="rounded-md border border-warning/30 bg-warning/10 p-3">
                    <p className="text-sm font-medium text-warning">Share transaction unavailable</p>
                    <p className="mt-1 text-xs text-warning/90">
                      This member is {String(selectedMember?.status || 'not active').replaceAll('_', ' ')}. Activate the member before purchasing or redeeming shares.
                    </p>
                  </div>
                )}
              </div>

              {selectedAccount && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                  {selectedAccount.status === 'FROZEN' && (isWithdrawal || isShareTransaction) && (
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-md mb-2">
                      <p className="text-sm font-medium text-warning">
                        ⚠️ Account is FROZEN
                      </p>
                      <p className="text-xs text-warning/80 mt-1">
                        {isShareTransaction ? 'Share purchases and redemptions are not allowed on frozen Share Capital accounts.' : 'Withdrawals are not allowed on frozen accounts. Deposits are allowed.'}
                      </p>
                    </div>
                  )}
                  {selectedAccount.status === 'CLOSED' && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md mb-2">
                      <p className="text-sm font-medium text-destructive">
                        ⚠️ Account is CLOSED
                      </p>
                      <p className="text-xs text-destructive/80 mt-1">
                        Transactions are not allowed on closed accounts.
                      </p>
                    </div>
                  )}
                  {selectedMember?.status === 'PENDING' && isWithdrawal && (
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-md mb-2">
                      <p className="text-sm font-medium text-warning">
                        ⚠️ Pending Member
                      </p>
                      <p className="text-xs text-warning/80 mt-1">
                        This member must be activated by a manager before withdrawals can be processed.
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Balance:</span>
                    <CurrencyDisplay amount={selectedAccount.balance} className="text-sm" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Lien Amount:</span>
                    <CurrencyDisplay amount={selectedAccount.lien_amount} className="text-sm" variant="muted" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Account Status:</span>
                    <StatusBadge status={selectedAccount.status} />
                  </div>
                  {selectedMember && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Member Status:</span>
                      <StatusBadge status={selectedMember.status} />
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span className="text-sm">Available Balance:</span>
                    <CurrencyDisplay amount={availableBalance} className="text-sm" variant="positive" />
                  </div>
                  {selectedAccount.product_code === 'SHR_CAP' && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Fractional Shares:</span>
                      <span className="font-mono text-sm font-semibold">{formatShareUnits(selectedAccount.share_unit_balance)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (ETB)</Label>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only numbers and decimal point
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setAmountInput(value);
                      // Convert to number only for validation, preserve the exact string
                      if (value === "") {
                        setValue("amount", undefined as any, { shouldValidate: false });
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          setValue("amount", numValue, { shouldValidate: true });
                        }
                      }
                    }
                  }}
                  onBlur={() => {
                    // Only validate on blur, don't reformat the value
                    if (amountInput && !isNaN(parseFloat(amountInput))) {
                      setValue("amount", parseFloat(amountInput), { shouldValidate: true });
                    }
                  }}
                  className="text-lg font-mono"
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">SACCO / Company Receipt No. <span className="text-destructive">*</span></Label>
                <Input
                  id="reference"
                  placeholder="e.g., SACCO-RCPT-2026-001"
                  {...register("reference", {
                    onChange: () => clearErrors("reference"),
                    onBlur: (event) => void checkReferenceAvailability(event.target.value),
                  })}
                />
                {isCheckingReference && (
                  <p className="text-xs text-muted-foreground">Checking receipt number...</p>
                )}
                {errors.reference && (
                  <p className="text-sm text-destructive">{errors.reference.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt">SACCO / Company Receipt Photo <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={receiptFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleReceiptChange}
                    id="receipt"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => receiptFileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {receiptPreview ? 'Replace Company Receipt' : 'Upload Company Receipt'}
                  </Button>
                  {receiptPreview && (
                    <div className="relative">
                      <img
                        src={receiptPreview}
                        alt="Company receipt preview"
                        className="h-20 w-auto object-contain border rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => {
                          setReceiptFile(null);
                          setReceiptPreview(null);
                          if (receiptFileRef.current) receiptFileRef.current.value = '';
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Internal SACCO/company receipt or voucher copy.</p>
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <div>
                  <p className="font-medium">Bank Proof</p>
                  <p className="text-xs text-muted-foreground">External bank receipt details for a bank-paid transaction.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_receipt_no">Bank Receipt No. <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                  <Input
                    id="bank_receipt_no"
                    placeholder="e.g., BANK-TRX-2026-001"
                    {...register("bank_receipt_no", {
                      onChange: () => clearErrors("bank_receipt_no"),
                      onBlur: (event) => void checkReferenceAvailability(event.target.value, "bank_receipt_no", false),
                    })}
                  />
                  {errors.bank_receipt_no && <p className="text-sm text-destructive">{errors.bank_receipt_no.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_receipt">Bank Receipt Photo <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                  <div className="flex flex-wrap items-center gap-4">
                    <input ref={bankReceiptFileRef} id="bank_receipt" type="file" accept="image/*" className="hidden" onChange={handleBankReceiptChange} />
                    <Button type="button" variant="outline" onClick={() => bankReceiptFileRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      {bankReceiptPreview ? "Replace Bank Receipt" : "Upload Bank Receipt"}
                    </Button>
                    {bankReceiptPreview && (
                      <div className="relative">
                        <img src={bankReceiptPreview} alt="Bank receipt preview" className="h-20 w-auto object-contain border rounded-lg" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => {
                            setBankReceiptFile(null);
                            setBankReceiptPreview(null);
                            if (bankReceiptFileRef.current) bankReceiptFileRef.current.value = '';
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remark">Reason / Remark <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <Textarea id="remark" placeholder="Reason for the transaction or additional notes..." rows={3} {...register("remark")} />
                {errors.remark && <p className="text-sm text-destructive">{errors.remark.message}</p>}
              </div>

              {amount > 0 && selectedAccount && isShareTransaction && (
                <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                  <p className="mb-2 text-sm font-semibold">Fractional Share Preview</p>
                  {!shareMemberIsActive ? (
                    <p className="text-sm text-destructive">
                      This member is {String(selectedMember?.status || 'not active').replaceAll('_', ' ')}. Only ACTIVE members may purchase or redeem shares.
                    </p>
                  ) : loadingShareQuote ? <p className="text-sm text-muted-foreground">Calculating from the share ledger…</p> : shareQuote ? (
                    <div className="space-y-1 text-sm">
                      {shareQuote.share_price && <div className="flex justify-between"><span>Price for this purchase:</span><span>{formatCurrency(Number(shareQuote.share_price))}</span></div>}
                      <div className="flex justify-between"><span>{transactionType === 'SHARE_PURCHASE' ? 'Units purchased:' : 'Units redeemed:'}</span><span className="font-mono">{shareQuote.unit_change}</span></div>
                      <div className="flex justify-between"><span>Units after:</span><span className="font-mono font-semibold">{shareQuote.units_after}</span></div>
                      <div className="flex justify-between"><span>ETB balance after:</span><span>{formatCurrency(Number(shareQuote.balance_after))}</span></div>
                      {shareQuote.fifo_lots?.length > 0 && <p className="pt-2 text-xs text-muted-foreground">Redemption uses {shareQuote.fifo_lots.length} oldest purchase lot(s) at their original paid prices.</p>}
                    </div>
                  ) : shareQuoteErrorMessage ? (
                    <p className="text-sm text-destructive">{shareQuoteErrorMessage}</p>
                  ) : (
                    <p className="text-sm text-destructive">Unable to calculate this share transaction. Verify the amount and try again.</p>
                  )}
                </div>
              )}

              {amount > 0 && selectedAccount && !isShareTransaction && (
                <div className="rounded-lg border-2 border-accent/20 bg-accent-light p-4">
                  <p className="text-sm font-semibold mb-2">Transaction Preview:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium">{transactionType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <CurrencyDisplay amount={amount} className="font-medium" />
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>New Balance:</span>
                      <CurrencyDisplay
                        amount={
                          transactionType === "DEPOSIT"
                              ? Number(selectedAccount.balance) + amount
                              : Number(selectedAccount.balance) - amount
                        }
                        variant={transactionType === "DEPOSIT" ? "positive" : "default"}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={
                isSubmitting || 
                isProcessing ||
                isCheckingReference ||
                !selectedAccount || 
                selectedAccount.status === 'CLOSED' ||
                (isWithdrawal && selectedAccount.status === 'FROZEN') ||
                (isWithdrawal && selectedMember?.status === 'PENDING') ||
                (isShareTransaction && !shareMemberIsActive) ||
                (isShareTransaction && !shareQuote)
              }
            >
              {(isSubmitting || isProcessing || isCheckingReference) ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {isCheckingReference ? "Checking reference..." : "Processing..."}
                </>
              ) : selectedAccount && selectedAccount.status === 'CLOSED' ? (
                "Cannot process - Account is CLOSED"
              ) : selectedAccount && isWithdrawal && selectedAccount.status === 'FROZEN' ? (
                "Cannot withdraw - Account is FROZEN"
              ) : selectedMember && isWithdrawal && selectedMember.status === 'PENDING' ? (
                "Cannot withdraw - Member is PENDING"
              ) : (
                "Submit Transaction"
              )}
            </Button>
          </div>
        </form>
        )}
      </main>
    </div>
  );
};

export default NewTransaction;
