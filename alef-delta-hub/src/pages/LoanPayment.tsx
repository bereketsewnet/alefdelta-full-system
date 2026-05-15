import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Member, LoanApplication } from "@/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModernHeader } from "@/components/shared/ModernHeader";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { Search, X, Upload, DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { Badge } from "@/components/ui/badge";

interface LoanPaymentSummary {
  loan_id: string;
  loan_amount: number;
  interest_type: string;
  interest_rate: number;
  term_months: number;
  outstanding_balance: number;
  total_paid: number;
  payments_made: number;
  principal_paid: number;
  interest_paid: number;
  penalty_paid: number;
  current_penalty: number;
  missed_months: number;
  expected_payment: {
    principal: number;
    interest: number;
    total: number;
  };
  next_payment_date: string | null;
  last_payment_date: string | null;
  is_fully_paid: boolean;
  is_overdue: boolean;
}

const LoanPayment = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [bankReceiptNo, setBankReceiptNo] = useState("");
  const [companyReceiptNo, setCompanyReceiptNo] = useState("");
  const [notes, setNotes] = useState("");
  const [bankReceiptFile, setBankReceiptFile] = useState<File | null>(null);
  const [bankReceiptPreview, setBankReceiptPreview] = useState<string | null>(null);
  const bankReceiptFileRef = useRef<HTMLInputElement>(null);

  const [companyReceiptFile, setCompanyReceiptFile] = useState<File | null>(null);
  const [companyReceiptPreview, setCompanyReceiptPreview] = useState<string | null>(null);
  const companyReceiptFileRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      if (!["TELLER", "MANAGER", "ADMIN"].includes(userData.role)) {
        navigate("/dashboard");
      }
    }
  }, [navigate]);

  // Search Members
  const { data: membersData } = useQuery({
    queryKey: ['members-search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return [];
      const res = await api.get<{ data: Member[] }>(`/members?search=${debouncedSearch}&status=ACTIVE&limit=10`);
      return res.data.data;
    },
    enabled: !!debouncedSearch && !selectedMember && !!user
  });

  // Fetch member's active loans
  const { data: memberLoans } = useQuery({
    queryKey: ['member-loans', selectedMember?.member_id],
    queryFn: async () => {
      const res = await api.get<{ data: LoanApplication[] }>(
        `/loans?member_id=${selectedMember?.member_id}&workflow_status=APPROVED`
      );
      return res.data.data;
    },
    enabled: !!selectedMember
  });

  // Fetch loan payment summary
  const { data: paymentSummary, refetch: refetchSummary } = useQuery({
    queryKey: ['loan-payment-summary', selectedLoan?.loan_id],
    queryFn: async () => {
      const res = await api.get<LoanPaymentSummary>(`/loans/${selectedLoan?.loan_id}/repayments/summary`);
      return res.data;
    },
    enabled: !!selectedLoan
  });

  const paymentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.post(`/loans/${selectedLoan?.loan_id}/repayments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Payment Successful",
        description: `Payment of ETB ${paymentAmount} processed successfully`
      });
      queryClient.invalidateQueries({ queryKey: ['loan-payment-summary'] });
      queryClient.invalidateQueries({ queryKey: ['member-loans'] });
      refetchSummary();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to process payment",
        variant: "destructive"
      });
    }
  });

  const handleBankReceiptFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBankReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBankReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompanyReceiptFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCompanyReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setPaymentAmount("");
    setPaymentMethod("CASH");
    setBankReceiptNo("");
    setCompanyReceiptNo("");
    setNotes("");
    setBankReceiptFile(null);
    setBankReceiptPreview(null);
    if (bankReceiptFileRef.current) bankReceiptFileRef.current.value = '';

    setCompanyReceiptFile(null);
    setCompanyReceiptPreview(null);
    if (companyReceiptFileRef.current) companyReceiptFileRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!selectedLoan || !paymentAmount) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Payment amount must be greater than zero",
        variant: "destructive"
      });
      return;
    }

    if (!bankReceiptNo.trim() || !bankReceiptFile) {
      toast({
        title: "Error",
        description: "Bank receipt number and bank receipt photo are required",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append('amount', amount.toString());
    formData.append('payment_method', paymentMethod);
    formData.append('bank_receipt_no', bankReceiptNo.trim());
    if (companyReceiptNo) formData.append('company_receipt_no', companyReceiptNo);
    if (notes) formData.append('notes', notes);
    if (bankReceiptFile) formData.append('bank_receipt', bankReceiptFile);
    if (companyReceiptFile) formData.append('company_receipt', companyReceiptFile);

    paymentMutation.mutate(formData);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Loan Payment"
        subtitle="Process loan repayments for members"
        onBack={() => navigate("/dashboard")}
      />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Member & Loan Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Select Member & Loan</CardTitle>
                <CardDescription>Search for member with active loan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Member Search */}
                {!selectedMember ? (
                  <div className="space-y-2">
                    <Label>Search Member</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Name, phone, or member no..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        autoFocus
                      />
                    </div>
                    {debouncedSearch && !membersData && (
                      <p className="text-sm text-muted-foreground">Searching...</p>
                    )}
                    {debouncedSearch && membersData && membersData.length === 0 && (
                      <p className="text-sm text-muted-foreground">No members found</p>
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
                              setSelectedLoan(null);
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
                        Start typing to search...
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <Label>Selected Member</Label>
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted mt-2">
                      <div className="flex-1">
                        <p className="font-medium">{selectedMember.first_name} {selectedMember.middle_name} {selectedMember.last_name}</p>
                        <p className="text-xs text-muted-foreground">{selectedMember.phone_primary}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMember(null);
                          setSelectedLoan(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Loan Selection */}
                {selectedMember && (
                  <div>
                    <Label>Select Active Loan</Label>
                    {!memberLoans || memberLoans.length === 0 ? (
                      <p className="text-sm text-muted-foreground mt-2 p-3 border rounded">
                        No active loans found for this member
                      </p>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {memberLoans.map(loan => (
                          <div
                            key={loan.loan_id}
                            className={`p-3 border rounded-md cursor-pointer transition-all ${
                              selectedLoan?.loan_id === loan.loan_id
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-accent'
                            }`}
                            onClick={() => setSelectedLoan(loan)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{loan.product_code}</p>
                                <p className="text-xs text-muted-foreground">
                                  ETB {loan.approved_amount?.toLocaleString()}
                                </p>
                              </div>
                              <Badge>{loan.workflow_status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment Form & Summary */}
          <div className="lg:col-span-2 space-y-6">
            {selectedLoan && paymentSummary ? (
              <>
                {/* Payment Summary Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Loan Payment Summary</span>
                      {paymentSummary.is_fully_paid && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Fully Paid
                        </Badge>
                      )}
                      {paymentSummary.is_overdue && (
                        <Badge variant="destructive">
                          Overdue ({paymentSummary.missed_months} months)
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Loan Amount</p>
                        <CurrencyDisplay amount={paymentSummary.loan_amount} className="text-lg font-bold" />
                      </div>
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Outstanding</p>
                        <CurrencyDisplay amount={paymentSummary.outstanding_balance} className="text-lg font-bold text-orange-700" />
                      </div>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
                        <CurrencyDisplay amount={paymentSummary.total_paid} className="text-lg font-bold text-green-700" />
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Payments Made</p>
                        <p className="text-lg font-bold text-blue-700">{paymentSummary.payments_made}</p>
                      </div>
                    </div>

                    {/* Expected Payment Details */}
                    <div className="mt-4 p-4 border rounded-lg bg-card">
                      <p className="font-medium mb-3">Expected Monthly Payment</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Principal</p>
                          <CurrencyDisplay amount={paymentSummary.expected_payment.principal} className="font-semibold" />
                        </div>
                        <div>
                          <p className="text-muted-foreground">Interest</p>
                          <CurrencyDisplay amount={paymentSummary.expected_payment.interest} className="font-semibold" />
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <CurrencyDisplay amount={paymentSummary.expected_payment.total} className="font-semibold text-primary" />
                        </div>
                      </div>
                    </div>

                    {/* Penalty Warning */}
                    {paymentSummary.current_penalty > 0 && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-900">Penalty Due</p>
                            <p className="text-sm text-red-700 mt-1">
                              <CurrencyDisplay amount={paymentSummary.current_penalty} className="font-bold" /> penalty for {paymentSummary.missed_months} missed payment(s)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Next Payment Date */}
                    {paymentSummary.next_payment_date && (
                      <div className="mt-3 text-sm">
                        <span className="text-muted-foreground">Next Payment Due: </span>
                        <span className="font-medium">{new Date(paymentSummary.next_payment_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Form */}
                {!paymentSummary.is_fully_paid && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Process Payment</CardTitle>
                      <CardDescription>Enter payment details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="amount">
                          Payment Amount <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative mt-1">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPaymentAmount(paymentSummary.expected_payment.total.toString())}
                          >
                            Expected: <CurrencyDisplay amount={paymentSummary.expected_payment.total} className="ml-1" />
                          </Button>
                          {paymentSummary.current_penalty > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setPaymentAmount((paymentSummary.expected_payment.total + paymentSummary.current_penalty).toString())}
                            >
                              With Penalty: <CurrencyDisplay amount={paymentSummary.expected_payment.total + paymentSummary.current_penalty} className="ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="payment_method">Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger id="payment_method" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH">Cash</SelectItem>
                            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                            <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                            <SelectItem value="CHECK">Check</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="bank_receipt_no">Bank Receipt Number <span className="text-destructive">*</span></Label>
                        <Input
                          id="bank_receipt_no"
                          value={bankReceiptNo}
                          onChange={(e) => setBankReceiptNo(e.target.value)}
                          placeholder="BANK-REC-2024-001"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="bank_receipt">Bank Receipt Photo <span className="text-destructive">*</span></Label>
                        <Input
                          ref={bankReceiptFileRef}
                          id="bank_receipt"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleBankReceiptFileChange}
                          className="mt-1"
                        />
                        {bankReceiptPreview && (
                          <div className="mt-2">
                            <img src={bankReceiptPreview} alt="Bank receipt" className="w-full h-32 object-contain border rounded" />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="company_receipt_no">Company Receipt Number (Optional)</Label>
                        <Input
                          id="company_receipt_no"
                          value={companyReceiptNo}
                          onChange={(e) => setCompanyReceiptNo(e.target.value)}
                          placeholder="COMP-REC-2024-001"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="company_receipt">Company Receipt Photo (Optional)</Label>
                        <Input
                          ref={companyReceiptFileRef}
                          id="company_receipt"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleCompanyReceiptFileChange}
                          className="mt-1"
                        />
                        {companyReceiptPreview && (
                          <div className="mt-2">
                            <img src={companyReceiptPreview} alt="Company receipt" className="w-full h-32 object-contain border rounded" />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Additional notes..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>

                      <Button
                        onClick={handleSubmit}
                        disabled={paymentMutation.isPending}
                        className="w-full"
                        size="lg"
                      >
                        {paymentMutation.isPending ? (
                          "Processing..."
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Process Payment
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Select a member and loan to process payment</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoanPayment;


