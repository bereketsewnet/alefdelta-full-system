import { useState, useEffect } from "react";
import { ModernHeader } from "@/components/shared/ModernHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Search, Eye, Image as ImageIcon } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import type { User, Member, Account } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoanRepaymentRequest {
  request_id: string;
  member_id: string;
  loan_id: string;
  amount: number;
  payment_method?: string;
  receipt_number?: string;
  receipt_photo_url?: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  member_first_name?: string;
  member_last_name?: string;
  membership_no?: string;
  loan_product_code?: string;
  loan_amount?: number;
  approver_username?: string;
  approver_role?: string;
}

const LoanRepaymentApprovals = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<LoanRepaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  // Fetch all loan repayment requests
  const { data: allRequests } = useQuery({
    queryKey: ['loan-repayment-requests', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      const queryString = params.toString();
      const res = await api.get<{ data: LoanRepaymentRequest[] }>(`/loan-repayment-requests${queryString ? '?' + queryString : ''}`);
      return res.data.data || [];
    },
    enabled: !!user
  });

  // Fetch members for lookup
  const { data: membersData } = useQuery({
    queryKey: ['members-lookup'],
    queryFn: async () => {
      const res = await api.get<{ data: Member[] }>('/members?limit=1000');
      return res.data.data;
    },
    enabled: !!user
  });

  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      setProcessingRequestId(requestId);
      toast({ 
        title: "Processing...", 
        description: "Approving loan repayment request. This may take 1-2 minutes. Please wait...",
        duration: 3000
      });
      return api.post(`/loan-repayment-requests/${requestId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-repayment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['loan-repayment-requests-pending-count'] });
      toast({ title: "Success", description: "Loan repayment request approved successfully" });
      setSelectedRequest(null);
      setProcessingRequestId(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to approve loan repayment request",
        variant: "destructive"
      });
      setProcessingRequestId(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      setProcessingRequestId(requestId);
      return api.post(`/loan-repayment-requests/${requestId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-repayment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['loan-repayment-requests-pending-count'] });
      toast({ title: "Success", description: "Loan repayment request rejected" });
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
      setProcessingRequestId(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to reject loan repayment request",
        variant: "destructive"
      });
      setProcessingRequestId(null);
    }
  });

  const handleApprove = (request: LoanRepaymentRequest) => {
    if (processingRequestId === request.request_id) return; // Prevent double-click
    if (confirm(`Are you sure you want to approve this loan repayment request of ETB ${request.amount.toLocaleString()}?`)) {
      approveMutation.mutate(request.request_id);
    }
  };

  const handleReject = (request: LoanRepaymentRequest) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (!selectedRequest) return;
    if (processingRequestId === selectedRequest.request_id) return; // Prevent double-click
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }
    rejectMutation.mutate({ requestId: selectedRequest.request_id, reason: rejectionReason });
  };

  // Filter by search query
  const filteredRequests = (allRequests || []).filter((req: LoanRepaymentRequest) => {
    if (!debouncedSearch.trim()) return true;
    const searchLower = debouncedSearch.toLowerCase().trim();
    const member = membersData?.find(m => m.member_id === req.member_id);
    const memberName = member ? `${member.first_name} ${member.middle_name || ''} ${member.last_name}`.toLowerCase() : '';
    const requestId = req.request_id?.toLowerCase() || '';
    const membershipNo = member?.membership_no?.toLowerCase() || '';
    const loanCode = req.loan_product_code?.toLowerCase() || '';
    
    return (
      memberName.includes(searchLower) ||
      requestId.includes(searchLower) ||
      membershipNo.includes(searchLower) ||
      loanCode.includes(searchLower) ||
      req.receipt_number?.toLowerCase().includes(searchLower)
    );
  });

  // Count by status
  const pendingCount = (allRequests || []).filter((r: LoanRepaymentRequest) => r.status === 'PENDING').length;
  const approvedCount = (allRequests || []).filter((r: LoanRepaymentRequest) => r.status === 'APPROVED').length;
  const rejectedCount = (allRequests || []).filter((r: LoanRepaymentRequest) => r.status === 'REJECTED').length;

  // Construct receipt URL
  const getReceiptUrl = (receiptPath?: string) => {
    if (!receiptPath) return null;
    if (receiptPath.startsWith('http://') || receiptPath.startsWith('https://')) {
      return receiptPath;
    }
    // Extract base URL from API base (e.g., https://sacco-api.alefdelta.com/api -> https://sacco-api.alefdelta.com)
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://sacco-api.alefdelta.com/api';
    const baseUrl = apiUrl.replace('/api', '').replace(/\/$/, '');
    const normalizedPath = receiptPath.startsWith('/') ? receiptPath : `/${receiptPath}`;
    return `${baseUrl}${normalizedPath}`;
  };

  const columns = [
    {
      key: "request_id",
      header: "Request ID",
      cell: (req: LoanRepaymentRequest) => (
        <span className="font-mono text-sm">{req.request_id.substring(0, 8)}...</span>
      ),
    },
    {
      key: "member",
      header: "Member",
      cell: (req: LoanRepaymentRequest) => {
        const member = membersData?.find(m => m.member_id === req.member_id);
        return (
          <div>
            <p className="font-medium">
              {req.member_first_name} {req.member_last_name}
            </p>
            <p className="text-sm text-muted-foreground">{req.membership_no || member?.membership_no}</p>
          </div>
        );
      },
    },
    {
      key: "loan",
      header: "Loan",
      cell: (req: LoanRepaymentRequest) => (
        <div>
          <p className="font-medium text-sm">{req.loan_product_code || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">Loan: {req.loan_id.substring(0, 8)}...</p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (req: LoanRepaymentRequest) => <CurrencyDisplay amount={req.amount} />,
    },
    {
      key: "payment_method",
      header: "Payment Method",
      cell: (req: LoanRepaymentRequest) => (
        <span className="text-sm">{req.payment_method || 'CASH'}</span>
      ),
    },
    {
      key: "receipt_number",
      header: "Receipt #",
      cell: (req: LoanRepaymentRequest) => (
        <span className="text-sm">{req.receipt_number || '-'}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (req: LoanRepaymentRequest) => (
        <StatusBadge status={req.status} />
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (req: LoanRepaymentRequest) => (
        <span className="text-sm">
          {new Date(req.created_at).toLocaleDateString('en-ET', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (req: LoanRepaymentRequest) => {
        const isProcessing = processingRequestId === req.request_id;
        const isDisabled = isProcessing || processingRequestId !== null; // Disable all buttons if any request is processing
        
        return (
          <div className="flex gap-2">
            {req.status === 'PENDING' && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApprove(req)}
                  disabled={isDisabled}
                  className={`bg-success hover:bg-success/90 ${isProcessing ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {isProcessing && approveMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(req)}
                  disabled={isDisabled}
                  className={isProcessing ? 'opacity-50 cursor-wait' : ''}
                >
                  {isProcessing && rejectMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </>
                  )}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedRequest(req)}
              disabled={isDisabled}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Loan Repayment Request Approvals"
        subtitle="Review and approve member loan repayment requests"
        onBack={() => navigate("/dashboard")}
      />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Requests</CardTitle>
            <CardDescription>Filter by status and search by member name, request ID, or reference number</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status Filter:</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-filter">Search:</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-filter"
                    placeholder="Search by name, request ID, or receipt number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">Total approved</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedCount}</div>
              <p className="text-xs text-muted-foreground">Total rejected</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Loan Repayment Requests</CardTitle>
            <CardDescription>
              All loan repayment requests ({filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredRequests}
              columns={columns}
              emptyMessage="No loan repayment requests found with the selected filter"
            />
          </CardContent>
        </Card>

        {/* View Details Dialog */}
        <Dialog open={!!selectedRequest && !showRejectDialog} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Loan Repayment Request Details</DialogTitle>
              <DialogDescription>
                Request ID: {selectedRequest?.request_id}
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Member</Label>
                    <p className="font-medium">
                      {selectedRequest.member_first_name} {selectedRequest.member_last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.membership_no}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <StatusBadge status={selectedRequest.status} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Amount</Label>
                    <p className="font-medium text-lg">
                      <CurrencyDisplay amount={selectedRequest.amount} />
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Loan</Label>
                    <p className="font-medium">{selectedRequest.loan_product_code || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Payment Method</Label>
                    <p className="font-medium">{selectedRequest.payment_method || 'CASH'}</p>
                  </div>
                  {selectedRequest.receipt_number && (
                    <div>
                      <Label className="text-muted-foreground">Receipt Number</Label>
                      <p className="font-medium">{selectedRequest.receipt_number}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Request Date</Label>
                    <p className="font-medium">
                      {new Date(selectedRequest.created_at).toLocaleString('en-ET')}
                    </p>
                  </div>
                </div>
                
                {selectedRequest.description && (
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1">{selectedRequest.description}</p>
                  </div>
                )}
                
                {selectedRequest.receipt_photo_url && (
                  <div>
                    <Label className="text-muted-foreground">Receipt/Screenshot</Label>
                    <div className="mt-2">
                      <a
                        href={getReceiptUrl(selectedRequest.receipt_photo_url) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        <ImageIcon className="h-4 w-4" />
                        View Receipt
                      </a>
                    </div>
                  </div>
                )}
                
                {selectedRequest.status === 'APPROVED' && selectedRequest.approver_username && (
                  <div className="p-3 bg-success/10 rounded-lg">
                    <Label className="text-muted-foreground">Approved By</Label>
                    <p className="font-medium">
                      {selectedRequest.approver_username}
                      {selectedRequest.approver_role && ` (${selectedRequest.approver_role.toLowerCase()})`}
                    </p>
                    {selectedRequest.approved_at && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(selectedRequest.approved_at).toLocaleString('en-ET')}
                      </p>
                    )}
                  </div>
                )}
                
                {selectedRequest.status === 'REJECTED' && selectedRequest.rejection_reason && (
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <Label className="text-muted-foreground">Rejection Reason</Label>
                    <p className="font-medium">{selectedRequest.rejection_reason}</p>
                    {selectedRequest.approver_username && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Rejected by {selectedRequest.approver_username}
                        {selectedRequest.approver_role && ` (${selectedRequest.approver_role.toLowerCase()})`}
                      </p>
                    )}
                  </div>
                )}
                
                {selectedRequest.status === 'PENDING' && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="default"
                      onClick={() => handleApprove(selectedRequest)}
                      disabled={processingRequestId !== null}
                      className={`flex-1 bg-success hover:bg-success/90 ${processingRequestId === selectedRequest.request_id && approveMutation.isPending ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {processingRequestId === selectedRequest.request_id && approveMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setShowRejectDialog(true);
                      }}
                      disabled={processingRequestId !== null}
                      className={`flex-1 ${processingRequestId === selectedRequest.request_id && rejectMutation.isPending ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {processingRequestId === selectedRequest.request_id && rejectMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Loan Repayment Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this loan repayment request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedRequest && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Request Details:</p>
                  <p className="text-sm text-muted-foreground">
                    Member: {selectedRequest.member_first_name} {selectedRequest.member_last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Amount: <CurrencyDisplay amount={selectedRequest.amount} />
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  rows={4}
                  placeholder="e.g., Receipt not clear, Amount mismatch, Invalid reference number..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectDialog(false);
                    setRejectionReason('');
                  }}
                  disabled={processingRequestId !== null}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmReject}
                  disabled={processingRequestId !== null || !rejectionReason.trim()}
                  className={`flex-1 ${processingRequestId !== null ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {processingRequestId !== null && rejectMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Rejecting...
                    </>
                  ) : (
                    'Confirm Reject'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default LoanRepaymentApprovals;

