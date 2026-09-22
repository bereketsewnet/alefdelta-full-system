import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { User, Member } from "@/types";
import { api } from "@/lib/api";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, UserPlus, ArrowLeft } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce"; // Assuming this hook exists or I create it
import { ModernHeader } from "@/components/shared/ModernHeader";

const Members = () => {
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Debounce search query to avoid too many API calls
  const debouncedSearch = useDebounce(searchQuery, 500); 
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ['members', debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      // Load the complete member directory for the shared client-side table.
      // The previous 100-row cap made teller results and entry counts incomplete.
      params.append('limit', '1000');
      
      const res = await api.get<{ data: Member[], total: number }>(`/members?${params.toString()}`);
      return res.data;
    },
    enabled: !!user
  });

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
        <span className="text-sm">{row.member_type.replace("_", " ")}</span>
      ),
    },
    {
      key: "subcity",
      header: "Location",
      cell: (row: Member) => row.address_subcity,
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/members/${row.member_id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader 
        title="Members"
        subtitle="Manage member accounts"
        onBack={() => navigate("/dashboard")}
        actions={
          <Button onClick={() => navigate("/members/new")}>
            <UserPlus className="mr-2 h-4 w-4" />
            New Member
          </Button>
        }
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Member Directory</CardTitle>
                <CardDescription>
                  {data?.total || 0} member{data?.total !== 1 ? "s" : ""} found
                </CardDescription>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, member no, or phone (any format)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">Loading...</div>
            ) : (
            <DataTable
                data={data?.data || []}
              columns={columns}
              emptyMessage="No members found. Try adjusting your search."
            />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Members;
