import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModernHeader } from "@/components/shared/ModernHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, UserX, Edit, Search } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import type { Member, User } from "@/types";

const MemberActivation = () => {
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

  // Fetch all members with PENDING, ACTIVE, and SUSPENDED status
  const { data: pendingMembers } = useQuery({
    queryKey: ['pending-members'],
    queryFn: async () => {
      const res = await api.get<{ data: Member[] }>('/members?status=PENDING&limit=1000');
      return res.data.data || [];
    },
    enabled: !!user
  });

  const { data: activeMembers } = useQuery({
    queryKey: ['active-members'],
    queryFn: async () => {
      const res = await api.get<{ data: Member[] }>('/members?status=ACTIVE&limit=1000');
      return res.data.data || [];
    },
    enabled: !!user
  });

  const { data: suspendedMembers } = useQuery({
    queryKey: ['suspended-members'],
    queryFn: async () => {
      const res = await api.get<{ data: Member[] }>('/members?status=SUSPENDED&limit=1000');
      return res.data.data || [];
    },
    enabled: !!user
  });

  // Combine all members
  const allMembersData = [
    ...(pendingMembers || []), 
    ...(activeMembers || []), 
    ...(suspendedMembers || [])
  ];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ memberId, status }: { memberId: string; status: string }) => {
      return api.put(`/members/${memberId}`, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-members'] });
      queryClient.invalidateQueries({ queryKey: ['active-members'] });
      queryClient.invalidateQueries({ queryKey: ['suspended-members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      const statusText = variables.status === 'ACTIVE' ? 'activated' : variables.status === 'SUSPENDED' ? 'suspended' : variables.status === 'PENDING' ? 'set to pending' : 'updated';
      toast({ title: "Success", description: `Member ${statusText} successfully` });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to update member status",
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (memberId: string, newStatus: string, currentStatus: string) => {
    if (newStatus === currentStatus) return;
    
    const statusText = newStatus === 'ACTIVE' ? 'activate' : newStatus === 'SUSPENDED' ? 'suspend' : newStatus === 'PENDING' ? 'set to pending' : 'update';
    const confirmMessage = newStatus === 'ACTIVE' 
      ? 'Are you sure you want to activate this member?'
      : newStatus === 'SUSPENDED'
      ? 'Are you sure you want to suspend this member? They will remain in this list and can be activated later.'
      : 'Are you sure you want to set this member to pending status?';
    
    if (confirm(confirmMessage)) {
      updateStatusMutation.mutate({ memberId, status: newStatus });
    }
  };

  // Filter by status
  const statusFilteredMembers = allMembersData.filter(member => {
    if (statusFilter === 'ALL') return true;
    return member.status === statusFilter;
  });

  // Filter by search query (name or membership number)
  const filteredMembers = statusFilteredMembers.filter(member => {
    if (!debouncedSearch.trim()) return true;
    const searchLower = debouncedSearch.toLowerCase().trim();
    const fullName = `${member.first_name} ${member.middle_name || ''} ${member.last_name}`.toLowerCase();
    const membershipNo = member.membership_no?.toLowerCase() || '';
    
    return (
      fullName.includes(searchLower) ||
      member.first_name?.toLowerCase().includes(searchLower) ||
      member.middle_name?.toLowerCase().includes(searchLower) ||
      member.last_name?.toLowerCase().includes(searchLower) ||
      membershipNo.includes(searchLower)
    );
  });

  const members = filteredMembers || [];

  const columns = [
    {
      key: "membership_no",
      header: "Membership No",
      cell: (member: Member) => (
        <span className="font-mono text-sm">{member.membership_no}</span>
      ),
    },
    {
      key: "name",
      header: "Full Name",
      cell: (member: Member) => (
        <div>
          <p className="font-medium">
            {member.first_name} {member.middle_name} {member.last_name}
          </p>
          <p className="text-sm text-muted-foreground">{member.phone_primary}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (member: Member) => (
        <StatusBadge status={member.member_type} />
      ),
    },
    {
      key: "registered",
      header: "Registered",
      cell: (member: Member) => new Date(member.registered_date).toLocaleDateString(),
    },
    {
      key: "status",
      header: "Status",
      cell: (member: Member) => (
        <StatusBadge status={member.status} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (member: Member) => (
        <Select
          value={member.status}
          onValueChange={(value) => handleStatusChange(member.member_id, value, member.status)}
          disabled={updateStatusMutation.isPending}
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
            <SelectItem value="PENDING">
              Set to Pending
            </SelectItem>
            <SelectItem value="ACTIVE">
              Activate
            </SelectItem>
            <SelectItem value="SUSPENDED">
              Suspend
            </SelectItem>
          </SelectContent>
        </Select>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Member Activation"
        subtitle="Review and activate pending or suspended member registrations"
        onBack={() => navigate("/dashboard")}
      />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Members</CardTitle>
            <CardDescription>Filter members by status and search by name or membership number</CardDescription>
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
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-filter">Search:</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-filter"
                    placeholder="Search by name or membership number..."
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
            <CardTitle>Member Activations</CardTitle>
            <CardDescription>
              Pending and suspended members awaiting activation ({members.length} member{members.length !== 1 ? 's' : ''})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={members}
              columns={columns}
              emptyMessage="No members found with the selected filter"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MemberActivation;
