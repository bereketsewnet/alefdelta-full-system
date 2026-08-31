import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { User, LoanApplication, Member, EligibilityCheck, LoanProduct } from "@/types";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { ModernHeader } from "@/components/shared/ModernHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, AlertTriangle, User as UserIcon, Plus, Upload, X, Trash2, Edit, FileText, Pencil } from "lucide-react";
import { calculateFlatInterest, calculateDecliningInterest, checkAffordability } from "@/lib/utils/financial";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils/financial";

// Helper function to get full image URL
// Images are served at /uploads (not /api/uploads), so we need to remove /api from base URL
const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  let apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://sacco-api.alefdelta.com/api';
  // Remove /api from the end if present, since images are served directly at /uploads
  apiBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
};

const LoanDetail = () => {
  const [user, setUser] = useState<User | null>(null);
  const [auditNote, setAuditNote] = useState("");
  const [overrideAcknowledged, setOverrideAcknowledged] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [closureOpen, setClosureOpen] = useState(false);
  const [insuranceClaimMade, setInsuranceClaimMade] = useState<'YES' | 'NO'>('NO');
  const [insuranceClosureReason, setInsuranceClosureReason] = useState('');
  const closurePromptedFor = useRef<string | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  // 1. Fetch Loan
  const { data: loan, isLoading: loadingLoan, refetch: refetchLoan } = useQuery({
    queryKey: ['loan', id],
    queryFn: async () => {
      const res = await api.get<LoanApplication>(`/loans/${id}`);
      return res.data;
    },
    enabled: !!id && !!user
  });

  // 2. Fetch Member (dependent on loan)
  const { data: member } = useQuery({
    queryKey: ['member', loan?.member_id],
    queryFn: async () => {
      const res = await api.get<Member>(`/members/${loan?.member_id}`);
      return res.data;
    },
    enabled: !!loan?.member_id
  });

  // 3. Fetch Loan Products from database
  const { data: loanProductsData } = useQuery({
    queryKey: ['loan-products'],
    queryFn: async () => {
      const res = await api.get<{ data: LoanProduct[] }>('/loan-products');
      return res.data.data || [];
    },
    enabled: !!user
  });

  const loanProducts = loanProductsData || [];

  // 4. Fetch the persisted eligibility evaluation. Refresh is deliberately manual.
  const { data: approvalStatus, refetch: refetchApprovalStatus } = useQuery({
    queryKey: ['loan-approval-status', id],
    queryFn: async () => {
      const res = await api.get<any>(`/loans/${id}/approval-status`);
      return res.data;
    },
    enabled: !!loan
  });
  const eligibility: EligibilityCheck | undefined = approvalStatus?.current_evaluation?.result_snapshot;

  useEffect(() => {
    const canResolve = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    if (canResolve && loan?.is_fully_paid && loan.workflow_status === 'APPROVED' && closurePromptedFor.current !== loan.loan_id) {
      closurePromptedFor.current = loan.loan_id;
      setClosureOpen(true);
    }
  }, [loan, user]);

  if (!user) return null;
  if (loadingLoan) return <div className="p-8 text-center">Loading loan details...</div>;

  if (!loan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Loan Not Found</CardTitle>
            <CardDescription>The requested loan application does not exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/loans")}>Back to Loans</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const product = loanProducts.find((p) => p.code === loan.product_code);

  // Fallback if member or product not yet loaded
  if (!member || !product) return <div className="p-8 text-center">Loading related data...</div>;

  // Client-side affordability check (Backend might do this too, but good for display)
  const affordability = checkAffordability(
    Number(member.monthly_income) || 0,
    Number(loan.applied_amount) || 0,
    Number(loan.term_months) || 1,
    Number(loan.interest_rate) || 0,
    (product.interest_type || 'FLAT') as "FLAT" | "DECLINING"
  );

  const flatCalc = calculateFlatInterest(
    Number(loan.applied_amount) || 0,
    Number(loan.interest_rate) || 0,
    Number(loan.term_months) || 1
  );

  const decliningCalc = calculateDecliningInterest(
    Number(loan.applied_amount) || 0,
    Number(loan.interest_rate) || 0,
    Number(loan.term_months) || 1
  );

  const handleApprove = async () => {
    if (!auditNote.trim()) {
      toast({
        title: "Audit Note Required",
        description: "Please provide a note for the approval.",
        variant: "destructive",
      });
      return;
    }
    if (eligibility && !eligibility.passed && (!overrideAcknowledged || overrideReason.trim().length < 10)) {
      toast({ title: 'Exception Acknowledgement Required', description: 'Confirm the failed checks and provide an override reason of at least 10 characters.', variant: 'destructive' });
      return;
    }

    try {
      await api.post(`/loans/${id}/approve`, {
        approved_amount: loan.applied_amount, // Manager can override this if UI supported editing
        term_months: loan.term_months,
        interest_rate: loan.interest_rate,
        audit_note: auditNote,
        override_acknowledged: overrideAcknowledged,
        override_reason: overrideReason || null
      });

    toast({
      title: "Loan Approved",
        description: `Loan ${loan.loan_id} has been approved.`,
    });
    
      navigate("/loans");
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error.response?.data?.message || "Failed to approve loan.",
        variant: "destructive",
      });
    }
  };

  const handleRefreshEligibility = async () => {
    try {
      await api.post(`/loans/${id}/eligibility/refresh`);
      setOverrideAcknowledged(false);
      setOverrideReason('');
      await refetchApprovalStatus();
      toast({ title: 'Validation Refreshed', description: 'Current balances were checked and all earlier approval votes were reset.' });
    } catch (error: any) {
      toast({ title: 'Refresh Failed', description: error.response?.data?.message || 'Could not refresh eligibility.', variant: 'destructive' });
    }
  };

  const handleReject = async () => {
    if (!auditNote.trim()) {
      toast({
        title: "Audit Note Required",
        description: "Please provide a note for the rejection.",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.put(`/loans/${id}/status`, {
        workflow_status: 'REJECTED', reason: auditNote
      });
      
      toast({
        title: "Loan Rejected",
        description: "The loan application has been rejected.",
      });
      
      // Refetch to update UI
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reject loan",
        variant: "destructive",
      });
    }
  };

  const handleCloseLoan = async () => {
    if (insuranceClaimMade === 'YES' && insuranceClosureReason.trim().length < 10) {
      toast({ title: 'Claim Reason Required', description: 'Describe the insurance claim in at least 10 characters.', variant: 'destructive' });
      return;
    }
    try {
      await api.post(`/loans/${id}/closure`, {
        insurance_claim_made: insuranceClaimMade === 'YES',
        reason: insuranceClosureReason.trim() || null,
        idempotency_key: `LOAN_CLOSE:${id}:${crypto.randomUUID()}`
      });
      setClosureOpen(false);
      await refetchLoan();
      toast({ title: 'Loan Closed', description: insuranceClaimMade === 'YES' ? 'Insurance was marked utilized and excluded from profit.' : 'Unused insurance was recognized as distributable revenue.' });
    } catch (error: any) {
      toast({ title: 'Closure Failed', description: error.response?.data?.message || 'Could not close the loan.', variant: 'destructive' });
    }
  };

  const isManagerOrAdmin = user.role === "MANAGER" || user.role === "ADMIN" || user.role === "BOARD_MEMBER";
  const canCloseLoan = user.role === 'MANAGER' || user.role === 'ADMIN';
  const loanNotYetApproved = loan.workflow_status !== "APPROVED";
  const loanAwaitingApproval = loan.workflow_status === "UNDER_REVIEW" || loan.workflow_status === "PENDING";
  
  const canApprove = isManagerOrAdmin && loanAwaitingApproval;
  const canReject = canApprove || (user.role === 'CREDIT_OFFICER' && loan.created_by_user_id === user.user_id && loanAwaitingApproval);
  const isAlreadyApproved = loan.workflow_status === "APPROVED" || loan.workflow_status === "CLOSED";

  // Mapping backend eligibility response to frontend UI structure
  const statusCheck = eligibility?.checks?.find((c: any) => c.name === 'status');
  const incomeCheck = eligibility?.checks?.find((c: any) => c.name === 'income');
  const affordabilityCheck = eligibility?.checks?.find((c: any) => c.name === 'affordability');
  
  // Use backend affordability data if available, otherwise use client-side calculation
  const backendInstallment = affordabilityCheck?.data?.installment;
  const backendMaxInstallment = affordabilityCheck?.data?.maxInstallment;
  const useBackendData = backendInstallment !== undefined && backendInstallment !== null;
  
  const eligibilityDisplay = eligibility ? {
    membershipActive: statusCheck?.pass ?? false,
    hasIncome: incomeCheck?.pass ?? false,
    affordable: affordabilityCheck?.pass ?? false,
    eligible: eligibility.passed,
    checks: eligibility.checks || [],
    backendInstallment: backendInstallment,
    backendMaxInstallment: backendMaxInstallment
  } : {
    membershipActive: member.status === 'ACTIVE',
    hasIncome: (member.monthly_income || 0) > 0,
    affordable: affordability.affordable,
    eligible: true,
    checks: [],
    backendInstallment: null,
    backendMaxInstallment: null
  };

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Loan Application Review"
        subtitle={loan.loan_id}
        onBack={() => navigate("/loans")}
        actions={<StatusBadge status={loan.workflow_status} />}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Applicant Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Applicant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.membership_no}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span>{member.member_type.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Income</span>
                  <CurrencyDisplay amount={member.monthly_income} className="text-sm" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={member.status} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Loan Product</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.code}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Interest Rate</span>
                  <span>{product.interest_rate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="outline">{product.interest_type}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <span>{product.category}</span>
                </div>
              </CardContent>
            </Card>

            {/* Eligibility Check */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">Eligibility Policy <Button size="sm" variant="outline" onClick={handleRefreshEligibility} disabled={!isManagerOrAdmin || isAlreadyApproved}>Refresh Validation</Button></CardTitle>
                <CardDescription>Uses the saved evaluation until an authorized reviewer manually refreshes it. Refreshing resets all approval votes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {eligibility?.breakdown && <div className="grid gap-2 rounded border p-3 text-sm sm:grid-cols-2"><p>Compulsory Savings: <strong>ETB {eligibility.breakdown.eligible_savings_balance.toLocaleString()}</strong> / required ETB {eligibility.breakdown.required_pre_savings_amount.toLocaleString()}</p><p>Savings deficit: <strong className={eligibility.breakdown.savings_deficit ? 'text-destructive' : 'text-success'}>ETB {eligibility.breakdown.savings_deficit.toLocaleString()}</strong></p><p>Accumulated Shares: <strong>ETB {eligibility.breakdown.accumulated_share_balance.toLocaleString()}</strong> / required ETB {eligibility.breakdown.required_share_amount.toLocaleString()}</p><p>Share deficit: <strong className={eligibility.breakdown.share_deficit ? 'text-destructive' : 'text-success'}>ETB {eligibility.breakdown.share_deficit.toLocaleString()}</strong></p><p className="sm:col-span-2 rounded bg-amber-50 p-2">Total amount needed to pass: <strong>ETB {eligibility.breakdown.total_upfront_deficit.toLocaleString()}</strong>. Informational only; no money is moved.</p></div>}
                {eligibility?.checks?.map((check) => <div key={check.name} className="flex items-start gap-2">{check.pass ? <CheckCircle className="h-4 w-4 text-success mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive mt-0.5" />}<div><p className="text-sm font-medium">{check.name.replaceAll('_', ' ')}</p><p className="text-xs text-muted-foreground">{check.message}</p></div></div>)}
                <div className="flex items-center gap-2 border-t pt-2">{eligibility?.passed ? <CheckCircle className="h-4 w-4 text-success" /> : <AlertCircle className="h-4 w-4 text-destructive" />}<span className="font-semibold">{eligibility?.passed ? 'Eligible' : 'Exception Required'}</span></div>
                {loan.officer_exception_reason && <div className="rounded border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-medium text-amber-900">Credit Officer exception reason</p><p className="text-sm text-amber-800">{loan.officer_exception_reason}</p></div>}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="affordability">Affordability</TabsTrigger>
                <TabsTrigger value="guarantors">Guarantors</TabsTrigger>
                <TabsTrigger value="collateral">Collateral</TabsTrigger>
                <TabsTrigger value="repayments">Repayments</TabsTrigger>
                <TabsTrigger value="approval">Approval</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Applied Amount</p>
                        <CurrencyDisplay
                          amount={loan.applied_amount}
                          className="text-lg font-semibold"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Term</p>
                        <p className="text-lg font-semibold">{loan.term_months} months</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Interest Rate</p>
                        <p className="text-lg font-semibold">{loan.interest_rate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Frequency</p>
                        <p className="text-lg font-semibold">{loan.repayment_frequency}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Purpose</p>
                      <p className="text-sm p-3 bg-muted rounded-lg">{loan.purpose_description}</p>
                    </div>

                    <div className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Upfront Fees & Disbursement</h3><Badge variant="outline">{loan.fee_collection_status || 'PENDING'}</Badge></div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-muted-foreground">Payment method</p><p className="font-medium">{loan.fee_payment_method === 'OUT_OF_POCKET' ? 'Pay Out-of-Pocket' : 'Deduct from Loan'}</p></div>
                        <div><p className="text-muted-foreground">Gross principal</p><CurrencyDisplay amount={loan.gross_disbursement_amount ?? loan.applied_amount} className="font-semibold" /></div>
                        <div><p className="text-muted-foreground">Service charge</p><CurrencyDisplay amount={loan.service_charge_amount || 0} className="font-semibold" /></div>
                        <div><p className="text-muted-foreground">Insurance held</p><CurrencyDisplay amount={loan.insurance_premium || 0} className="font-semibold" /></div>
                        <div><p className="text-muted-foreground">Total fees</p><CurrencyDisplay amount={loan.total_upfront_fee_amount || 0} className="font-semibold" /></div>
                        <div><p className="text-muted-foreground">Member receives</p><CurrencyDisplay amount={loan.net_disbursement_amount ?? loan.applied_amount} className="font-bold text-primary" /></div>
                      </div>
                      <div className="text-sm"><span className="text-muted-foreground">Insurance status: </span><strong>{loan.insurance_escrow_status || 'NOT_APPLICABLE'}</strong></div>
                      {loan.fee_receipt_url && <a className="text-sm text-primary underline" href={getImageUrl(loan.fee_receipt_url)} target="_blank" rel="noreferrer">View uploaded fee receipt{loan.fee_receipt_number ? ` (${loan.fee_receipt_number})` : ''}</a>}
                      {canCloseLoan && loan.is_fully_paid && loan.workflow_status === 'APPROVED' && <Button type="button" variant="outline" onClick={() => setClosureOpen(true)}>Complete Loan Closure Checklist</Button>}
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Application Timeline</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Submitted</span>
                          <span>{new Date(loan.created_at).toLocaleDateString()}</span>
                        </div>
                        {loan.updated_at && (
                        <div className="flex justify-between text-sm">
                          <span>Last Updated</span>
                          <span>{new Date(loan.updated_at).toLocaleDateString()}</span>
                        </div>
                        )}
                        {loan.disbursement_date && (
                          <div className="flex justify-between text-sm">
                            <span>Disbursement Date</span>
                            <span>{new Date(loan.disbursement_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="affordability" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Affordability Analysis (1/3 Rule)</CardTitle>
                    <CardDescription>
                      Monthly installment must not exceed 1/3 of monthly income
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Income</p>
                        <CurrencyDisplay
                          amount={member.monthly_income}
                          className="text-lg font-semibold"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Max Installment (1/3)</p>
                        <CurrencyDisplay
                          amount={affordability.maxInstallment}
                          className="text-lg font-semibold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                      {affordability.affordable ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium">
                          {affordability.affordable ? "Affordable" : "Not Affordable"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {affordability.affordable
                            ? "Installment is within acceptable limits"
                            : "Installment exceeds 1/3 of income"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Repayment Schedule Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="flat">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="flat">Flat Interest</TabsTrigger>
                        <TabsTrigger value="declining">Declining Balance</TabsTrigger>
                      </TabsList>

                      <TabsContent value="flat" className="mt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Monthly Installment</p>
                            <CurrencyDisplay
                              amount={flatCalc.monthlyInstallment}
                              className="text-lg font-semibold text-primary"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Interest</p>
                            <CurrencyDisplay
                              amount={flatCalc.totalInterest}
                              className="text-lg font-semibold"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Repayment</p>
                          <CurrencyDisplay
                            amount={flatCalc.totalRepayment}
                            className="text-2xl font-bold"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="declining" className="mt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Monthly Installment</p>
                            <CurrencyDisplay
                              amount={decliningCalc.monthlyInstallment}
                              className="text-lg font-semibold text-primary"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Interest</p>
                            <CurrencyDisplay
                              amount={decliningCalc.totalInterest}
                              className="text-lg font-semibold"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Repayment</p>
                          <CurrencyDisplay
                            amount={decliningCalc.totalRepayment}
                            className="text-2xl font-bold"
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="guarantors" className="mt-6">
                <GuarantorsTab loanId={loan.loan_id} loanAmount={loan.applied_amount} />
              </TabsContent>

              <TabsContent value="collateral" className="mt-6">
                <CollateralTab loanId={loan.loan_id} />
              </TabsContent>

              <TabsContent value="repayments" className="mt-6">
                <RepaymentsTab loanId={loan.loan_id} />
              </TabsContent>

              <TabsContent value="approval" className="mt-6">
                <Card className={isAlreadyApproved ? "opacity-60 pointer-events-none" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Approval Decision</span>
                      {isAlreadyApproved && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Already Approved
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {isAlreadyApproved 
                        ? "This loan has already been approved and cannot be modified"
                        : !isManagerOrAdmin
                        ? "⚠️ Permission Required: Only MANAGER or ADMIN can approve loans"
                        : loan.workflow_status === "REJECTED"
                        ? "This loan has been rejected and cannot be approved"
                        : "Review and approve or reject this loan application"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isManagerOrAdmin && !isAlreadyApproved && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-900">Access Restricted</p>
                            <p className="text-sm text-yellow-700 mt-1">
                              You are logged in as <strong>{user.role}</strong>. 
                              Only users with <strong>MANAGER</strong> or <strong>ADMIN</strong> roles can approve or reject loan applications.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {approvalStatus?.votes?.length > 0 && <div className="rounded-lg border p-3"><p className="text-sm font-medium mb-2">Approval Progress</p><div className="space-y-2">{approvalStatus.votes.map((vote: any) => <div key={vote.voter_id} className="flex items-start justify-between gap-3 text-sm"><div><p className="font-medium">{vote.username} · {vote.voter_role}</p>{vote.reason && <p className="text-xs text-muted-foreground">{vote.reason}</p>}{vote.override_reason && <p className="text-xs text-amber-700">Exception: {vote.override_reason}</p>}</div><Badge variant={vote.decision === 'APPROVED' ? 'default' : vote.decision === 'REJECTED' ? 'destructive' : 'outline'}>{vote.decision}</Badge></div>)}</div></div>}

                    {eligibility && !eligibility.passed && canApprove && <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4"><label className="flex items-start gap-2 text-sm font-medium text-amber-950"><input type="checkbox" className="mt-1" checked={overrideAcknowledged} onChange={(event) => setOverrideAcknowledged(event.target.checked)} />I reviewed every failed business validation and explicitly agree to this exception.</label><div><Label>Mandatory Override Reason *</Label><Textarea rows={3} value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} placeholder="Explain why approving this failed validation is justified..." /></div></div>}

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Audit Note <span className="text-destructive">*</span>
                      </label>
                      <Textarea
                        placeholder="Enter your decision notes here (required)..."
                        value={auditNote}
                        onChange={(e) => setAuditNote(e.target.value)}
                        rows={4}
                        disabled={!canReject || isAlreadyApproved}
                      />
                    </div>

                    {eligibilityDisplay.eligible && affordability.affordable && !isAlreadyApproved && (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">Impact Summary</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>
                            • Eligibility approval does not deposit, withdraw, or transfer member funds
                          </li>
                          <li>• Final required approval collects the configured fees and records the controlled disbursement values atomically</li>
                          <li>
                            • First payment due:{" "}
                            {loan.next_payment_date
                              ? new Date(loan.next_payment_date).toLocaleDateString()
                              : "N/A"}
                          </li>
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleApprove}
                        disabled={!canApprove || isAlreadyApproved}
                        className="flex-1"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Loan
                      </Button>
                      <Button
                        onClick={handleReject}
                        variant="destructive"
                        disabled={!canReject || isAlreadyApproved}
                        className="flex-1"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Loan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Dialog open={closureOpen} onOpenChange={setClosureOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loan Closure Checklist</DialogTitle>
            <DialogDescription>This loan is fully repaid. Resolve the held insurance before marking the loan closed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border p-3 text-sm"><p className="text-muted-foreground">Insurance held</p><CurrencyDisplay amount={loan.insurance_premium || 0} className="text-lg font-bold" /></div>
            <div className="space-y-2">
              <Label>Was any insurance claim made during this loan period? *</Label>
              <Select value={insuranceClaimMade} onValueChange={(value: 'YES' | 'NO') => setInsuranceClaimMade(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="NO">No — recognize unused insurance as revenue</SelectItem><SelectItem value="YES">Yes — mark insurance as utilized</SelectItem></SelectContent>
              </Select>
            </div>
            {insuranceClaimMade === 'YES' && <div className="space-y-2"><Label>Insurance Claim Reason *</Label><Textarea rows={4} value={insuranceClosureReason} onChange={(event) => setInsuranceClosureReason(event.target.value)} placeholder="Describe the claim, payment, or covered loss..." /></div>}
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">No claim: the held amount becomes profit without adding cash again. Claim made: the held cash is written out and never enters distributable profit.</div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setClosureOpen(false)}>Cancel</Button><Button onClick={handleCloseLoan} disabled={!canCloseLoan}>Confirm & Close Loan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// GuarantorsTab Component
interface Guarantor {
  guarantor_id: string;
  loan_id: string;
  full_name: string;
  phone: string;
  relationship?: string | null;
  address?: string | null;
  guaranteed_amount: number;
  duty_value?: number | null;
  id_front_url?: string | null;
  id_back_url?: string | null;
  profile_photo_url?: string | null;
}

const GuarantorsTab = ({ loanId, loanAmount }: { loanId: string; loanAmount: number }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGuarantor, setEditingGuarantor] = useState<Guarantor | null>(null);
  const [dutyValue, setDutyValue] = useState<string>("");
  const [guaranteedAmount, setGuaranteedAmount] = useState<string>("");
  const [filePreviews, setFilePreviews] = useState<{
    profile?: string;
    idFront?: string;
    idBack?: string;
  }>({});
  
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);

  const { data: guarantorsData, isLoading } = useQuery({
    queryKey: ['loan-guarantors', loanId],
    queryFn: async () => {
      const res = await api.get<{ data: Guarantor[] }>(`/guarantors/loan/${loanId}`);
      return res.data;
    },
    enabled: !!loanId
  });

  const guarantors = guarantorsData?.data || [];

  // Form state for guarantor details
  const [guarantorForm, setGuarantorForm] = useState({
    full_name: '',
    phone: '',
    relationship: '',
    address: '',
    age: ''
  });

  // Calculate default duty value when guarantors change
  useEffect(() => {
    if (!dutyValue && guarantors.length > 0 && loanAmount) {
      const totalGuarantors = guarantors.length + 1; // +1 for the new one being added
      const calculated = loanAmount / totalGuarantors;
      setDutyValue(calculated.toFixed(2));
      if (!guaranteedAmount) {
        setGuaranteedAmount(calculated.toFixed(2));
      }
    } else if (!dutyValue && loanAmount) {
      const calculated = loanAmount / (guarantors.length + 1);
      setDutyValue(calculated.toFixed(2));
      if (!guaranteedAmount) {
        setGuaranteedAmount(calculated.toFixed(2));
      }
    }
  }, [guarantors.length, loanAmount, dutyValue, guaranteedAmount]);

  const handleFileChange = (type: 'profile' | 'idFront' | 'idBack', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews(prev => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addGuarantorMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.post(`/loans/${loanId}/guarantors`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-guarantors', loanId] });
      toast({ title: "Success", description: "Guarantor added successfully" });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add guarantor",
        variant: "destructive"
      });
    }
  });

  const deleteGuarantorMutation = useMutation({
    mutationFn: async (guarantorId: string) => {
      return api.delete(`/guarantors/${guarantorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-guarantors', loanId] });
      toast({ title: "Success", description: "Guarantor deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete guarantor",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingGuarantor(null);
    setGuarantorForm({
      full_name: '',
      phone: '',
      relationship: '',
      address: '',
      age: ''
    });
    setDutyValue("");
    setGuaranteedAmount("");
    setFilePreviews({});
    if (profilePhotoRef.current) profilePhotoRef.current.value = '';
    if (idFrontRef.current) idFrontRef.current.value = '';
    if (idBackRef.current) idBackRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!guarantorForm.full_name || !guarantorForm.phone || !guarantorForm.age) {
      toast({
        title: "Error",
        description: "Full name, phone, and age are required",
        variant: "destructive"
      });
      return;
    }

    const idFront = idFrontRef.current?.files?.[0];
    const idBack = idBackRef.current?.files?.[0];

    if (!idFront || !idBack) {
      toast({
        title: "Error",
        description: "ID card front and back images are required",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append('full_name', guarantorForm.full_name);
    formData.append('phone', guarantorForm.phone);
    formData.append('age', guarantorForm.age);
    if (guarantorForm.relationship) formData.append('relationship', guarantorForm.relationship);
    if (guarantorForm.address) formData.append('address', guarantorForm.address);
    if (guaranteedAmount) formData.append('guaranteed_amount', guaranteedAmount);
    if (dutyValue) formData.append('duty_value', dutyValue);
    
    const profilePhoto = profilePhotoRef.current?.files?.[0];
    if (profilePhoto) formData.append('profile_photo', profilePhoto);
    formData.append('id_front', idFront);
    formData.append('id_back', idBack);

    addGuarantorMutation.mutate(formData);
  };

  const handleDelete = (guarantorId: string) => {
    if (!confirm('Are you sure you want to delete this guarantor?')) return;
    deleteGuarantorMutation.mutate(guarantorId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Guarantors</CardTitle>
            <CardDescription>Manage guarantors for this loan application</CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Guarantor
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading guarantors...</div>
        ) : guarantors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No guarantors added yet</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Guarantor
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {guarantors.map((guarantor) => (
              <Card key={guarantor.guarantor_id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {guarantor.profile_photo_url ? (
                        <img
                          src={getImageUrl(guarantor.profile_photo_url)}
                          alt="Profile"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <UserIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {guarantor.full_name || 'Unknown Guarantor'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {guarantor.phone || 'N/A'}
                          {guarantor.relationship && ` • ${guarantor.relationship}`}
                        </p>
                        {guarantor.address && (
                          <p className="text-xs text-muted-foreground mt-1">{guarantor.address}</p>
                        )}
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Guaranteed:</span>{' '}
                            <CurrencyDisplay amount={guarantor.guaranteed_amount} />
                          </div>
                          {guarantor.duty_value && (
                            <div>
                              <span className="text-muted-foreground">Duty Value:</span>{' '}
                              <CurrencyDisplay amount={guarantor.duty_value} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(guarantor.guarantor_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {(guarantor.id_front_url || guarantor.id_back_url) && (
                    <div className="mt-4 flex gap-2">
                      {guarantor.id_front_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getImageUrl(guarantor.id_front_url), '_blank')}
                        >
                          View ID Front
                        </Button>
                      )}
                      {guarantor.id_back_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getImageUrl(guarantor.id_back_url), '_blank')}
                        >
                          View ID Back
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Guarantor</DialogTitle>
            <DialogDescription>Enter guarantor information (guarantors do not need to be members)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full-name">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="full-name"
                  value={guarantorForm.full_name}
                  onChange={(e) => setGuarantorForm({ ...guarantorForm, full_name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
                <Input
                  id="phone"
                  value={guarantorForm.phone}
                  onChange={(e) => setGuarantorForm({ ...guarantorForm, phone: e.target.value })}
                  placeholder="+251..."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age <span className="text-destructive">*</span></Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="120"
                  value={guarantorForm.age}
                  onChange={(e) => setGuarantorForm({ ...guarantorForm, age: e.target.value })}
                  placeholder="Enter age"
                  required
                />
              </div>
              <div>
                <Label htmlFor="relationship">Relationship (Optional)</Label>
                <Input
                  id="relationship"
                  value={guarantorForm.relationship}
                  onChange={(e) => setGuarantorForm({ ...guarantorForm, relationship: e.target.value })}
                  placeholder="e.g., Friend, Relative"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address (Optional)</Label>
              <Input
                id="address"
                value={guarantorForm.address}
                onChange={(e) => setGuarantorForm({ ...guarantorForm, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duty-value">Duty Value (Optional)</Label>
                <Input
                  id="duty-value"
                  type="number"
                  value={dutyValue}
                  onChange={(e) => {
                    setDutyValue(e.target.value);
                    if (!guaranteedAmount) setGuaranteedAmount(e.target.value);
                  }}
                  placeholder="Auto-calculated if empty"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If empty, will divide {formatCurrency(loanAmount)} by number of guarantors
                </p>
              </div>
              <div>
                <Label htmlFor="guaranteed-amount">Guaranteed Amount</Label>
                <Input
                  id="guaranteed-amount"
                  type="number"
                  value={guaranteedAmount}
                  onChange={(e) => setGuaranteedAmount(e.target.value)}
                  placeholder="Required"
                />
              </div>
            </div>

            <div>
              <Label>Profile Photo (Optional)</Label>
              <Input
                ref={profilePhotoRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('profile', e)}
                className="mt-1"
              />
              {filePreviews.profile && (
                <img src={filePreviews.profile} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ID Card Front <span className="text-destructive">*</span></Label>
                <Input
                  ref={idFrontRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('idFront', e)}
                  className="mt-1"
                  required
                />
                {filePreviews.idFront && (
                  <img src={filePreviews.idFront} alt="ID Front Preview" className="mt-2 w-full h-32 object-contain border rounded" />
                )}
              </div>
              <div>
                <Label>ID Card Back <span className="text-destructive">*</span></Label>
                <Input
                  ref={idBackRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('idBack', e)}
                  className="mt-1"
                  required
                />
                {filePreviews.idBack && (
                  <img src={filePreviews.idBack} alt="ID Back Preview" className="mt-2 w-full h-32 object-contain border rounded" />
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={addGuarantorMutation.isPending}>
              {addGuarantorMutation.isPending ? 'Adding...' : 'Add Guarantor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// CollateralTab Component
interface CollateralItem {
  collateral_id: string;
  loan_id: string;
  type: 'LAND' | 'VEHICLE' | 'CASH' | 'OTHER';
  description: string;
  estimated_value: number;
  documents?: Array<{
    url: string;
    filename: string;
    mimetype: string;
    size: number;
    uploaded_at: string;
  }>;
}

const CollateralTab = ({ loanId }: { loanId: string }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCollateral, setEditingCollateral] = useState<CollateralItem | null>(null);
  const [formData, setFormData] = useState({
    type: 'LAND' as CollateralItem['type'],
    description: '',
    estimated_value: ''
  });
  const [documentPreviews, setDocumentPreviews] = useState<Array<{ name: string; preview: string; type: string }>>([]);
  const documentRef = useRef<HTMLInputElement>(null);

  const { data: collateralData, isLoading } = useQuery({
    queryKey: ['loan-collateral', loanId],
    queryFn: async () => {
      const res = await api.get<{ data: CollateralItem[] }>(`/collateral/loan/${loanId}`);
      return res.data;
    },
    enabled: !!loanId
  });

  const collateral = collateralData?.data || [];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx'];

    // Validate all files first
    const invalidFiles: string[] = [];
    Array.from(files).forEach((file) => {
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      const isTypeValid = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExt);
      
      if (!isTypeValid) {
        invalidFiles.push(file.name);
      }
    });

    // Show error if invalid files found
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid File Type",
        description: `These files are not allowed: ${invalidFiles.join(', ')}. Only images, PDF, DOC, and DOCX files are supported.`,
        variant: "destructive"
      });
      // Clear the file input
      if (documentRef.current) documentRef.current.value = '';
      setDocumentPreviews([]);
      return;
    }

    const previews: Array<{ name: string; preview: string; type: string }> = [];
    let processed = 0;

    Array.from(files).forEach((file) => {
      // For images, create preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push({
            name: file.name,
            preview: reader.result as string,
            type: file.type
          });
          processed++;
          if (processed === files.length) {
            setDocumentPreviews(previews);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // For non-images (PDF, docs), just show filename
        previews.push({
          name: file.name,
          preview: '',
          type: file.type
        });
        processed++;
        if (processed === files.length) {
          setDocumentPreviews(previews);
        }
      }
    });
  };

  const addCollateralMutation = useMutation({
    mutationFn: async (formDataPayload: FormData) => {
      return api.post(`/loans/${loanId}/collateral`, formDataPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-collateral', loanId] });
      toast({ title: "Success", description: "Collateral added successfully" });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add collateral",
        variant: "destructive"
      });
    }
  });

  const deleteCollateralMutation = useMutation({
    mutationFn: async (collateralId: string) => {
      return api.delete(`/collateral/${collateralId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-collateral', loanId] });
      toast({ title: "Success", description: "Collateral deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete collateral",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingCollateral(null);
    setFormData({ type: 'LAND', description: '', estimated_value: '' });
    setDocumentPreviews([]);
    if (documentRef.current) documentRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!formData.description || !formData.estimated_value) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    // Check if at least one document is uploaded
    const files = documentRef.current?.files;
    if (!files || files.length === 0) {
      toast({
        title: "Error",
        description: "At least one document is required for collateral",
        variant: "destructive"
      });
      return;
    }

    const formDataPayload = new FormData();
    formDataPayload.append('type', formData.type);
    formDataPayload.append('description', formData.description);
    formDataPayload.append('estimated_value', formData.estimated_value);
    
    // Append all documents
    Array.from(files).forEach((file) => {
      formDataPayload.append('documents', file);
    });

    addCollateralMutation.mutate(formDataPayload);
  };

  const handleDelete = (collateralId: string) => {
    if (!confirm('Are you sure you want to delete this collateral?')) return;
    deleteCollateralMutation.mutate(collateralId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Collateral</CardTitle>
            <CardDescription>Manage collateral for this loan application</CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Collateral
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading collateral...</div>
        ) : collateral.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No collateral added yet</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Collateral
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {collateral.map((item) => (
              <Card key={item.collateral_id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>{item.type}</Badge>
                        <CurrencyDisplay amount={item.estimated_value} className="font-semibold" />
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      {item.documents && item.documents.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.documents.map((doc: any, idx: number) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(getImageUrl(doc.url), '_blank')}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              {doc.filename || `Document ${idx + 1}`}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(item.collateral_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Collateral</DialogTitle>
            <DialogDescription>Enter collateral information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div>
              <Label>Type <span className="text-destructive">*</span></Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as CollateralItem['type'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LAND">Land</SelectItem>
                  <SelectItem value="VEHICLE">Vehicle</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description <span className="text-destructive">*</span></Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the collateral..."
                rows={3}
              />
            </div>
            <div>
              <Label>Estimated Value <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                value={formData.estimated_value}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_value: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Documents <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload multiple documents. Supported: <strong>Images (JPG, PNG, GIF, WebP), PDF, DOC, DOCX</strong>. At least one required.
              </p>
              <Input
                ref={documentRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="mt-1"
                multiple
                required
              />
              {documentPreviews.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium">{documentPreviews.length} file(s) selected:</p>
                  <div className="max-h-[300px] overflow-y-auto border rounded p-2">
                    <div className="grid grid-cols-3 gap-2">
                      {documentPreviews.map((doc, index) => (
                        <div key={index} className="border rounded p-1.5 bg-card">
                          {doc.preview ? (
                            <img src={doc.preview} alt={doc.name} className="w-full h-20 object-cover rounded mb-1" />
                          ) : (
                            <div className="w-full h-20 flex items-center justify-center bg-muted rounded mb-1">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <p className="text-[10px] truncate" title={doc.name}>{doc.name}</p>
                          <p className="text-[9px] text-muted-foreground truncate">{doc.type.split('/')[1]?.toUpperCase()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={addCollateralMutation.isPending}>
              {addCollateralMutation.isPending ? 'Adding...' : 'Add Collateral'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// Repayments Tab Component
const RepaymentsTab = ({ loanId }: { loanId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [editBankReceiptNo, setEditBankReceiptNo] = useState('');
  const [editCompanyReceiptNo, setEditCompanyReceiptNo] = useState('');
  const [editBankReceiptFile, setEditBankReceiptFile] = useState<File | null>(null);
  const [editCompanyReceiptFile, setEditCompanyReceiptFile] = useState<File | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const editBankReceiptRef = useRef<HTMLInputElement>(null);
  const editCompanyReceiptRef = useRef<HTMLInputElement>(null);
  
  const { data: repaymentHistory, isLoading } = useQuery({
    queryKey: ['loan-repayments', loanId],
    queryFn: async () => {
      const res = await api.get<{ data: any[] }>(`/loans/${loanId}/repayments`);
      return res.data.data;
    },
    enabled: !!loanId
  });

  const { data: summary } = useQuery({
    queryKey: ['loan-payment-summary', loanId],
    queryFn: async () => {
      const res = await api.get(`/loans/${loanId}/repayments/summary`);
      return res.data;
    },
    enabled: !!loanId
  });

  const checkPenaltyMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/loans/${loanId}/check-penalty`);
    },
    onSuccess: (response) => {
      const data = response.data;
      toast({
        title: data.has_penalty ? "⚠️ Penalty Found" : "✅ No Penalty",
        description: data.message + (data.sms_sent ? " SMS sent to member." : ""),
        variant: data.has_penalty ? "destructive" : "default"
      });
      queryClient.invalidateQueries({ queryKey: ['loan-payment-summary', loanId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to check penalty",
        variant: "destructive"
      });
    }
  });

  const repayments = repaymentHistory || [];

  const openEditReceipts = (payment: any) => {
    setEditingPayment(payment);
    setEditBankReceiptNo(payment?.bank_receipt_no || '');
    setEditCompanyReceiptNo(payment?.receipt_no || '');
    setEditBankReceiptFile(null);
    setEditCompanyReceiptFile(null);
    if (editBankReceiptRef.current) editBankReceiptRef.current.value = '';
    if (editCompanyReceiptRef.current) editCompanyReceiptRef.current.value = '';
    setEditOpen(true);
  };

  const saveReceiptEdits = async () => {
    if (!editingPayment?.repayment_id) return;
    try {
      setSavingEdit(true);
      const formData = new FormData();
      formData.append('bank_receipt_no', editBankReceiptNo.trim());
      formData.append('company_receipt_no', editCompanyReceiptNo.trim());
      if (editBankReceiptFile) formData.append('bank_receipt', editBankReceiptFile);
      if (editCompanyReceiptFile) formData.append('company_receipt', editCompanyReceiptFile);

      await api.put(`/loan-repayments/${editingPayment.repayment_id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast({ title: "Success", description: "Receipt info updated" });
      setEditOpen(false);
      setEditingPayment(null);
      queryClient.invalidateQueries({ queryKey: ['loan-repayments', loanId] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update receipt info",
        variant: "destructive"
      });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Repayment History</CardTitle>
            <CardDescription>All payments made on this loan</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkPenaltyMutation.mutate()}
            disabled={checkPenaltyMutation.isPending}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            {checkPenaltyMutation.isPending ? "Checking..." : "Check Penalty & SMS"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {summary && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <CurrencyDisplay amount={summary.total_paid} className="text-lg font-bold text-green-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <CurrencyDisplay amount={summary.outstanding_balance} className="text-lg font-bold text-orange-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payments Made</p>
                <p className="text-lg font-bold">{summary.payments_made}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Penalty</p>
                <CurrencyDisplay amount={summary.current_penalty} className="text-lg font-bold text-red-700" />
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">Loading repayments...</div>
        ) : repayments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No payments recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {repayments.map((payment: any) => (
              <Card key={payment.repayment_id} className="bg-card">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{payment.payment_method}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Amount Paid</p>
                          <CurrencyDisplay amount={payment.amount_paid} className="font-semibold text-green-700" />
                        </div>
                        <div>
                          <p className="text-muted-foreground">Principal</p>
                          <CurrencyDisplay amount={payment.principal_paid} className="font-medium" />
                        </div>
                        <div>
                          <p className="text-muted-foreground">Interest</p>
                          <CurrencyDisplay amount={payment.interest_paid} className="font-medium" />
                        </div>
                        {payment.penalty_paid > 0 && (
                          <div>
                            <p className="text-muted-foreground">Penalty</p>
                            <CurrencyDisplay amount={payment.penalty_paid} className="font-medium text-red-700" />
                          </div>
                        )}
                      </div>
                      {payment.notes && (
                        <p className="text-xs text-muted-foreground mt-2">Note: {payment.notes}</p>
                      )}
                      {/* Bank receipt (required in new flow) */}
                      {(payment.bank_receipt_no || payment.bank_receipt_photo_url) && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          {payment.bank_receipt_no && (
                            <p>Bank Receipt #: {payment.bank_receipt_no}</p>
                          )}
                          {payment.bank_receipt_photo_url && (
                            <a
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                              href={getImageUrl(payment.bank_receipt_photo_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FileText className="h-3 w-3" />
                              View Bank Receipt
                            </a>
                          )}
                        </div>
                      )}

                      {/* Company receipt (optional) stored in legacy receipt fields */}
                      {(payment.receipt_no || payment.receipt_photo_url) && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          {payment.receipt_no && (
                            <p>Company Receipt #: {payment.receipt_no}</p>
                          )}
                          {payment.receipt_photo_url && (
                            <a
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                              href={getImageUrl(payment.receipt_photo_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FileText className="h-3 w-3" />
                              View Company Receipt
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditReceipts(payment)}
                      title="Edit receipt info"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Receipt Info</DialogTitle>
          <DialogDescription>
            Update bank/company receipt numbers and optionally replace receipt photos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Bank Receipt Number</Label>
            <Input value={editBankReceiptNo} onChange={(e) => setEditBankReceiptNo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bank Receipt Photo</Label>
            <input
              ref={editBankReceiptRef}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setEditBankReceiptFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Company Receipt Number</Label>
            <Input value={editCompanyReceiptNo} onChange={(e) => setEditCompanyReceiptNo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Company Receipt Photo</Label>
            <input
              ref={editCompanyReceiptRef}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setEditCompanyReceiptFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button onClick={saveReceiptEdits} disabled={savingEdit || !editBankReceiptNo.trim()}>
              {savingEdit ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default LoanDetail;
