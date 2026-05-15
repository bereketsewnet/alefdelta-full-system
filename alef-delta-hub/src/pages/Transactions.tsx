import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { User, Transaction } from "@/types";
import { api } from "@/lib/api";
import { useAccountProducts } from "@/hooks/use-account-products";
import { DataTable } from "@/components/shared/DataTable";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ModernHeader } from "@/components/shared/ModernHeader";
import { ArrowLeft, Filter, ChevronDown, X, Image as ImageIcon } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

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

const Transactions = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  
  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [txnTypeFilter, setTxnTypeFilter] = useState<string>("ALL");
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("ALL");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  
  // Pagination
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  
  const debouncedNameFilter = useDebounce(nameFilter, 500);

  // Fetch account products
  const { data: accountProducts = [] } = useAccountProducts(!!user);
  const activeAccountProducts = accountProducts.filter(p => p.is_active);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const { data: transactionsResponse, isLoading: loadingTransactions, isFetching } = useQuery({
    queryKey: ['all-transactions', txnTypeFilter, accountTypeFilter, dateFromFilter, dateToFilter, debouncedNameFilter, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      if (txnTypeFilter && txnTypeFilter !== 'ALL') params.append('txn_type', txnTypeFilter);
      if (accountTypeFilter && accountTypeFilter !== 'ALL') params.append('product_code', accountTypeFilter);
      if (dateFromFilter) params.append('date_from', dateFromFilter);
      if (dateToFilter) params.append('date_to', dateToFilter);
      if (debouncedNameFilter && debouncedNameFilter.trim()) params.append('search', debouncedNameFilter.trim());
      
      const res = await api.get<{ data: Transaction[] }>(`/transactions?${params.toString()}`);
      return res.data;
    },
    enabled: !!user && ['ADMIN', 'TELLER', 'MANAGER', 'AUDITOR'].includes(user.role),
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  // Reset offset when filters change (but not on initial mount)
  useEffect(() => {
    setOffset(0);
  }, [txnTypeFilter, accountTypeFilter, dateFromFilter, dateToFilter, debouncedNameFilter]);

  // Update transactions when data changes
  useEffect(() => {
    if (transactionsResponse?.data !== undefined) {
      if (offset === 0) {
        // Reset transactions when offset is 0 (new filter or initial load)
        setAllTransactions(transactionsResponse.data || []);
      } else {
        // Append new transactions when loading more
        setAllTransactions(prev => {
          // Avoid duplicates by checking if transaction already exists
          const existingIds = new Set(prev.map(t => t.txn_id));
          const newTransactions = (transactionsResponse.data || []).filter(t => !existingIds.has(t.txn_id));
          return [...prev, ...newTransactions];
        });
      }
    }
  }, [transactionsResponse, offset]);

  const handleLoadMore = () => {
    setOffset(prev => prev + limit);
  };

  if (!user) return null;

  const transactionColumns = [
    {
      key: "created_at",
      header: "Date",
      cell: (row: Transaction) => (
        <span className="text-sm">
          {new Date(row.created_at).toLocaleDateString()} {new Date(row.created_at).toLocaleTimeString()}
        </span>
      ),
    },
    {
      key: "member",
      header: "Member",
      cell: (row: Transaction) => (
        <span className="text-sm">
          {(row as any).member_name || 'N/A'}
        </span>
      ),
    },
    {
      key: "txn_type",
      header: "Type",
      cell: (row: Transaction) => (
        <Badge variant={row.txn_type === 'DEPOSIT' ? 'default' : 'destructive'}>
          {row.txn_type}
        </Badge>
      ),
    },
    {
      key: "product_code",
      header: "Account Type",
      cell: (row: Transaction) => (
        <span className="text-sm">
          {(row as any).product_code || 'N/A'}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row: Transaction) => (
        <CurrencyDisplay 
          amount={row.amount} 
          className={`text-sm font-medium ${row.txn_type === 'DEPOSIT' ? 'text-success' : 'text-destructive'}`}
        />
      ),
    },
    {
      key: "balance_after",
      header: "Balance After",
      cell: (row: Transaction) => (
        <CurrencyDisplay amount={row.balance_after} className="text-sm" />
      ),
    },
    {
      key: "reference",
      header: "Reference",
      cell: (row: Transaction) => (
        <span className="text-sm">{row.reference || 'N/A'}</span>
      ),
    },
    {
      key: "performed_by",
      header: "Performed By",
      cell: (row: Transaction) => (
        <span className="text-sm">{(row as any).performed_by_username || 'N/A'}</span>
      ),
    },
    {
      key: "receipt_photo",
      header: "Receipt",
      cell: (row: Transaction) => {
        const receiptUrl = (row as any).receipt_photo_url;
        if (!receiptUrl) return <span className="text-sm text-muted-foreground">No receipt</span>;
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(getImageUrl(receiptUrl), '_blank')}
          >
            <ImageIcon className="h-4 w-4 mr-1" />
            View
          </Button>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader 
        title="All Transactions"
        subtitle="View and filter all system transactions"
        onBack={() => navigate("/dashboard")}
      />
      <main className="container mx-auto px-4 py-8">

        <Card>
          <CardHeader>
            <CardTitle>Transaction Filters</CardTitle>
            <CardDescription>Filter transactions by various criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="name-filter">Member Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="name-filter"
                    placeholder="Search by name..."
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                  />
                  {nameFilter && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setNameFilter("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="txn-type-filter">Transaction Type</Label>
                <Select value={txnTypeFilter} onValueChange={setTxnTypeFilter}>
                  <SelectTrigger id="txn-type-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="DEPOSIT">Deposit</SelectItem>
                    <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="account-type-filter">Account Type</Label>
                <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                  <SelectTrigger id="account-type-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Accounts</SelectItem>
                    {activeAccountProducts.map((product) => (
                      <SelectItem key={product.product_code} value={product.product_code}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date-from">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date-to">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              Showing {allTransactions.length} transaction{allTransactions.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(loadingTransactions || isFetching) && offset === 0 && allTransactions.length === 0 ? (
              <div className="text-center py-8">Loading transactions...</div>
            ) : !loadingTransactions && !isFetching && offset === 0 && allTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found.
              </div>
            ) : allTransactions.length > 0 ? (
              <>
                <DataTable
                  data={allTransactions}
                  columns={transactionColumns}
                  emptyMessage="No transactions found."
                />
                {transactionsResponse?.data && transactionsResponse.data.length === limit && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={loadingTransactions || isFetching}
                    >
                      <ChevronDown className="mr-2 h-4 w-4" />
                      {(loadingTransactions || isFetching) ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">Loading transactions...</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Transactions;

