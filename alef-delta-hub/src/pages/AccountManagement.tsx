import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ModernHeader } from "@/components/shared/ModernHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAccountProducts } from "@/hooks/use-account-products";
import type { User, Account, Member } from "@/types";
import { Wallet, Plus, Edit, Snowflake, Sun, X, Search } from "lucide-react";

const AccountManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('FROZEN'); // Default to FROZEN
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountForm, setAccountForm] = useState({
    product_code: '' as Account['product_code'],
    currency: 'ETB'
  });

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

  // Fetch all accounts
  const { data: accountsResponse, isLoading } = useQuery({
    queryKey: ['all-accounts', searchQuery],
    queryFn: async () => {
      const res = await api.get<{ data: Account[] }>('/accounts?limit=1000');
      // Backend returns: { data: [...], total: number, limit: number, offset: number }
      return res.data;
    },
    enabled: !!user && ['MANAGER', 'ADMIN'].includes(user?.role || '')
  });

  const accountsData = accountsResponse?.data || [];

  // Fetch members for lookup
  const { data: membersData } = useQuery({
    queryKey: ['members-lookup'],
    queryFn: async () => {
      const res = await api.get<{ data: Member[] }>('/members?limit=1000');
      return res.data.data || [];
    },
    enabled: !!user
  });

  // Filter accounts by status and search query
  const filteredAccounts = accountsData?.filter(account => {
    // Filter by status
    if (statusFilter !== 'ALL' && account.status !== statusFilter) {
      return false;
    }
    
    // Filter by search query
    if (!searchQuery) return true;
    const member = membersData?.find(m => m.member_id === account.member_id);
    const searchLower = searchQuery.toLowerCase();
    return (
      account.account_id.toLowerCase().includes(searchLower) ||
      account.product_code.toLowerCase().includes(searchLower) ||
      member?.first_name?.toLowerCase().includes(searchLower) ||
      member?.last_name?.toLowerCase().includes(searchLower) ||
      member?.membership_no?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const freezeMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return api.post(`/accounts/${accountId}/freeze`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-accounts'] });
      toast({ title: "Success", description: "Account frozen successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to freeze account",
        variant: "destructive"
      });
    }
  });

  const unfreezeMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return api.post(`/accounts/${accountId}/unfreeze`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-accounts'] });
      toast({ title: "Success", description: "Account unfrozen successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to unfreeze account",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { accountId: string; updates: any }) => {
      return api.put(`/accounts/${data.accountId}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-accounts'] });
      toast({ title: "Success", description: "Account updated successfully" });
      setDialogOpen(false);
      setEditingAccount(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update account",
        variant: "destructive"
      });
    }
  });

  const handleFreeze = (accountId: string) => {
    if (confirm('Are you sure you want to freeze this account?')) {
      freezeMutation.mutate(accountId);
    }
  };

  const handleUnfreeze = (accountId: string) => {
    if (confirm('Are you sure you want to unfreeze this account?')) {
      unfreezeMutation.mutate(accountId);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setAccountForm({
      product_code: account.product_code,
      currency: account.currency || 'ETB'
    });
    setDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingAccount) return;
    updateMutation.mutate({
      accountId: editingAccount.account_id,
      updates: {
        product_code: accountForm.product_code,
        currency: accountForm.currency
      }
    });
  };

  const columns = [
    {
      key: "account_id",
      header: "Account ID",
      cell: (account: Account) => (
        <span className="font-mono text-sm">{account.account_id.substring(0, 8)}...</span>
      ),
    },
    {
      key: "member",
      header: "Member",
      cell: (account: Account) => {
        const member = membersData?.find(m => m.member_id === account.member_id);
        return (
          <div>
            <p className="font-medium">
              {member ? `${member.first_name} ${member.last_name}` : 'Unknown'}
            </p>
            <p className="text-sm text-muted-foreground">{member?.membership_no || 'N/A'}</p>
          </div>
        );
      },
    },
    {
      key: "product_code",
      header: "Product",
      cell: (account: Account) => account.product_code,
    },
    {
      key: "balance",
      header: "Balance",
      cell: (account: Account) => <CurrencyDisplay amount={account.balance} />,
    },
    {
      key: "lien_amount",
      header: "Lien",
      cell: (account: Account) => <CurrencyDisplay amount={account.lien_amount || 0} />,
    },
    {
      key: "status",
      header: "Status",
      cell: (account: Account) => <StatusBadge status={account.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (account: Account) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(account)}
            title="Edit Account"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {account.status === 'FROZEN' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUnfreeze(account.account_id)}
              title="Unfreeze Account"
              className="text-success hover:text-success"
            >
              <Sun className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFreeze(account.account_id)}
              title="Freeze Account"
              className="text-warning hover:text-warning"
            >
              <Snowflake className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/members/${account.member_id}`, { state: { returnTo: '/manager/accounts' } })}
            title="View Member"
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Account Management"
        subtitle="Manage all member accounts"
        onBack={() => navigate("/dashboard")}
      />
      
      <main className="container mx-auto px-4 py-8">

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Accounts</CardTitle>
            <CardDescription>Filter by status and search by account ID, product code, member name, or membership number</CardDescription>
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
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="FROZEN">Frozen</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-filter">Search:</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-filter"
                    placeholder="Search accounts..."
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Accounts</CardTitle>
                <CardDescription>
                  {filteredAccounts.length} account{filteredAccounts.length !== 1 ? "s" : ""} found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading accounts...</div>
            ) : (
              <DataTable
                data={filteredAccounts}
                columns={columns}
                emptyMessage="No accounts found"
              />
            )}
          </CardContent>
        </Card>

        {/* Edit Account Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
              <DialogDescription>
                Update account details. Balance and lien amount cannot be changed here.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product_code">Product Code</Label>
                <Select
                  value={accountForm.product_code}
                  onValueChange={(value) => setAccountForm({ ...accountForm, product_code: value as Account['product_code'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activeAccountProducts.map((product) => (
                      <SelectItem key={product.product_code} value={product.product_code}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={accountForm.currency}
                  onValueChange={(value) => setAccountForm({ ...accountForm, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ETB">ETB (Ethiopian Birr)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingAccount && (
                <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Balance:</span>
                    <CurrencyDisplay amount={editingAccount.balance} className="font-semibold" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lien Amount:</span>
                    <CurrencyDisplay amount={editingAccount.lien_amount || 0} className="font-semibold" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <StatusBadge status={editingAccount.status} />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setDialogOpen(false);
                setEditingAccount(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AccountManagement;

