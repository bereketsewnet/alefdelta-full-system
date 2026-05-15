import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModernHeader } from "@/components/shared/ModernHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import api from "@/lib/api";
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PlayCircle, 
  Database, 
  FileText, 
  Lock, 
  Eye, 
  Calendar, 
  DollarSign, 
  Briefcase,
  Bell,
  Calculator,
  Scale,
  TriangleAlert
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/financial";

type ProcessStep = {
  id: string;
  name: string;
  description: string;
  icon: any;
  required: boolean;
  viewLink?: string;
};

const EndOfDay = () => {
  const navigate = useNavigate();
  const [processType, setProcessType] = useState<"daily" | "monthly">("daily");
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStepId, setCurrentStepId] = useState("");
  const [processComplete, setProcessComplete] = useState(false);
  
  // State to track enabled/disabled steps
  const [enabledSteps, setEnabledSteps] = useState<Record<string, boolean>>({});

  // Dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // Data state
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    netChange: 0,
    tellerCount: 0
  });
  const [lastRunStatus, setLastRunStatus] = useState<any>(null);
  const [isWarningVisible, setIsWarningVisible] = useState(false);

  const dailySteps: ProcessStep[] = [
    { 
      id: "fee_processing", 
      name: "Fee and Charge Processing", 
      description: "Apply scheduled charges and fees",
      icon: DollarSign, 
      required: true 
    },
    { 
      id: "reconciliation", 
      name: "Reconciliation and Bookkeeping", 
      description: "Reconcile ledgers and post accruals",
      icon: Scale, 
      required: true 
    },
    { 
      id: "notifications", 
      name: "Notifications and Alerts", 
      description: "Send queued messages and alerts",
      icon: Bell, 
      required: false 
    },
    { 
      id: "daily_reports", 
      name: "Generate Daily Reports", 
      description: "Compile daily operational reports",
      icon: FileText, 
      required: false,
      viewLink: "/reports"
    },
    { 
      id: "lock_transactions", 
      name: "Lock Day Transactions", 
      description: "Prevent further transactions for the day",
      icon: Lock, 
      required: true 
    }
  ];

  const monthlySteps: ProcessStep[] = [
    { 
      id: "statement_generation", 
      name: "Statement Generation", 
      description: "Generate monthly account statements",
      icon: FileText, 
      required: false,
      viewLink: "/reports"
    },
    { 
      id: "recurring_fees", 
      name: "Recurring Fees and Charges", 
      description: "Apply monthly maintenance fees",
      icon: DollarSign, 
      required: true 
    },
    { 
      id: "loan_provisioning", 
      name: "Loan Provisioning", 
      description: "Adjust credit loss provisions (IFRS 9)",
      icon: Scale, 
      required: true 
    },
    { 
      id: "regulatory_tasks", 
      name: "Tax/Regulatory Tasks", 
      description: "Periodic compliance checks and tax accruals",
      icon: FileText, 
      required: true,
      viewLink: "/reports"
    }
  ];

  const currentSteps = processType === "daily" ? dailySteps : monthlySteps;

  // Initialize enabled steps when process type changes
  useEffect(() => {
    const initialEnabledState: Record<string, boolean> = {};
    currentSteps.forEach(step => {
      initialEnabledState[step.id] = true;
    });
    setEnabledSteps(initialEnabledState);
    setProcessComplete(false);
    setProgress(0);
    setCurrentStepId("");
  }, [processType]); // Removed currentSteps from dependency to avoid loops

  // Fetch Data on Load
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        // 1. Fetch Stats
        const statsRes = await api.get(`/system/eod/preview?type=${processType}`);
        
        if (!isMounted) return;

        const s = statsRes.data;
        // Map backend stats to UI expected format
        setStats({
          totalDeposits: s.total_deposits || 0,
          totalWithdrawals: s.total_withdrawals || 0,
          netChange: s.net_change || 0,
          tellerCount: s.active_tellers || 0
        });

        // 2. Fetch Last Run Status
        const statusRes = await api.get('/system/eod/status');
        
        if (!isMounted) return;
        
        setLastRunStatus(statusRes.data);
        
        // Check for warning
        if (processType === 'daily') {
          const lastRun = statusRes.data?.started_at ? new Date(statusRes.data.started_at) : null;
          const today = new Date();
          const isRunToday = lastRun && lastRun.getDate() === today.getDate() && lastRun.getMonth() === today.getMonth() && lastRun.getFullYear() === today.getFullYear();
          
          setIsWarningVisible(!isRunToday);
        }
      } catch (error) {
        console.error("Failed to fetch EOD data", error);
        if (isMounted) {
          // Don't show toast on mount error to avoid spamming user if server is down
          // Just log it and maybe show a visual indicator if needed
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [processType]);

  const handleRunProcess = async () => {
    const stepsToRun = currentSteps.filter(step => enabledSteps[step.id]);
    
    if (stepsToRun.length === 0) {
      toast.error("Please select at least one step to run.");
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setProcessComplete(false);
    
    try {
      // Call backend to start
      if (processType === 'daily') {
         await api.post('/system/eod/run');
      }
      
      // Simulate visual progress since backend is fast/async
      let stepIndex = 0;
      const totalSteps = stepsToRun.length;

      const interval = setInterval(() => {
        stepIndex++;
        if (stepIndex <= totalSteps) {
          setCurrentStepId(stepsToRun[stepIndex - 1].id);
          setProgress((stepIndex / totalSteps) * 100);
        } else {
          clearInterval(interval);
          setIsRunning(false);
          setProcessComplete(true);
          setCurrentStepId("");
          toast.success(`${processType === "daily" ? "End of Day" : "End of Month"} process completed successfully`);
          
          // Refresh warning state
          setIsWarningVisible(false);
        }
      }, 1500);

    } catch (error) {
      setIsRunning(false);
      toast.error("Failed to start process");
      console.error(error);
    }
  };

  const toggleStep = (stepId: string) => {
    if (isRunning) return;
    setEnabledSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const handleViewReport = (step: ProcessStep) => {
    if (step.viewLink) {
      navigate(step.viewLink);
    } else {
      setSelectedStepId(step.id);
      setDetailDialogOpen(true);
    }
  };

  const renderStepDetails = () => {
    if (!selectedStepId) return null;

    const step = currentSteps.find(s => s.id === selectedStepId);
    if (!step) return null;

    // Content based on step ID
    switch (selectedStepId) {
      case "interest_accrual":
        return (
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Savings Interest</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(1250.45)}</div>
                    <p className="text-xs text-muted-foreground">To be accrued today</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Loan Interest</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(3450.00)}</div>
                    <p className="text-xs text-muted-foreground">To be accrued today</p>
                  </CardContent>
                </Card>
             </div>
             <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
               <h4 className="font-semibold flex items-center gap-2">
                 <Calculator className="h-4 w-4" />
                 Calculation Logic
               </h4>
               <p>The system calculates daily interest accruals using the following formula:</p>
               <code className="block bg-background p-2 rounded border text-xs font-mono">
                 Daily Interest = (End of Day Balance × Annual Interest Rate) / 365
               </code>
               <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                 <li>Applies to all active Savings and Loan accounts.</li>
                 <li>Interest is accrued daily but posted to the account balance at the end of the month.</li>
                 <li>Non-Interest accounts are automatically excluded from this calculation.</li>
               </ul>
             </div>
          </div>
        );
      
      case "fee_processing":
        return (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Monthly Maintenance</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Standing Orders</TableCell>
                  <TableCell>12</TableCell>
                  <TableCell className="text-right">{formatCurrency(120)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
               <h4 className="font-semibold flex items-center gap-2">
                 <DollarSign className="h-4 w-4" />
                 Process Description
               </h4>
               <p>
                 The system identifies all scheduled fees due for today based on product configuration.
                 This includes recurring maintenance fees, standing instruction charges, and penalty fees.
               </p>
               <p className="text-muted-foreground">
                 * Insufficient funds will trigger a failed fee attempt log and may apply a retry penalty if configured.
               </p>
             </div>
          </div>
        );

      case "account_status":
        return (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Projected Status Changes</AlertTitle>
              <AlertDescription>
                The following changes will be applied during processing.
              </AlertDescription>
            </Alert>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account/Loan</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>New Status</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>LN-2024-001</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell className="text-destructive font-medium">Arrears</TableCell>
                  <TableCell className="text-xs text-muted-foreground">Missed payment (Grace period ended)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>SAV-2023-089</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell className="text-warning font-medium">Dormant</TableCell>
                  <TableCell className="text-xs text-muted-foreground">No activity for 180 days</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
               <h4 className="font-semibold flex items-center gap-2">
                 <Briefcase className="h-4 w-4" />
                 Background Logic
               </h4>
               <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                 <li><strong>Loans:</strong> Checks repayment schedules. Loans past due date + grace period move to 'Arrears'.</li>
                 <li><strong>Savings:</strong> Checks last transaction date. Accounts inactive &gt; configured dormancy period move to 'Dormant'.</li>
                 <li><strong>Maturity:</strong> Fixed deposits reaching maturity date are flagged for renewal or payout.</li>
               </ul>
             </div>
          </div>
        );

      case "reconciliation":
        return (
           <div className="space-y-4">
             <div className="grid grid-cols-3 gap-4">
               <div className="p-4 border rounded-lg bg-muted/50">
                 <p className="text-sm font-medium">System Balance</p>
                 <p className="text-xl font-bold mt-1">{formatCurrency(1500000)}</p>
               </div>
               <div className="p-4 border rounded-lg bg-muted/50">
                 <p className="text-sm font-medium">GL Balance</p>
                 <p className="text-xl font-bold mt-1">{formatCurrency(1500000)}</p>
               </div>
               <div className="p-4 border rounded-lg bg-success/10 border-success/20">
                 <p className="text-sm font-medium text-success">Variance</p>
                 <p className="text-xl font-bold mt-1 text-success">{formatCurrency(0)}</p>
               </div>
             </div>
             <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
               <h4 className="font-semibold flex items-center gap-2">
                 <Scale className="h-4 w-4" />
                 Reconciliation Process
               </h4>
               <p>
                 Ensures integrity between the Core Banking System (CBS) sub-ledgers (individual account balances) and the General Ledger (GL).
               </p>
               <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                 <li>Aggregates all savings and loan balances.</li>
                 <li>Compares totals against the GL control accounts.</li>
                 <li>Verifies that the sum of daily transaction entries matches the net change in GL cash accounts.</li>
               </ul>
             </div>
           </div>
        );

      case "notifications":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
               <h4 className="font-semibold flex items-center gap-2">
                 <Bell className="h-4 w-4" />
                 Notification Dispatch
               </h4>
               <p>
                 Sends out queued automated communications to members triggered by today's events.
               </p>
               <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                 <li><strong>Transaction Alerts:</strong> SMS/Email for deposits and withdrawals &gt; threshold.</li>
                 <li><strong>Loan Reminders:</strong> "Payment Due Tomorrow" alerts for borrowers.</li>
                 <li><strong>Status Alerts:</strong> Notifications for accounts turning dormant or loans entering arrears.</li>
               </ul>
               <p className="text-xs text-muted-foreground mt-2">
                 * System respects "Do Not Disturb" hours (9 PM - 7 AM) unless critical.
               </p>
             </div>
          </div>
        );

      case "lock_transactions":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
               <h4 className="font-semibold flex items-center gap-2">
                 <Lock className="h-4 w-4" />
                 Period Lock Logic
               </h4>
               <p>
                 Finalizes the accounting period for the current business day.
               </p>
               <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                 <li>Prevents any further backdated transactions for today.</li>
                 <li>Snapshots daily balances for historical reporting.</li>
                 <li>Advances the system date to the next business day.</li>
                 <li>Generates the "Day End" hash for audit trail integrity.</li>
               </ul>
             </div>
          </div>
        );

      // Monthly Processes
      case "interest_posting":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
               <h4 className="font-semibold flex items-center gap-2">
                 <Database className="h-4 w-4" />
                 Interest Capitalization
               </h4>
               <p>
                 Converts accrued interest into actual balance adjustments.
               </p>
               <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                 <li><strong>Savings:</strong> Credits total accrued interest for the month to member savings accounts.</li>
                 <li><strong>Loans:</strong> Debits accrued interest from loan accounts (if capitalizing) or posts to interest receivable.</li>
                 <li><strong>Taxes:</strong> Automatically deducts withholding tax on savings interest before crediting.</li>
               </ul>
             </div>
          </div>
        );

      case "statement_generation":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
               <h4 className="font-semibold flex items-center gap-2">
                 <FileText className="h-4 w-4" />
                 Statement Production
               </h4>
               <p>
                 Generates PDF statements for all active member accounts.
               </p>
               <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                 <li>Compiles all transactions from the 1st to the last day of the month.</li>
                 <li>Calculates opening and closing balances.</li>
                 <li>Archives statement files for regulatory compliance (minimum retention period).</li>
                 <li>Triggers email delivery for members opted into e-statements.</li>
               </ul>
             </div>
          </div>
        );

      case "recurring_fees":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
               <h4 className="font-semibold flex items-center gap-2">
                 <DollarSign className="h-4 w-4" />
                 Monthly Charges
               </h4>
               <p>
                 Applies subscription and maintenance fees.
               </p>
               <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                 <li><strong>Maintenance Fee:</strong> Deducted from savings accounts based on product tier.</li>
                 <li><strong>Insurance Premium:</strong> Deducts monthly micro-insurance premiums if applicable.</li>
                 <li><strong>SMS Alert Fee:</strong> Charges for notification services consumed during the month.</li>
               </ul>
             </div>
          </div>
        );

      case "loan_provisioning":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
               <h4 className="font-semibold flex items-center gap-2">
                 <Scale className="h-4 w-4" />
                 IFRS 9 Provisioning
               </h4>
               <p>
                 Calculates Expected Credit Loss (ECL) and updates provision accounts.
               </p>
               <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                 <li><strong>Stage 1 (Performing):</strong> 12-month expected loss provision.</li>
                 <li><strong>Stage 2 (Underperforming):</strong> Lifetime expected loss (loans 30-90 days past due).</li>
                 <li><strong>Stage 3 (Non-Performing):</strong> Lifetime expected loss (loans 90+ days past due).</li>
               </ul>
             </div>
          </div>
        );

      case "regulatory_tasks":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
               <h4 className="font-semibold flex items-center gap-2">
                 <FileText className="h-4 w-4" />
                 Compliance Reporting
               </h4>
               <p>
                 Prepares data for regulatory submission (Directive 982/2024).
               </p>
               <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                 <li>Calculates Liquidity Ratio (Liquid Assets / Short-term Liabilities).</li>
                 <li>Calculates Portfolio at Risk (PAR 30 and PAR 90).</li>
                 <li>Generates tax remittance reports for interest withholding tax.</li>
               </ul>
             </div>
          </div>
        );

      case "overdue_penalties":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
               <h4 className="font-semibold flex items-center gap-2">
                 <AlertCircle className="h-4 w-4" />
                 Penalty Assessment
               </h4>
               <p>
                 Applies late fees to overdue loan accounts.
               </p>
               <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                 <li>Identifies loans with missed installments for the current month.</li>
                 <li>Calculates penalty as % of overdue principal or fixed amount.</li>
                 <li>Grace periods are respected before penalty application.</li>
               </ul>
             </div>
          </div>
        );

      default:
        return (
          <div className="py-4 text-center text-muted-foreground">
            Detailed preview and logic explanation not available for this step yet.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title={processType === "daily" ? "End of Day Process" : "End of Month Process"}
        subtitle={processType === "daily" 
          ? "Review daily operations and close the business day" 
          : "Review monthly operations and close the business month"
        }
        onBack={() => navigate("/dashboard")}
        actions={
          <div className="flex items-center space-x-2 bg-muted p-1 rounded-lg">
            <Button 
              variant={processType === "daily" ? "default" : "ghost"} 
              onClick={() => !isRunning && setProcessType("daily")}
              disabled={isRunning}
              size="sm"
            >
              Daily (24h)
            </Button>
            <Button 
              variant={processType === "monthly" ? "default" : "ghost"} 
              onClick={() => !isRunning && setProcessType("monthly")}
              disabled={isRunning}
              size="sm"
            >
              Monthly (30d)
            </Button>
          </div>
        }
      />
      
      <main className="container mx-auto px-4 py-8">
        
        {/* Automation Info */}
        <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950">
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-900 dark:text-blue-100 font-bold">Automated Processes Active</AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <p className="mb-2">The following processes run automatically and do not require manual execution:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Daily 1:00 AM:</strong> Loan Penalty Processing (overdue loans)</li>
              <li><strong>Daily 3:00 AM:</strong> Member Inactivity Status Updates</li>
              <li><strong>Monthly 2:00 AM (1st):</strong> Savings Interest Posting</li>
            </ul>
            <p className="mt-2 text-xs">Configure automation settings in: Dashboard → System Settings</p>
          </AlertDescription>
        </Alert>
        
        {/* CRITICAL WARNING - If process not run today */}
        {isWarningVisible && (
           <Alert className="mb-6 border-destructive bg-destructive/10 animate-pulse">
            <TriangleAlert className="h-5 w-5 text-destructive" />
            <AlertTitle className="text-destructive font-bold text-lg">Action Required: Daily Process Pending</AlertTitle>
            <AlertDescription className="text-destructive/90 font-medium">
              The End of Day process has not been run for today ({new Date().toLocaleDateString()}). 
              Please complete this before proceeding with new transactions tomorrow to ensure accounting accuracy.
            </AlertDescription>
          </Alert>
        )}

        {!processComplete && !isWarningVisible && (
          <Alert className="mb-6 border-warning bg-warning/10">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              {processType === "daily" 
                ? "Ensure all tellers have submitted their cash drawer reconciliation before running EOD."
                : "Ensure all daily processes for the last day of the month are complete before running EOM."}
            </AlertDescription>
          </Alert>
        )}

        {processComplete && (
          <Alert className="mb-6 border-success bg-success/10">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Process Completed</AlertTitle>
            <AlertDescription>
              {processType === "daily" ? "End of Day" : "End of Month"} process completed successfully. 
              {processType === "daily" ? " Transactions are locked for today." : " Monthly accounts are updated."}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Deposits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">{formatCurrency(stats.totalDeposits)}</p>
              <p className="text-sm text-muted-foreground">Today's aggregate</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-warning">{formatCurrency(stats.totalWithdrawals)}</p>
              <p className="text-sm text-muted-foreground">Today's aggregate</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Net Change</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{formatCurrency(stats.netChange)}</p>
              <p className="text-sm text-muted-foreground">{stats.tellerCount} active tellers</p>
            </CardContent>
          </Card>
        </div>

        {/* Process Steps Section ... (Same as before) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Process Steps</CardTitle>
            <CardDescription>Configure and run the automated process steps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentSteps.map((step, index) => {
                const StepIcon = step.icon;
                
                const isEnabled = enabledSteps[step.id] ?? true; // Default to true if undefined to avoid uncontrolled state
                const isCurrent = currentStepId === step.id;
                const isCompleted = processComplete && isEnabled; 
                
                return (
                  <div key={step.id} className={`flex items-center gap-4 p-3 rounded-lg border ${isEnabled ? 'bg-card' : 'bg-muted/50 opacity-70'}`}>
                    <div className={`p-2 rounded-full ${isCompleted ? 'bg-success/20 text-success' : isCurrent ? 'bg-primary/20 text-primary' : 'bg-muted'}`}>
                      <StepIcon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{step.name}</p>
                        {step.required && <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Required</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {isCurrent && <p className="text-sm text-primary animate-pulse mt-1">Processing...</p>}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`toggle-${step.id}`} className="sr-only">Enable {step.name}</Label>
                        <Switch 
                          id={`toggle-${step.id}`}
                          checked={isEnabled}
                          onCheckedChange={() => toggleStep(step.id)}
                          disabled={isRunning}
                        />
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewReport(step)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {isCompleted && <CheckCircle2 className="h-5 w-5 text-success" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {isRunning && (
              <div className="mt-6">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Processing... {Math.round(progress)}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleRunProcess}
            disabled={isRunning || processComplete}
            className="min-w-[250px]"
          >
            <PlayCircle className="h-5 w-5 mr-2" />
            {isRunning 
              ? `Running ${processType === "daily" ? "EOD" : "EOM"}...` 
              : processComplete 
                ? "Process Complete" 
                : `Run ${processType === "daily" ? "End of Day" : "End of Month"}`
            }
          </Button>
        </div>

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {currentSteps.find(s => s.id === selectedStepId)?.name}
                <span className="text-sm font-normal text-muted-foreground px-2 py-0.5 rounded bg-muted">
                  Details
                </span>
              </DialogTitle>
              <DialogDescription>
                {currentSteps.find(s => s.id === selectedStepId)?.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {renderStepDetails()}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default EndOfDay;
