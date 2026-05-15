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
import { CheckCircle, XCircle, Clock, Search, Eye, Phone } from "lucide-react";
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

interface PartnerRequest {
  request_id: string;
  name: string;
  company_name?: string;
  phone: string;
  request_type: 'PARTNERSHIP' | 'SPONSORSHIP';
  sponsorship_type?: 'PLATINUM' | 'GOLD' | 'SILVER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  approver_username?: string;
  approver_role?: string;
}

const PartnerApprovals = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<PartnerRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
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

  // Fetch all partner requests
  const { data: allRequests, isLoading } = useQuery({
    queryKey: ['partner-requests', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      const queryString = params.toString();
      const res = await api.get<{ data: PartnerRequest[] }>(`/partner-requests${queryString ? '?' + queryString : ''}`);
      return res.data.data || [];
    },
    enabled: !!user
  });

  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      setProcessingRequestId(requestId);
      return api.post(`/partner-requests/${requestId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-requests'] });
      queryClient.invalidateQueries({ queryKey: ['partner-requests-pending-count'] });
      toast({ title: "Success", description: "Partner request approved successfully" });
      setSelectedRequest(null);
      setProcessingRequestId(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to approve partner request",
        variant: "destructive"
      });
      setProcessingRequestId(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      setProcessingRequestId(requestId);
      return api.post(`/partner-requests/${requestId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-requests'] });
      queryClient.invalidateQueries({ queryKey: ['partner-requests-pending-count'] });
      toast({ title: "Success", description: "Partner request rejected" });
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
      setProcessingRequestId(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to reject partner request",
        variant: "destructive"
      });
      setProcessingRequestId(null);
    }
  });

  const filteredRequests = (allRequests || []).filter((req: PartnerRequest) => {
    if (!req) return false;
    const searchLower = debouncedSearch.toLowerCase();
    const requestId = req.request_id?.toLowerCase() || '';
    const name = req.name?.toLowerCase() || '';
    const company = req.company_name?.toLowerCase() || '';
    const phone = req.phone?.toLowerCase() || '';
    
    return (
      name.includes(searchLower) ||
      company.includes(searchLower) ||
      phone.includes(searchLower) ||
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
      cell: (req: PartnerRequest) => (
        <span className="font-mono text-sm">{req.request_id.substring(0, 8)}...</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      cell: (req: PartnerRequest) => (
        <div>
          <p className="font-medium">{req.name}</p>
          {req.company_name && (
            <p className="text-sm text-muted-foreground">{req.company_name}</p>
          )}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (req: PartnerRequest) => (
        <a 
          href={`tel:${req.phone}`}
          className="flex items-center gap-1 text-primary hover:underline"
        >
          <Phone className="h-3 w-3" />
          <span>{req.phone}</span>
        </a>
      ),
    },
    {
      key: "request_type",
      header: "Request Type",
      cell: (req: PartnerRequest) => (
        <div>
          <p className="font-medium text-sm">
            {req.request_type === 'PARTNERSHIP' ? 'Partnership' : 'Sponsorship'}
          </p>
          {req.request_type === 'SPONSORSHIP' && req.sponsorship_type && (
            <p className="text-xs text-muted-foreground">
              {req.sponsorship_type === 'PLATINUM' ? 'Platinum' : 
               req.sponsorship_type === 'GOLD' ? 'Gold' : 'Silver'} Sponsor
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (req: PartnerRequest) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(req.status)}
          <StatusBadge status={req.status} />
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (req: PartnerRequest) => (
        <span className="text-sm">{formatDate(req.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (req: PartnerRequest) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedRequest(req)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {req.status === 'PENDING' && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => approveMutation.mutate(req.request_id)}
                disabled={processingRequestId === req.request_id}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setSelectedRequest(req);
                  setShowRejectDialog(true);
                }}
                disabled={processingRequestId === req.request_id}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const pendingCount = (allRequests || []).filter((r: PartnerRequest) => r.status === 'PENDING').length;
  const approvedCount = (allRequests || []).filter((r: PartnerRequest) => r.status === 'APPROVED').length;
  const rejectedCount = (allRequests || []).filter((r: PartnerRequest) => r.status === 'REJECTED').length;

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Partner Requests"
        subtitle="Manage partnership and sponsorship requests"
        actions={
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        }
      />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{(allRequests || []).length}</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-success">{approvedCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-destructive">{rejectedCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Partner Requests</CardTitle>
            <CardDescription>
              All partner and sponsorship requests ({filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, company, phone, or request ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DataTable
              data={filteredRequests}
              columns={columns}
              emptyMessage="No partner requests found with the selected filter"
            />
          </CardContent>
        </Card>

        {/* View Details Dialog */}
        <Dialog open={!!selectedRequest && !showRejectDialog} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Partner Request Details</DialogTitle>
              <DialogDescription>
                Request ID: {selectedRequest?.request_id}
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <p className="text-sm font-medium">{selectedRequest.name}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <a 
                      href={`tel:${selectedRequest.phone}`}
                      className="flex items-center gap-1 text-primary hover:underline text-sm font-medium"
                    >
                      <Phone className="h-3 w-3" />
                      {selectedRequest.phone}
                    </a>
                  </div>
                </div>
                {selectedRequest.company_name && (
                  <div>
                    <Label>Company Name</Label>
                    <p className="text-sm font-medium">{selectedRequest.company_name}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Request Type</Label>
                    <p className="text-sm font-medium">
                      {selectedRequest.request_type === 'PARTNERSHIP' ? 'Partnership' : 'Sponsorship'}
                    </p>
                  </div>
                  {selectedRequest.request_type === 'SPONSORSHIP' && selectedRequest.sponsorship_type && (
                    <div>
                      <Label>Sponsorship Type</Label>
                      <p className="text-sm font-medium">
                        {selectedRequest.sponsorship_type === 'PLATINUM' ? 'Platinum Sponsor' : 
                         selectedRequest.sponsorship_type === 'GOLD' ? 'Gold Sponsor' : 'Silver Sponsor'}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center gap-2 mt-1">
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
                    <Label>Approved At</Label>
                    <p className="text-sm">{formatDate(selectedRequest.approved_at)}</p>
                    {selectedRequest.approver_username && (
                      <p className="text-xs text-muted-foreground">
                        by {selectedRequest.approver_username} ({selectedRequest.approver_role})
                      </p>
                    )}
                  </div>
                )}
                {selectedRequest.rejection_reason && (
                  <div>
                    <Label>Rejection Reason</Label>
                    <p className="text-sm text-destructive">{selectedRequest.rejection_reason}</p>
                  </div>
                )}
                {selectedRequest.status === 'PENDING' && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => approveMutation.mutate(selectedRequest.request_id)}
                      disabled={processingRequestId === selectedRequest.request_id}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Request
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectDialog(true)}
                      disabled={processingRequestId === selectedRequest.request_id}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Request
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
              <DialogTitle>Reject Partner Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectDialog(false);
                    setRejectionReason('');
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
                        reason: rejectionReason
                      });
                    }
                  }}
                  disabled={!rejectionReason.trim() || processingRequestId === selectedRequest?.request_id}
                  className="flex-1"
                >
                  Reject Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PartnerApprovals;



