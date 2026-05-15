import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { User, DashboardKPI } from "@/types";
import { api } from "@/lib/api";
import { formatCurrency, formatPercentage } from "@/lib/utils/financial";
import { KPICard } from "@/components/dashboard/KPICard";
import {
  Wallet,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Users,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

import { UserMenu } from "@/components/shared/UserMenu";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const { data: kpiData } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await api.get<DashboardKPI>('/reports/summary');
      return res.data;
    },
    enabled: !!user
  });

  const { data: monthlyData } = useQuery({
    queryKey: ['dashboard-transactions'],
    queryFn: async () => {
      const res = await api.get('/reports/transactions');
      return res.data || [];
    },
    enabled: !!user && ['MANAGER', 'ADMIN'].includes(user.role)
  });

  const { data: loanStatusData } = useQuery({
    queryKey: ['loan-portfolio-status'],
    queryFn: async () => {
      const res = await api.get('/loans?limit=1000');
      const loans = res.data?.data || [];
      
      if (!loans || loans.length === 0) {
        return [];
      }
      
      // Count loans by status
      const statusCounts = {
        DISBURSED: 0,
        APPROVED: 0,
        UNDER_REVIEW: 0,
        PENDING: 0,
        REJECTED: 0,
        DEFAULT: 0,
        CLOSED: 0
      };
      
      loans.forEach((loan: any) => {
        const status = loan.workflow_status;
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status as keyof typeof statusCounts]++;
        }
      });
      
      const total = loans.length;
      const chartData = [
        { 
          name: "Active", 
          value: statusCounts.DISBURSED + statusCounts.APPROVED, 
          color: "hsl(var(--success))",
          percentage: total > 0 ? Math.round(((statusCounts.DISBURSED + statusCounts.APPROVED) / total) * 100) : 0
        },
        { 
          name: "Pending", 
          value: statusCounts.PENDING + statusCounts.UNDER_REVIEW, 
          color: "hsl(var(--warning))",
          percentage: total > 0 ? Math.round(((statusCounts.PENDING + statusCounts.UNDER_REVIEW) / total) * 100) : 0
        },
        { 
          name: "Defaulted", 
          value: statusCounts.DEFAULT, 
          color: "hsl(var(--destructive))",
          percentage: total > 0 ? Math.round((statusCounts.DEFAULT / total) * 100) : 0
        },
        { 
          name: "Closed", 
          value: statusCounts.CLOSED, 
          color: "hsl(var(--muted))",
          percentage: total > 0 ? Math.round((statusCounts.CLOSED / total) * 100) : 0
        },
      ].filter(item => item.value > 0); // Only show statuses with loans
      
      return chartData;
    },
    enabled: !!user && ['MANAGER', 'ADMIN'].includes(user.role)
  });

  const { data: tellerStats } = useQuery({
    queryKey: ['teller-dashboard'],
    queryFn: async () => {
      const res = await api.get('/reports/teller-dashboard');
      return res.data;
    },
    enabled: !!user && user.role === 'TELLER'
  });

  // Fetch pending deposit requests count for tellers
  const { data: pendingDepositRequests } = useQuery({
    queryKey: ['deposit-requests-pending-count'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] }>('/deposit-requests?status=PENDING');
      return res.data.data?.length || 0;
    },
    enabled: !!user && ['TELLER', 'ADMIN', 'MANAGER'].includes(user.role)
  });

  // Fetch pending loan repayment requests count
  const { data: pendingLoanRepaymentRequests } = useQuery({
    queryKey: ['loan-repayment-requests-pending-count'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] }>('/loan-repayment-requests?status=PENDING');
      return res.data.data?.length || 0;
    },
    enabled: !!user && ['TELLER', 'ADMIN', 'MANAGER'].includes(user.role)
  });

  const { data: pendingMemberRegistrationRequests } = useQuery({
    queryKey: ['member-registration-requests-pending-count'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] }>('/member-registration-requests?status=PENDING');
      return res.data.data?.length || 0;
    },
    enabled: !!user && ['TELLER', 'MANAGER', 'ADMIN'].includes(user.role)
  });

  const { data: pendingPartnerRequests } = useQuery({
    queryKey: ['partner-requests-pending-count'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] }>('/partner-requests?status=PENDING');
      return res.data.data?.length || 0;
    },
    enabled: !!user && ['TELLER', 'MANAGER', 'ADMIN'].includes(user.role)
  });

  const { data: pendingLoanRequests } = useQuery({
    queryKey: ['loan-requests-pending-count'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] }>('/loan-requests?status=PENDING');
      return res.data.data?.length || 0;
    },
    enabled: !!user && ['TELLER', 'MANAGER', 'ADMIN'].includes(user.role)
  });

  const { data: creditOfficerStats } = useQuery({
    queryKey: ['credit-officer-dashboard'],
    queryFn: async () => {
      const res = await api.get('/reports/credit-officer-dashboard');
      return res.data;
    },
    enabled: !!user && user.role === 'CREDIT_OFFICER'
  });

  if (!user) return null;

  // Fallback if loading
  const kpi = kpiData || {
    total_savings: 0,
    total_loans_outstanding: 0,
    monthly_deposits: 0,
    delinquency_rate: 0,
    active_members: 0,
    pending_approvals: 0
  };

  // Use real loan status data if available, otherwise use fallback
  const loanStatusChartData = loanStatusData && loanStatusData.length > 0 
    ? loanStatusData 
    : [
        { name: "Active", value: 0, color: "hsl(var(--success))" },
        { name: "Pending", value: kpi.pending_approvals, color: "hsl(var(--warning))" },
        { name: "Defaulted", value: 0, color: "hsl(var(--destructive))" },
        { name: "Closed", value: 0, color: "hsl(var(--muted))" },
      ];

  const getRoleDashboard = () => {
    switch (user.role) {
      case "TELLER":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Teller Dashboard</h2>
              <p className="text-muted-foreground">Manage deposits, withdrawals, and daily cash operations</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Today's Deposits"
                value={formatCurrency(tellerStats?.today_deposits?.total || 0)}
                icon={TrendingUp}
                variant="success"
                subtitle={`${tellerStats?.today_deposits?.count || 0} transactions`}
              />
              <KPICard
                title="Today's Withdrawals"
                value={formatCurrency(tellerStats?.today_withdrawals?.total || 0)}
                icon={ArrowDownRight}
                variant="warning"
                subtitle={`${tellerStats?.today_withdrawals?.count || 0} transactions`}
              />
              <KPICard
                title="Cash Drawer"
                value={formatCurrency(tellerStats?.cash_drawer || 0)}
                icon={Wallet}
                variant="primary"
                subtitle="Net cash (Deposits - Withdrawals)"
              />
              <KPICard
                title="Pending Receipts"
                value={tellerStats?.pending_receipts?.toString() || "0"}
                icon={AlertCircle}
                variant="accent"
                subtitle="Without receipt photos"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common teller operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start" size="lg" onClick={() => navigate("/transactions/new?type=DEPOSIT")}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    New Deposit
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => navigate("/transactions/new?type=WITHDRAWAL")}>
                    <ArrowDownRight className="mr-2 h-4 w-4" />
                    New Withdrawal
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => navigate("/loans/payment")}>
                    <Wallet className="mr-2 h-4 w-4" />
                    Loan Payment
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => navigate("/members")}>
                    <Users className="mr-2 h-4 w-4" />
                    Find Member
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Approvals</CardTitle>
                      <CardDescription>Review and approve member requests</CardDescription>
                    </div>
                    {(pendingDepositRequests > 0 || pendingLoanRepaymentRequests > 0 || pendingMemberRegistrationRequests > 0 || pendingPartnerRequests > 0 || pendingLoanRequests > 0) && (
                      <span className="bg-warning text-warning-foreground text-xs font-bold px-2 py-1 rounded-full">
                        {(pendingDepositRequests || 0) + (pendingLoanRepaymentRequests || 0) + (pendingMemberRegistrationRequests || 0) + (pendingPartnerRequests || 0) + (pendingLoanRequests || 0)}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant={pendingDepositRequests > 0 ? "default" : "outline"} 
                    className="w-full justify-start" 
                    size="lg" 
                    onClick={() => navigate("/manager/deposit-approvals")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Deposit Request Approvals
                    {pendingDepositRequests > 0 && (
                      <span className="ml-auto bg-background/20 text-xs font-bold px-2 py-0.5 rounded">
                        {pendingDepositRequests} pending
                      </span>
                    )}
                  </Button>
                  <Button 
                    variant={pendingLoanRepaymentRequests > 0 ? "default" : "outline"} 
                    className="w-full justify-start" 
                    size="lg" 
                    onClick={() => navigate("/manager/loan-repayment-approvals")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Loan Repayment Approvals
                    {pendingLoanRepaymentRequests > 0 && (
                      <span className="ml-auto bg-background/20 text-xs font-bold px-2 py-0.5 rounded">
                        {pendingLoanRepaymentRequests} pending
                      </span>
                    )}
                  </Button>
                  <Button 
                    variant={pendingMemberRegistrationRequests > 0 ? "default" : "outline"} 
                    className="w-full justify-start" 
                    size="lg" 
                    onClick={() => navigate("/manager/member-registration-approvals")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Member Registration Approvals
                    {pendingMemberRegistrationRequests > 0 && (
                      <span className="ml-auto bg-background/20 text-xs font-bold px-2 py-0.5 rounded">
                        {pendingMemberRegistrationRequests} pending
                      </span>
                    )}
                  </Button>
                  <Button 
                    variant={pendingPartnerRequests > 0 ? "default" : "outline"} 
                    className="w-full justify-start" 
                    size="lg" 
                    onClick={() => navigate("/manager/partner-approvals")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Partner Requests
                    {pendingPartnerRequests > 0 && (
                      <span className="ml-auto bg-background/20 text-xs font-bold px-2 py-0.5 rounded">
                        {pendingPartnerRequests} pending
                      </span>
                    )}
                  </Button>
                  <Button 
                    variant={pendingLoanRequests > 0 ? "default" : "outline"} 
                    className="w-full justify-start" 
                    size="lg" 
                    onClick={() => navigate("/manager/loan-request-approvals")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Loan Request Approvals
                    {pendingLoanRequests > 0 && (
                      <span className="ml-auto bg-background/20 text-xs font-bold px-2 py-0.5 rounded">
                        {pendingLoanRequests} pending
                      </span>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Transactions</CardTitle>
                      <CardDescription>Last 5 transactions today</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/transactions")}
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {tellerStats?.recent_transactions && tellerStats.recent_transactions.length > 0 ? (
                    <div className="space-y-3">
                      {tellerStats.recent_transactions.map((txn: any) => (
                        <div key={txn.txn_id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{txn.member_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {txn.txn_type} • {txn.membership_no} • {new Date(txn.created_at).toLocaleTimeString()}
                            </p>
                            {txn.reference && (
                              <p className="text-xs text-muted-foreground">Ref: {txn.reference}</p>
                            )}
                          </div>
                          <p className={`text-sm font-mono font-medium ${
                            txn.txn_type === 'DEPOSIT' ? 'text-success' : 'text-destructive'
                          }`}>
                            {txn.txn_type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(txn.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No transactions today</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "CREDIT_OFFICER":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Credit Officer Dashboard</h2>
              <p className="text-muted-foreground">Review loan applications and verify guarantors</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Pending Reviews"
                value={creditOfficerStats?.pending_reviews?.toString() || "0"}
                icon={AlertCircle}
                variant="warning"
                subtitle="Awaiting verification"
              />
              <KPICard
                title="This Month"
                value={creditOfficerStats?.this_month_processed?.toString() || creditOfficerStats?.this_month?.toString() || "0"}
                icon={CheckCircle}
                variant="success"
                subtitle="Applications processed"
              />
              <KPICard
                title="Portfolio Value"
                value={formatCurrency(creditOfficerStats?.portfolio_value || 0)}
                icon={DollarSign}
                variant="primary"
                subtitle="Active loans"
              />
              <KPICard
                title="Default Rate"
                value={formatPercentage(creditOfficerStats?.default_rate || 0)}
                icon={TrendingUp}
                variant="accent"
                subtitle="Within target"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Loan Applications Queue</CardTitle>
                <CardDescription>Applications pending your review</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="lg" onClick={() => navigate("/loans")}>
                  View All Applications
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case "MANAGER":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Manager Dashboard</h2>
              <p className="text-muted-foreground">Approve loans and monitor branch performance</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Pending Approvals"
                value={kpi.pending_approvals}
                icon={AlertCircle}
                variant="warning"
                subtitle="Requires your approval"
              />
              <KPICard
                title="Active Members"
                value={kpi.active_members}
                icon={Users}
                variant="primary"
                trend={{ value: 5.2, isPositive: true }}
              />
              <KPICard
                title="Total Savings"
                value={formatCurrency(kpi.total_savings)}
                icon={Wallet}
                variant="success"
                trend={{ value: 12.3, isPositive: true }}
              />
              <KPICard
                title="Loan Portfolio"
                value={formatCurrency(kpi.total_loans_outstanding)}
                icon={DollarSign}
                variant="accent"
                trend={{
                  value: kpi.loan_portfolio_trend || 0,
                  isPositive: kpi.loan_portfolio_trend_positive !== false
                }}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Manager Actions</CardTitle>
                <CardDescription>Core management functions</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" size="lg" onClick={() => navigate("/manager/approvals")}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Loan Approvals
                </Button>
                <Button 
                  variant={pendingDepositRequests > 0 ? "default" : "outline"} 
                  size="lg" 
                  onClick={() => navigate("/manager/deposit-approvals")}
                  className="relative"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Deposit Approvals
                  {pendingDepositRequests > 0 && (
                    <span className="absolute -top-1 -right-1 bg-warning text-warning-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {pendingDepositRequests}
                    </span>
                  )}
                </Button>
                <Button 
                  variant={pendingLoanRepaymentRequests > 0 ? "default" : "outline"} 
                  size="lg" 
                  onClick={() => navigate("/manager/loan-repayment-approvals")}
                  className="relative"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Loan Repayment Approvals
                  {pendingLoanRepaymentRequests > 0 && (
                    <span className="absolute -top-1 -right-1 bg-warning text-warning-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {pendingLoanRepaymentRequests}
                    </span>
                  )}
                </Button>
                <Button 
                  variant={pendingMemberRegistrationRequests > 0 ? "default" : "outline"} 
                  size="lg" 
                  onClick={() => navigate("/manager/member-registration-approvals")}
                  className="relative"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Member Registration Approvals
                  {pendingMemberRegistrationRequests > 0 && (
                    <span className="absolute -top-1 -right-1 bg-warning text-warning-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {pendingMemberRegistrationRequests}
                    </span>
                  )}
                </Button>
                <Button 
                  variant={pendingPartnerRequests > 0 ? "default" : "outline"} 
                  size="lg" 
                  onClick={() => navigate("/manager/partner-approvals")}
                  className="relative"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Partner Requests
                  {pendingPartnerRequests > 0 && (
                    <span className="absolute -top-1 -right-1 bg-warning text-warning-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {pendingPartnerRequests}
                    </span>
                  )}
                </Button>
                <Button 
                  variant={pendingLoanRequests > 0 ? "default" : "outline"} 
                  size="lg" 
                  onClick={() => navigate("/manager/loan-request-approvals")}
                  className="relative"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Loan Request Approvals
                  {pendingLoanRequests > 0 && (
                    <span className="absolute -top-1 -right-1 bg-warning text-warning-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {pendingLoanRequests}
                    </span>
                  )}
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate("/manager/activation")}>
                  <Users className="mr-2 h-4 w-4" />
                  Member Activation
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate("/manager/accounts")}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Account Management
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Transactions</CardTitle>
                  <CardDescription>Deposits vs Withdrawals trend</CardDescription>
                </CardHeader>
                <CardContent>
                  {monthlyData && monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="deposits" fill="hsl(var(--success))" name="Deposits" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="withdrawals" fill="hsl(var(--warning))" name="Withdrawals" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <p>No transaction data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Loan Portfolio Status</CardTitle>
                  <CardDescription>Distribution by loan status</CardDescription>
                </CardHeader>
                <CardContent>
                  {loanStatusChartData && loanStatusChartData.length > 0 && loanStatusChartData.some((d: any) => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={loanStatusChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {loanStatusChartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <p>No loan data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "ADMIN":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
              <p className="text-muted-foreground">System configuration and monitoring</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Total Savings"
                value={formatCurrency(kpi.total_savings)}
                icon={Wallet}
                variant="primary"
              />
              <KPICard
                title="Loans Outstanding"
                value={formatCurrency(kpi.total_loans_outstanding)}
                icon={DollarSign}
                variant="accent"
              />
              <KPICard
                title="Active Members"
                value={kpi.active_members}
                icon={Users}
                variant="success"
              />
              <KPICard
                title="Delinquency Rate"
                value={formatPercentage(kpi.delinquency_rate)}
                icon={AlertCircle}
                variant="warning"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Controls</CardTitle>
                <CardDescription>Administrative functions</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" size="lg" onClick={() => navigate("/admin/config")}>
                  Configure Interest Rates
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate("/admin/system-settings")}>
                  System Settings
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate("/admin/account-products")}>
                  Account Product Management
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate("/admin/users")}>
                  User Management
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate("/admin/members")}>
                  Member Management
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate("/admin/eod")}>
                  End of Day Process
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate("/reports")}>
                  Generate Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-gradient-to-r from-card/80 via-card/50 to-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <img 
                src="/full_logo.svg" 
                alt="ALEF-DELTA SACCO" 
                className="h-10 w-auto"
              />
              <div className="border-l pl-4">
                <h1 className="text-xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">{user.branch || "Head Office"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {getRoleDashboard()}
      </main>
    </div>
  );
};

export default Dashboard;
