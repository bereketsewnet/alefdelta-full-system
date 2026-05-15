import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ModernHeader } from "@/components/shared/ModernHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/shared/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { Users, UserPlus, Edit, Trash2, Key, Search } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { User, Member } from "@/types";
import { api } from "@/lib/api";

const AdminMemberManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      if (userData.role !== 'ADMIN') {
        navigate("/dashboard");
      }
    }
  }, [navigate]);

  // Fetch all members
  const { data: membersResponse, isLoading } = useQuery({
    queryKey: ['all-members-admin', debouncedSearch, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      params.append('limit', '1000');
      const res = await api.get<{ data: Member[], total: number }>(`/members?${params.toString()}`);
      return res.data;
    },
    enabled: !!user && user?.role === 'ADMIN'
  });

  const allMembers = membersResponse?.data || [];

  const deleteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return api.delete(`/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-members-admin'] });
      toast({ title: "Success", description: "Member deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedMember(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete member",
        variant: "destructive"
      });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ memberId, newPassword }: { memberId: string; newPassword: string }) => {
      return api.post(`/members/${memberId}/reset-password`, { new_password: newPassword });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-members-admin'] });
      toast({ title: "Success", description: "Member password reset successfully" });
      setResetPasswordDialogOpen(false);
      setSelectedMember(null);
      setResetPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reset password",
        variant: "destructive"
      });
    }
  });

  const handleDelete = (member: Member) => {
    setSelectedMember(member);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedMember) return;
    deleteMutation.mutate(selectedMember.member_id);
  };

  const handleResetPassword = (member: Member) => {
    setSelectedMember(member);
    setResetPasswordDialogOpen(true);
    setResetPassword("");
  };

  const confirmResetPassword = () => {
    if (!selectedMember || !resetPassword) {
      toast({ title: "Error", description: "Please enter a new password", variant: "destructive" });
      return;
    }
    if (resetPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    resetPasswordMutation.mutate({ memberId: selectedMember.member_id, newPassword: resetPassword });
  };

  if (!user) return null;

  const columns = [
    {
      key: "membership_no",
      header: "Member No.",
      cell: (row: Member) => (
        <span className="font-mono font-medium">{row.membership_no}</span>
      ),
    },
    {
      key: "name",
      header: "Full Name",
      cell: (row: Member) => (
        <div>
          <p className="font-medium">
            {row.first_name} {row.middle_name} {row.last_name}
          </p>
          <p className="text-xs text-muted-foreground">{row.phone_primary}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (row: Member) => (
        <span className="text-sm">{row.member_type?.replace("_", " ") || 'N/A'}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: Member) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: Member) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/members/${row.member_id}`)}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/members/${row.member_id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleResetPassword(row)}
            title="Reset Password"
          >
            <Key className="h-4 w-4 mr-1" />
            Reset Password
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Member Management"
        subtitle="Manage all member accounts and permissions"
        onBack={() => navigate("/dashboard")}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Users className="h-8 w-8" />
              Member Management
            </h1>
            <p className="text-muted-foreground">Manage all member accounts with full CRUD access</p>
          </div>
          <Button onClick={() => navigate("/members/new")}>
            <UserPlus className="h-4 w-4 mr-2" />
            New Member
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter members by status or search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, member no, or phone..."
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
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Member Directory</CardTitle>
                <CardDescription>
                  Showing {allMembers.length} member{allMembers.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">Loading...</div>
            ) : (
              <DataTable
                data={allMembers}
                columns={columns}
                emptyMessage="No members found"
              />
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Member</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete member <strong>{selectedMember?.first_name} {selectedMember?.last_name}</strong> ({selectedMember?.membership_no})? 
                This action cannot be undone. Member must have no active accounts or loans.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Member'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Member Password</DialogTitle>
              <DialogDescription>
                Reset password for member <strong>{selectedMember?.first_name} {selectedMember?.last_name}</strong> ({selectedMember?.membership_no}). 
                The member will be required to change their password on next login.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label htmlFor="new-password" className="text-sm font-medium">New Password</label>
                <Input
                  id="new-password"
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmResetPassword}
                disabled={resetPasswordMutation.isPending || !resetPassword || resetPassword.length < 6}
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminMemberManagement;

