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
import { CheckCircle, XCircle, Clock, Search, Eye, UserPlus } from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MemberRegistrationRequest {
  request_id: string;
  member_data: any;
  status: 'PENDING' | 'TELLER_APPROVED' | 'APPROVED' | 'REJECTED';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  approver_username?: string;
  approver_role?: string;
}

const MemberRegistrationApprovals = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<MemberRegistrationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
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

  // Fetch all registration requests
  const { data: allRequests, isLoading } = useQuery({
    queryKey: ['member-registration-requests', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      const queryString = params.toString();
      const res = await api.get<{ data: MemberRegistrationRequest[] }>(
        `/member-registration-requests${queryString ? '?' + queryString : ''}`
      );
      // Ensure we return an array and filter out any invalid entries
      const requests = res.data.data || [];
      return requests.filter((req: any) => req && typeof req === 'object');
    },
    enabled: !!user
  });

  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      setProcessingRequestId(requestId);
      toast({ 
        title: "Processing...", 
        description: "Approving registration request. This may take a moment. Please wait...",
        duration: 3000
      });
      return api.post(`/member-registration-requests/${requestId}/approve`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['member-registration-requests'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({ 
        title: "Success", 
        description: `Registration request approved. Member created and activated: ${data.data.member?.membership_no || 'N/A'}` 
      });
      setSelectedRequest(null);
      setShowDetailDialog(false);
      setProcessingRequestId(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to approve registration request",
        variant: "destructive"
      });
      setProcessingRequestId(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      setProcessingRequestId(requestId);
      return api.post(`/member-registration-requests/${requestId}/reject`, { rejection_reason: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-registration-requests'] });
      toast({ title: "Success", description: "Registration request rejected" });
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
      setProcessingRequestId(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to reject registration request",
        variant: "destructive"
      });
      setProcessingRequestId(null);
    }
  });

  const handleApprove = (request: MemberRegistrationRequest) => {
    if (processingRequestId === request.request_id) return;
    const memberData = request.member_data;
    const fullName = `${memberData?.first_name || ''} ${memberData?.last_name || ''}`.trim();
    if (confirm(`Are you sure you want to approve the registration request for ${fullName || 'this member'}?`)) {
      approveMutation.mutate(request.request_id);
    }
  };

  const handleReject = (request: MemberRegistrationRequest) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const handleViewDetails = (request: MemberRegistrationRequest) => {
    setSelectedRequest(request);
    setShowDetailDialog(true);
  };

  const confirmReject = () => {
    if (!selectedRequest) return;
    if (processingRequestId === selectedRequest.request_id) return;
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
  const filteredRequests = (allRequests || []).filter((req: MemberRegistrationRequest) => {
    if (!debouncedSearch.trim()) return true;
    const searchLower = debouncedSearch.toLowerCase().trim();
    const memberData = req.member_data || {};
    const fullName = `${memberData.first_name || ''} ${memberData.middle_name || ''} ${memberData.last_name || ''}`.toLowerCase();
    const phone = memberData.phone_primary?.toLowerCase() || '';
    const email = memberData.email?.toLowerCase() || '';
    const requestId = req.request_id?.toLowerCase() || '';
    
    return (
      fullName.includes(searchLower) ||
      phone.includes(searchLower) ||
      email.includes(searchLower) ||
      requestId.includes(searchLower)
    );
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ET', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'TELLER_APPROVED':
        return <Clock className="h-4 w-4 text-info" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const columns = [
    {
      key: "request_id",
      header: "Request ID",
      cell: (request: MemberRegistrationRequest) => {
        if (!request) return <span>-</span>;
        return (
          <span className="font-mono text-xs">{request.request_id?.substring(0, 8) || 'N/A'}...</span>
        );
      },
    },
    {
      key: "name",
      header: "Applicant Name",
      cell: (request: MemberRegistrationRequest) => {
        if (!request) return <span>-</span>;
        const memberData = request.member_data || {};
        return (
          <div>
            <div className="font-medium">
              {memberData.first_name || ''} {memberData.middle_name || ''} {memberData.last_name || ''}
            </div>
            <div className="text-xs text-muted-foreground">{memberData.phone_primary || 'N/A'}</div>
          </div>
        );
      },
    },
    {
      key: "member_type",
      header: "Type",
      cell: (request: MemberRegistrationRequest) => {
        if (!request) return <span>-</span>;
        const memberData = request.member_data || {};
        const typeMap: Record<string, string> = {
          'GOV_EMP': 'Gov Employee',
          'TRADER': 'Trader',
          'NGO': 'NGO',
          'FARMER': 'Farmer',
          'SELF': 'Self Employed'
        };
        return <span>{typeMap[memberData.member_type] || memberData.member_type || 'N/A'}</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (request: MemberRegistrationRequest) => {
        if (!request) return <span>-</span>;
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(request.status)}
            <StatusBadge status={request.status} />
          </div>
        );
      },
    },
    {
      key: "created_at",
      header: "Submitted",
      cell: (request: MemberRegistrationRequest) => {
        if (!request) return <span>-</span>;
        return formatDate(request.created_at);
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (request: MemberRegistrationRequest) => {
        if (!request) return <span>-</span>;
        const isProcessing = processingRequestId === request.request_id;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetails(request)}
              disabled={isProcessing}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {/* Teller can only approve PENDING requests */}
            {user?.role === 'TELLER' && request.status === 'PENDING' && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApprove(request)}
                  disabled={isProcessing}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(request)}
                  disabled={isProcessing}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {/* Manager/Admin can approve PENDING or finalize TELLER_APPROVED */}
            {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (request.status === 'PENDING' || request.status === 'TELLER_APPROVED') && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApprove(request)}
                  disabled={isProcessing}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {request.status === 'TELLER_APPROVED' ? 'Finalize Approval' : 'Approve'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(request)}
                  disabled={isProcessing}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Member Registration Approvals"
        subtitle="Review and approve member self-registration requests"
        onBack={() => navigate("/dashboard")}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, phone, email, or request ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="TELLER_APPROVED">Teller Approved (Awaiting Manager)</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registration Requests</CardTitle>
            <CardDescription>
              {filteredRequests.length} request(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No registration requests found
              </div>
            ) : (
              <DataTable columns={columns} data={filteredRequests} />
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registration Request Details</DialogTitle>
              <DialogDescription>
                Review all information before approving or rejecting
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Request ID</Label>
                    <p className="text-sm font-mono">{selectedRequest.request_id}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedRequest.status)}
                      <StatusBadge status={selectedRequest.status} />
                    </div>
                  </div>
                  <div>
                    <Label>Submitted</Label>
                    <p className="text-sm">{formatDate(selectedRequest.created_at)}</p>
                  </div>
                  {selectedRequest.approved_at && (
                    <div>
                      <Label>Approved/Rejected At</Label>
                      <p className="text-sm">{formatDate(selectedRequest.approved_at)}</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Member Information</h3>
                  {selectedRequest.member_data && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Full Name</Label>
                        <p>
                          {selectedRequest.member_data.first_name} {selectedRequest.member_data.middle_name} {selectedRequest.member_data.last_name}
                        </p>
                      </div>
                      <div>
                        <Label>Gender</Label>
                        <p>{selectedRequest.member_data.gender === 'M' ? 'Male' : 'Female'}</p>
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <p>{selectedRequest.member_data.phone_primary}</p>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <p>{selectedRequest.member_data.email || 'N/A'}</p>
                      </div>
                      <div>
                        <Label>Member Type</Label>
                        <p>{selectedRequest.member_data.member_type}</p>
                      </div>
                      <div>
                        <Label>Monthly Income</Label>
                        <p>{selectedRequest.member_data.monthly_income?.toLocaleString()} ETB</p>
                      </div>
                      <div>
                        <Label>Address</Label>
                        <p>
                          {selectedRequest.member_data.address_subcity}, {selectedRequest.member_data.address_woreda}
                        </p>
                      </div>
                      <div>
                        <Label>Declared Share Intention (Historical / Informational)</Label>
                        <p>{selectedRequest.member_data.shares_requested || 0}</p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedRequest.member_data?.emergency_contacts?.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Emergency Contacts</h3>
                    {selectedRequest.member_data.emergency_contacts.map((contact: any, index: number) => (
                      <div key={index} className="mb-2 p-2 bg-muted rounded">
                        <p className="font-medium">{contact.full_name}</p>
                        <p className="text-sm text-muted-foreground">{contact.phone_number}</p>
                        <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedRequest.member_data?.beneficiaries?.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Beneficiaries</h3>
                    {selectedRequest.member_data.beneficiaries.map((beneficiary: any, index: number) => (
                      <div key={index} className="mb-2 p-2 bg-muted rounded">
                        <p className="font-medium">{beneficiary.full_name}</p>
                        <p className="text-sm text-muted-foreground">{beneficiary.relationship} - {beneficiary.phone}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedRequest.rejection_reason && (
                  <div className="border-t pt-4">
                    <Label>Rejection Reason</Label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.rejection_reason}</p>
                  </div>
                )}

                <DialogFooter>
                  {/* Teller can only approve PENDING requests */}
                  {user?.role === 'TELLER' && selectedRequest.status === 'PENDING' && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setShowDetailDialog(false);
                          handleReject(selectedRequest);
                        }}
                        disabled={processingRequestId === selectedRequest.request_id}
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => {
                          setShowDetailDialog(false);
                          handleApprove(selectedRequest);
                        }}
                        disabled={processingRequestId === selectedRequest.request_id}
                      >
                        Approve
                      </Button>
                    </>
                  )}
                  {/* Manager/Admin can approve PENDING or finalize TELLER_APPROVED */}
                  {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (selectedRequest.status === 'PENDING' || selectedRequest.status === 'TELLER_APPROVED') && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setShowDetailDialog(false);
                          handleReject(selectedRequest);
                        }}
                        disabled={processingRequestId === selectedRequest.request_id}
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => {
                          setShowDetailDialog(false);
                          handleApprove(selectedRequest);
                        }}
                        disabled={processingRequestId === selectedRequest.request_id}
                      >
                        {selectedRequest.status === 'TELLER_APPROVED' ? 'Finalize Approval' : 'Approve'}
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Registration Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this registration request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmReject}
                disabled={!rejectionReason.trim() || processingRequestId === selectedRequest?.request_id}
              >
                Reject Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default MemberRegistrationApprovals;
