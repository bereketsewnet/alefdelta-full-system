import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ModernHeader } from "@/components/shared/ModernHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/shared/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { Users, UserPlus, Shield, Edit, Trash2, Key, Search } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { User } from "@/types";
import { api } from "@/lib/api";

const UserManagement = () => {
  const [open, setOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    confirmPassword: "",
    branch: ""
  });

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    phone: "",
    role: "",
    status: "ACTIVE"
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  // Sync edit form data when selected user changes and dialog opens
  useEffect(() => {
    if (selectedUser && editDialogOpen) {
      // Force update form data when dialog opens
      setEditFormData({
        username: String(selectedUser.username || ""),
        email: String(selectedUser.email || ""),
        phone: String(selectedUser.phone || ""),
        role: String(selectedUser.role || "TELLER"),
        status: String(selectedUser.status || "ACTIVE")
      });
    }
  }, [selectedUser?.user_id, editDialogOpen]);
  
  const { data: usersData, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<{ data: User[] }>('/users');
      return res.data.data || [];
    },
    enabled: !!user
  });

  const allUsers = usersData || [];

  // Client-side filtering
  const filteredUsers = allUsers.filter((userItem) => {
    // Role filter
    if (roleFilter !== 'ALL' && userItem.role !== roleFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'ALL' && (userItem.status || 'ACTIVE') !== statusFilter) {
      return false;
    }

    // Search filter (by username, email, user_id)
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      const username = userItem.username?.toLowerCase() || '';
      const email = userItem.email?.toLowerCase() || '';
      const userId = userItem.user_id?.toLowerCase() || '';
      
      if (
        !username.includes(searchLower) &&
        !email.includes(searchLower) &&
        !userId.includes(searchLower)
      ) {
        return false;
      }
    }

    return true;
  });

  const createMutation = useMutation({
    mutationFn: async (userData: any) => {
      return api.post('/users', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: "Success", description: "User created successfully" });
      setOpen(false);
      setFormData({ username: "", email: "", phone: "", role: "", password: "", confirmPassword: "", branch: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create user",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      return api.put(`/users/${userId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: "Success", description: "User updated successfully" });
      setEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: "Success", description: "User deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      return api.post(`/users/${userId}/reset-password`, { new_password: newPassword });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: "Success", description: "User password reset successfully" });
      setResetPasswordDialogOpen(false);
      setSelectedUser(null);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      username: formData.username,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      password: formData.password,
    });
  };

  const handleEdit = (userToEdit: User) => {
    // Set selected user first
    setSelectedUser(userToEdit);
    // Immediately set form data with all fields from the user - ensure no null/undefined
    const formData = {
      username: userToEdit.username ? String(userToEdit.username) : "",
      email: userToEdit.email ? String(userToEdit.email) : "",
      phone: userToEdit.phone ? String(userToEdit.phone) : "",
      role: userToEdit.role ? String(userToEdit.role) : "TELLER",
      status: userToEdit.status ? String(userToEdit.status) : "ACTIVE"
    };
    setEditFormData(formData);
    // Open dialog immediately - form will use selectedUser as source of truth
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;

    updateMutation.mutate({
      userId: selectedUser.user_id,
      updates: editFormData
    });
  };

  const handleDelete = (userToDelete: User) => {
    setSelectedUser(userToDelete);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedUser) return;
    deleteMutation.mutate(selectedUser.user_id);
  };

  const handleResetPassword = (userToReset: User) => {
    setSelectedUser(userToReset);
    setResetPasswordDialogOpen(true);
    setResetPassword("");
  };

  const confirmResetPassword = () => {
    if (!selectedUser || !resetPassword) {
      toast({ title: "Error", description: "Please enter a new password", variant: "destructive" });
      return;
    }
    if (resetPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    resetPasswordMutation.mutate({ userId: selectedUser.user_id, newPassword: resetPassword });
  };

  const columns = [
    {
      key: "username",
      header: "Username",
      cell: (user: User) => (
        <div>
          <p className="font-medium">{user.username}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (user: User) => (
        <StatusBadge status={user.role} />
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (user: User) => (
        <StatusBadge status={user.status || "ACTIVE"} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: User) => {
        const isCurrentUser = user?.user_id === row.user_id;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(row)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            {!isCurrentUser && (
              <>
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
        title="User Management"
        subtitle="Manage staff accounts and permissions"
        onBack={() => navigate("/dashboard")}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Add a new staff member to the system</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={formData.username} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={handleInputChange} required placeholder="+251..." />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select onValueChange={(val) => setFormData({...formData, role: val})} required>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TELLER">Teller</SelectItem>
                        <SelectItem value="CREDIT_OFFICER">Credit Officer</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="BOARD_MEMBER">Board Member</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="password">Initial Password</Label>
                    <Input id="password" type="password" value={formData.password} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create User'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter users by role, status, or search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username, email, or user ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger id="role-filter" className="w-full">
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="CREDIT_OFFICER">Credit Officer</SelectItem>
                  <SelectItem value="TELLER">Teller</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="w-full">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DISABLED">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Staff Directory
                </CardTitle>
                <CardDescription>
                  Showing {filteredUsers.length} of {allUsers.length} user{allUsers.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable data={filteredUsers} columns={columns} emptyMessage="No users found" />
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            // Reset form when dialog closes
            setSelectedUser(null);
            setEditFormData({
              username: "",
              email: "",
              phone: "",
              role: "TELLER",
              status: "ACTIVE"
            });
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <form key={`edit-${selectedUser.user_id}`} onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="edit-username">Username</Label>
                    <Input
                      id="edit-username"
                      value={editFormData.username || selectedUser.username || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editFormData.email || selectedUser.email || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      type="tel"
                      value={editFormData.phone || selectedUser.phone || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      required
                      placeholder="+251..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-role">Role</Label>
                    <Select
                      value={editFormData.role || selectedUser.role || "TELLER"}
                      onValueChange={(val) => setEditFormData({ ...editFormData, role: val })}
                      required
                    >
                      <SelectTrigger id="edit-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TELLER">Teller</SelectItem>
                        <SelectItem value="CREDIT_OFFICER">Credit Officer</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="BOARD_MEMBER">Board Member</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editFormData.status || selectedUser.status || "ACTIVE"}
                      onValueChange={(val) => setEditFormData({ ...editFormData, status: val })}
                      required
                    >
                      <SelectTrigger id="edit-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="DISABLED">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Updating...' : 'Update User'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete user <strong>{selectedUser?.username}</strong>? This action cannot be undone.
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
                {deleteMutation.isPending ? 'Deleting...' : 'Delete User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Reset password for user <strong>{selectedUser?.username}</strong>. The user will be required to change their password on next login.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
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
                disabled={resetPasswordMutation.isPending || !resetPassword || resetPassword.length < 8}
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

export default UserManagement;
