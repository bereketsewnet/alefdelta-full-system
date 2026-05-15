import { useState, useEffect } from "react";
import { ModernHeader } from "@/components/shared/ModernHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Search, Edit } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import type { LoanApplication, Member, User, LoanProduct } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

const ManagerApprovals = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  // Fetch all loans with different statuses
  const { data: pendingLoans } = useQuery({
    queryKey: ['loans-pending'],
    queryFn: async () => {
      const res = await api.get<{ data: LoanApplication[] }>('/loans?workflow_status=PENDING&limit=1000');
      return res.data.data || [];
    },
    enabled: !!user
  });

  const { data: underReviewLoans } = useQuery({
    queryKey: ['loans-under-review'],
    queryFn: async () => {
      const res = await api.get<{ data: LoanApplication[] }>('/loans?workflow_status=UNDER_REVIEW&limit=1000');
      return res.data.data || [];
    },
    enabled: !!user
  });

  const { data: approvedLoans } = useQuery({
    queryKey: ['loans-approved'],
    queryFn: async () => {
      const res = await api.get<{ data: LoanApplication[] }>('/loans?workflow_status=APPROVED&limit=1000');
      return res.data.data || [];
    },
    enabled: !!user
  });

  const { data: rejectedLoans } = useQuery({
    queryKey: ['loans-rejected'],
    queryFn: async () => {
      const res = await api.get<{ data: LoanApplication[] }>('/loans?workflow_status=REJECTED&limit=1000');
      return res.data.data || [];
    },
    enabled: !!user
  });

  // Combine all loans
  const allLoansData = [
    ...(pendingLoans || []),
    ...(underReviewLoans || []),
    ...(approvedLoans || []),
    ...(rejectedLoans || [])
  ];

  // Fetch members for lookup
  const { data: membersData } = useQuery({
    queryKey: ['members-lookup'],
    queryFn: async () => {
      const res = await api.get<{ data: Member[] }>('/members?limit=1000');
      return res.data.data;
    },
    enabled: !!user
  });

  // Fetch loan products from database
  const { data: loanProductsData } = useQuery({
    queryKey: ['loan-products'],
    queryFn: async () => {
      const res = await api.get<{ data: LoanProduct[] }>('/loan-products');
      return res.data.data || [];
    },
    enabled: !!user
  });

  const loanProducts = loanProductsData || [];

  const updateLoanStatusMutation = useMutation({
    mutationFn: async ({ loanId, status }: { loanId: string; status: string }) => {
      // Use the new status update endpoint
      return api.put(`/loans/${loanId}/status`, { workflow_status: status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loans-pending'] });
      queryClient.invalidateQueries({ queryKey: ['loans-under-review'] });
      queryClient.invalidateQueries({ queryKey: ['loans-approved'] });
      queryClient.invalidateQueries({ queryKey: ['loans-rejected'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      const statusText = variables.status === 'APPROVED' ? 'approved' : variables.status === 'REJECTED' ? 'rejected' : variables.status === 'PENDING' ? 'set to pending' : variables.status === 'UNDER_REVIEW' ? 'set to under review' : 'updated';
      toast({ title: "Success", description: `Loan ${statusText} successfully` });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to update loan status",
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (loanId: string, newStatus: string, currentStatus: string) => {
    if (newStatus === currentStatus) return;
    
    const statusText = newStatus === 'APPROVED' ? 'approve' : newStatus === 'REJECTED' ? 'reject' : newStatus === 'PENDING' ? 'set to pending' : newStatus === 'UNDER_REVIEW' ? 'set to under review' : 'update';
    const confirmMessage = newStatus === 'APPROVED' 
      ? 'Are you sure you want to approve this loan?'
      : newStatus === 'REJECTED'
      ? 'Are you sure you want to reject this loan?'
      : `Are you sure you want to set this loan to ${newStatus}?`;
    
    if (confirm(confirmMessage)) {
      updateLoanStatusMutation.mutate({ loanId, status: newStatus });
    }
  };

  // Filter by status
  const statusFilteredLoans = allLoansData.filter(loan => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') {
      // PENDING filter should show both PENDING and UNDER_REVIEW
      return loan.workflow_status === 'PENDING' || loan.workflow_status === 'UNDER_REVIEW';
    }
    return loan.workflow_status === statusFilter;
  });

  // Filter by search query (member name, loan ID, product code)
  const filteredLoans = statusFilteredLoans.filter(loan => {
    if (!debouncedSearch.trim()) return true;
    const searchLower = debouncedSearch.toLowerCase().trim();
    const member = membersData?.find(m => m.member_id === loan.member_id);
    const memberName = member ? `${member.first_name} ${member.middle_name || ''} ${member.last_name}`.toLowerCase() : '';
    const loanId = loan.loan_id?.toLowerCase() || '';
    const productCode = loan.product_code?.toLowerCase() || '';
    const membershipNo = member?.membership_no?.toLowerCase() || '';
    
    return (
      memberName.includes(searchLower) ||
      member?.first_name?.toLowerCase().includes(searchLower) ||
      member?.middle_name?.toLowerCase().includes(searchLower) ||
      member?.last_name?.toLowerCase().includes(searchLower) ||
      loanId.includes(searchLower) ||
      productCode.includes(searchLower) ||
      membershipNo.includes(searchLower)
    );
  });

  const applications = filteredLoans || [];

  const columns = [
    {
      key: "loan_id",
      header: "Loan ID",
      cell: (app: LoanApplication) => (
        <span className="font-mono text-sm">{app.loan_id.substring(0, 8)}...</span>
      ),
    },
    {
      key: "member",
      header: "Member",
      cell: (app: LoanApplication) => {
        const member = membersData?.find(m => m.member_id === app.member_id);
        return (
          <div>
            <p className="font-medium">{member?.first_name} {member?.last_name}</p>
            <p className="text-sm text-muted-foreground">{member?.membership_no}</p>
          </div>
        );
      },
    },
    {
      key: "product",
      header: "Product",
      cell: (app: LoanApplication) => {
        const product = loanProducts.find((p) => p.code === app.product_code);
        return (
          <div>
            <p className="font-medium text-sm">{product?.name || app.product_code}</p>
            <p className="text-xs text-muted-foreground">
              {app.product_code} • {product?.interest_rate || 'N/A'}% {product?.interest_type || ''}
            </p>
          </div>
        );
      },
    },
    {
      key: "amount",
      header: "Amount",
      cell: (app: LoanApplication) => <CurrencyDisplay amount={app.applied_amount} />,
    },
    {
      key: "status",
      header: "Status",
      cell: (app: LoanApplication) => (
        <StatusBadge status={app.workflow_status} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (app: LoanApplication) => (
        <div className="flex gap-2">
          <Select
            value={app.workflow_status}
            onValueChange={(value) => handleStatusChange(app.loan_id, value, app.workflow_status)}
            disabled={updateLoanStatusMutation.isPending}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Change Status">
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Change Status
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Set to Pending</SelectItem>
              <SelectItem value="UNDER_REVIEW">Set to Under Review</SelectItem>
              <SelectItem value="APPROVED">Approve</SelectItem>
              <SelectItem value="REJECTED">Reject</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/loans/${app.loan_id}`)}
          >
            Review
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Loan Approvals"
        subtitle="Review and approve pending loan applications"
        onBack={() => navigate("/dashboard")}
      />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Loans</CardTitle>
            <CardDescription>Filter loans by status and search by member name, loan ID, or product code</CardDescription>
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
                    <SelectItem value="PENDING">Pending (Default)</SelectItem>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
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
                    placeholder="Search by name, loan ID, or product..."
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
              <div className="text-2xl font-bold">
                {(pendingLoans?.length || 0) + (underReviewLoans?.length || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedLoans?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Total approved</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedLoans?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Total rejected</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Loan Applications</CardTitle>
            <CardDescription>
              All loan applications ({applications.length} loan{applications.length !== 1 ? 's' : ''})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={applications}
              columns={columns}
              emptyMessage="No loans found with the selected filter"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ManagerApprovals;
