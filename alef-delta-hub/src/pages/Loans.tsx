import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { User, LoanApplication, LoanProduct, Member } from "@/types";
import { api } from "@/lib/api";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { ModernHeader } from "@/components/shared/ModernHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

const Loans = () => {
  const [user, setUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

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

  // Fetch all members for search
  const { data: membersData } = useQuery({
    queryKey: ['all-members-for-loans'],
    queryFn: async () => {
      const res = await api.get<{ data: Member[] }>('/members?limit=1000');
      return res.data.data || [];
    },
    enabled: !!user
  });

  // Fetch all loans
  const { data: allLoansResponse, isLoading, error } = useQuery({
    queryKey: ['all-loans'],
    queryFn: async () => {
      const res = await api.get<{ data: LoanApplication[] }>('/loans?limit=1000');
      return res.data.data || [];
    },
    enabled: !!user
  });

  const allLoans = allLoansResponse || [];

  // Client-side filtering
  const filteredLoans = allLoans.filter((loan) => {
    // Status filter
    if (statusFilter !== 'ALL' && loan.workflow_status !== statusFilter) {
      return false;
    }

    // Search filter (by member name, membership number, loan ID, or product code)
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      const member = membersData?.find(m => m.member_id === loan.member_id);
      const memberName = member ? `${member.first_name} ${member.last_name}`.toLowerCase() : '';
      const membershipNo = member?.membership_no?.toLowerCase() || '';
      const loanId = loan.loan_id.toLowerCase();
      const productCode = loan.product_code.toLowerCase();
      
      if (
        !memberName.includes(searchLower) &&
        !membershipNo.includes(searchLower) &&
        !loanId.includes(searchLower) &&
        !productCode.includes(searchLower)
      ) {
        return false;
      }
    }

    return true;
  });

  if (!user) return null;

  const columns = [
    {
      key: "loan_id",
      header: "Loan ID",
      cell: (row: LoanApplication) => (
        <span className="font-mono font-medium text-sm">{row.loan_id.substring(0, 8)}...</span>
      ),
    },
    {
      key: "member",
      header: "Member",
      cell: (row: LoanApplication) => {
        const member = membersData?.find(m => m.member_id === row.member_id);
        return (
          <div>
            <p className="font-medium text-sm">
              {member ? `${member.first_name} ${member.last_name}` : 'Unknown Member'}
            </p>
            {member?.membership_no && (
              <p className="text-xs text-muted-foreground">{member.membership_no}</p>
            )}
          </div>
        );
      },
    },
    {
      key: "product",
      header: "Product",
      cell: (row: LoanApplication) => {
        const product = loanProducts.find((p) => p.code === row.product_code);
        return (
          <div>
            <p className="font-medium text-sm">{product?.name || row.product_code}</p>
            <p className="text-xs text-muted-foreground">
              {row.product_code} • {product?.interest_rate || 'N/A'}% {product?.interest_type || ''}
            </p>
          </div>
        );
      },
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row: LoanApplication) => (
        <div>
          <CurrencyDisplay amount={row.applied_amount} className="text-sm font-medium" />
          {row.approved_amount && row.approved_amount !== row.applied_amount && (
            <p className="text-xs text-muted-foreground">
              Approved: <CurrencyDisplay amount={row.approved_amount} />
            </p>
          )}
        </div>
      ),
    },
    {
      key: "term",
      header: "Term",
      cell: (row: LoanApplication) => (
        <span className="text-sm">{row.term_months} months</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: LoanApplication) => (
        <StatusBadge status={row.workflow_status} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: LoanApplication) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/loans/${row.loan_id}`)}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Loan Applications"
        subtitle="Review and process loan requests"
        onBack={() => navigate("/dashboard")}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter loan applications by status or search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by member name, membership no, loan ID, or product code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="w-full">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="DISBURSED">Disbursed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="DEFAULT">Default</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">Applications Queue</h2>
            <p className="text-sm text-muted-foreground">
              Showing {filteredLoans.length} of {allLoans.length} application{allLoans.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => navigate("/loans/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Application
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-8">Loading...</div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-destructive font-medium mb-2">Failed to load loans</p>
                <p className="text-sm text-muted-foreground">
                  {(error as any)?.response?.data?.message || 'An error occurred while fetching loan applications.'}
                </p>
              </div>
            ) : filteredLoans.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-muted-foreground mb-2">No loan applications found.</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== 'ALL' 
                    ? 'Try adjusting your filters.' 
                    : 'Create a new loan application to get started.'}
                </p>
              </div>
            ) : (
              <DataTable
                data={filteredLoans}
                columns={columns}
                emptyMessage="No loan applications found."
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Loans;
