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
import { CheckCircle, XCircle, Clock, Search, Eye, Phone, DollarSign } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { User } from "@/types";
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

interface LoanRequest {
  request_id: string;
  member_id?: string;
  phone?: string;
  loan_purpose: string;
  other_purpose?: string;
  requested_amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  member_first_name?: string;
  member_last_name?: string;
  membership_no?: string;
  member_phone?: string;
  approver_username?: string;
  approver_role?: string;
}

const LoanRequestApprovals = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<LoanRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

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

  // Fetch all loan requests
  const { data: allRequests, isLoading } = useQuery({
    queryKey: ['loan-requests', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      const queryString = params.toString();
      const res = await api.get<{ data: LoanRequest[] }>(`/loan-requests${queryString ? '?' + queryString : ''}`);
      return res.data.data || [];
    },
    enabled: !!user
  });

  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const approveMutation = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      setProcessingRequestId(requestId);
      return api.post(`/loan-requests/${requestId}/approve`, { notes: notes || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-requests'] });
      queryClient.invalidateQueries({ queryKey: ['loan-requests-pending-count'] });
      toast({ title: "Success", description: "Loan request approved successfully" });
      setSelectedRequest(null);
      setApprovalNotes('');
      setProcessingRequestId(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to approve loan request",
        variant: "destructive"
      });
      setProcessingRequestId(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason, notes }: { requestId: string; reason: string; notes?: string }) => {
      setProcessingRequestId(requestId);
      return api.post(`/loan-requests/${requestId}/reject`, { reason, notes: notes || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-requests'] });
      queryClient.invalidateQueries({ queryKey: ['loan-requests-pending-count'] });
      toast({ title: "Success", description: "Loan request rejected" });
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
      setApprovalNotes('');
      setProcessingRequestId(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to reject loan request",
        variant: "destructive"
      });
      setProcessingRequestId(null);
    }
  });

  const filteredRequests = (allRequests || []).filter((req: LoanRequest) => {
    if (!req) return false;
    const searchLower = debouncedSearch.toLowerCase();
    const requestId = req.request_id?.toLowerCase() || '';
    const name = `${req.member_first_name || ''} ${req.member_last_name || ''}`.toLowerCase();
    const phone = (req.phone || req.member_phone || '').toLowerCase();
    const purpose = (req.loan_purpose === 'OTHER' ? req.other_purpose : req.loan_purpose)?.toLowerCase() || '';
    
    return (
      name.includes(searchLower) ||
      phone.includes(searchLower) ||
      purpose.includes(searchLower) ||
      requestId.includes(searchLower)
    );
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ET', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getPurposeLabel = (purpose: string, other?: string) => {
    const purposeMap: Record<string, string> = {
      'CAR': 'Car',
      'HOUSE': 'House',
      'SCHOOL': 'School',
      'CHILDREN': 'Children',
      'BUSINESS': 'Business',
      'MEDICAL': 'Medical',
      'WEDDING': 'Wedding',
      'AGRICULTURE': 'Agriculture',
      'OTHER': other || 'Other',
    };
    return purposeMap[purpose] || purpose;
  };

  const columns = [
    {
      key: "request_id",
      header: "Request ID",
      cell: (req: LoanRequest) => (
        <span className="font-mono text-sm">{req.request_id.substring(0, 8)}...</span>
      ),
    },
    {
      key: "member",
      header: "Member",
      cell: (req: LoanRequest) => {
        if (req.member_first_name) {
          return (
            <div>
              <div className="font-medium">{req.member_first_name} {req.member_last_name}</div>
              {req.membership_no && (
                <div className="text-xs text-muted-foreground">#{req.membership_no}</div>
              )}
            </div>
          );
        }
        return (
          <div className="text-muted-foreground">
            <div>Not a member yet</div>
            {req.phone && (
              <div className="text-xs flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {req.phone}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "loan_purpose",
      header: "Purpose",
      cell: (req: LoanRequest) => (
        <div>
          <div className="font-medium">{getPurposeLabel(req.loan_purpose, req.other_purpose)}</div>
          {req.other_purpose && req.loan_purpose === 'OTHER' && (
            <div className="text-xs text-muted-foreground">{req.other_purpose}</div>
          )}
        </div>
      ),
    },
    {
      key: "requested_amount",
      header: "Amount",
      cell: (req: LoanRequest) => (
        <div className="font-semibold text-primary">{formatCurrency(req.requested_amount)}</div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (req: LoanRequest) => <StatusBadge status={req.status} />,
    },
    {
      key: "created_at",
      header: "Submitted",
      cell: (req: LoanRequest) => (
        <span className="text-sm text-muted-foreground">{formatDate(req.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (req: LoanRequest) => {
        const isProcessing = processingRequestId === req.request_id;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedRequest(req)}
              disabled={isProcessing}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </div>
        );
      },
    },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Loan Request Approvals"
        subtitle="Review and approve loan request applications"
        onBack={() => navigate("/dashboard")}
      />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Requests</CardTitle>
            <CardDescription>Filter by status and search by member name, phone, or request ID</CardDescription>
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
                    placeholder="Search by name, phone, or request ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loan Requests</CardTitle>
            <CardDescription>
              {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No loan requests found</div>
            ) : (
              <DataTable columns={columns} data={filteredRequests} />
            )}
          </CardContent>
        </Card>

        {/* View/Approve/Reject Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedRequest && (
              <>
                <DialogHeader>
                  <DialogTitle>Loan Request Details</DialogTitle>
                  <DialogDescription>
                    Request ID: {selectedRequest.request_id}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Member Information */}
                  <div>
                    <h3 className="font-semibold mb-2">Member Information</h3>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      {selectedRequest.member_first_name ? (
                        <>
                          <div>
                            <span className="text-sm text-muted-foreground">Name:</span>
                            <div className="font-medium">
                              {selectedRequest.member_first_name} {selectedRequest.member_last_name}
                            </div>
                          </div>
                          {selectedRequest.membership_no && (
                            <div>
                              <span className="text-sm text-muted-foreground">Membership No:</span>
                              <div className="font-medium">#{selectedRequest.membership_no}</div>
                            </div>
                          )}
                          {selectedRequest.member_phone && (
                            <div>
                              <span className="text-sm text-muted-foreground">Phone:</span>
                              <div className="font-medium flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <a href={`tel:${selectedRequest.member_phone}`} className="text-primary hover:underline">
                                  {selectedRequest.member_phone}
                                </a>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div>
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <div className="font-medium text-warning">Not a member yet</div>
                          {selectedRequest.phone && (
                            <div className="mt-2">
                              <span className="text-sm text-muted-foreground">Phone:</span>
                              <div className="font-medium flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <a href={`tel:${selectedRequest.phone}`} className="text-primary hover:underline">
                                  {selectedRequest.phone}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Loan Request Details */}
                  <div>
                    <h3 className="font-semibold mb-2">Loan Request Details</h3>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div>
                        <span className="text-sm text-muted-foreground">Loan Purpose:</span>
                        <div className="font-medium">{getPurposeLabel(selectedRequest.loan_purpose, selectedRequest.other_purpose)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Requested Amount:</span>
                        <div className="font-semibold text-primary text-lg">
                          {formatCurrency(selectedRequest.requested_amount)}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Submitted:</span>
                        <div className="font-medium">{formatDate(selectedRequest.created_at)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <div className="mt-1">
                          <StatusBadge status={selectedRequest.status} />
                        </div>
                      </div>
                      {selectedRequest.notes && (
                        <div>
                          <span className="text-sm text-muted-foreground">Staff Notes:</span>
                          <div className="font-medium">{selectedRequest.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Approval Actions */}
                  {selectedRequest.status === 'PENDING' && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <Label htmlFor="approval-notes">Staff Notes (Optional):</Label>
                        <Textarea
                          id="approval-notes"
                          placeholder="Add any notes about this request..."
                          value={approvalNotes}
                          onChange={(e) => setApprovalNotes(e.target.value)}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            approveMutation.mutate({ 
                              requestId: selectedRequest.request_id,
                              notes: approvalNotes || undefined
                            });
                          }}
                          disabled={processingRequestId === selectedRequest.request_id}
                          className="flex-1 bg-success hover:bg-success/90"
                        >
                          {processingRequestId === selectedRequest.request_id ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Request
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => setShowRejectDialog(true)}
                          disabled={processingRequestId === selectedRequest.request_id}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Approval/Rejection Info */}
                  {selectedRequest.status !== 'PENDING' && (
                    <div className="pt-4 border-t">
                      {selectedRequest.status === 'APPROVED' && (
                        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-success font-semibold mb-2">
                            <CheckCircle className="h-5 w-5" />
                            Request Approved
                          </div>
                          {selectedRequest.approved_at && (
                            <div className="text-sm text-muted-foreground">
                              Approved on {formatDate(selectedRequest.approved_at)}
                              {selectedRequest.approver_username && (
                                <> by {selectedRequest.approver_username}</>
                              )}
                            </div>
                          )}
                          {selectedRequest.notes && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Notes:</span>
                              <div className="font-medium">{selectedRequest.notes}</div>
                            </div>
                          )}
                        </div>
                      )}
                      {selectedRequest.status === 'REJECTED' && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-destructive font-semibold mb-2">
                            <XCircle className="h-5 w-5" />
                            Request Rejected
                          </div>
                          {selectedRequest.approved_at && (
                            <div className="text-sm text-muted-foreground">
                              Rejected on {formatDate(selectedRequest.approved_at)}
                              {selectedRequest.approver_username && (
                                <> by {selectedRequest.approver_username}</>
                              )}
                            </div>
                          )}
                          {selectedRequest.rejection_reason && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Reason:</span>
                              <div className="font-medium">{selectedRequest.rejection_reason}</div>
                            </div>
                          )}
                          {selectedRequest.notes && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Notes:</span>
                              <div className="font-medium">{selectedRequest.notes}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Loan Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this loan request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Enter the reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="rejection-notes">Staff Notes (Optional):</Label>
                <Textarea
                  id="rejection-notes"
                  placeholder="Add any additional notes..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectDialog(false);
                    setRejectionReason('');
                    setApprovalNotes('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!rejectionReason.trim()) {
                      toast({
                        title: "Error",
                        description: "Please provide a rejection reason",
                        variant: "destructive"
                      });
                      return;
                    }
                    if (selectedRequest) {
                      rejectMutation.mutate({
                        requestId: selectedRequest.request_id,
                        reason: rejectionReason,
                        notes: approvalNotes || undefined
                      });
                    }
                  }}
                  disabled={!rejectionReason.trim() || processingRequestId === selectedRequest?.request_id}
                  className="flex-1"
                >
                  {processingRequestId === selectedRequest?.request_id ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Request
                    </>
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

export default LoanRequestApprovals;

