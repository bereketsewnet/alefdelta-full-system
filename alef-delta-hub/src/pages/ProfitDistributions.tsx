import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Banknote, CheckCircle2, Download, FileBarChart, Info, Landmark, Plus, RefreshCw, Scale, ShieldCheck, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "@/lib/api";
import type { AccountProduct, User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ModernHeader } from "@/components/shared/ModernHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type BucketBasis = "SHARE_UNITS" | "SAVINGS_BALANCE" | "INTERNAL";
type Bucket = { bucket_code: string; name: string; bucket_name?: string; percentage_bps: number; allocation_basis: BucketBasis; is_member_payable: boolean; eligible_products: string[]; allocated_amount?: string };
type Policy = { policy_id: string; policy_version: number; name: string; reserve_bps: number; board_quorum_count: number; payout_product_code: string; status: string; buckets: Bucket[]; created_at?: string };
type MasterSummary = { balance: string; total_inflows: string; total_outflows: string; operating_profit: string; retained_allocations: string; available_balance: string };
type LedgerEntry = { ledger_id: string; entry_date: string; direction: "INFLOW" | "OUTFLOW"; entry_type: string; amount: string; balance_after: string; affects_profit: boolean; description?: string; performed_by_username?: string };
type MemberAllocation = { member_id: string; membership_no: string; member_name: string; share_balance: string; calculated_share_units: string; override_share_units: string | null; eligible_savings_balance: string; share_dividend_amount: string; savings_dividend_amount: string; total_payout_amount: string; payout_status: string; payout_account_id?: string | null };
type Vote = { vote_id: string; voter_id: string; username: string; decision: "PENDING" | "APPROVED" | "REJECTED"; reason?: string | null; rejection_resolved: boolean; resolution_reason?: string | null; resolved_by_username?: string | null };
type Distribution = { distribution_id: string; period_start: string; period_end: string; status: string; total_inflows: string; total_outflows: string; net_profit: string; reserve_amount: string; member_payout_amount: string; retained_allocation_amount: string; share_price: string; total_share_units: string; total_eligible_savings: string; policy_snapshot: Policy; allocations?: Bucket[]; members?: MemberAllocation[]; votes?: Vote[]; created_at: string };
type PayoutValidation = { valid: boolean; failures: string[]; available_balance: string; required_balance: string; recipient_count: number };

const money = (value: string | number | undefined) => `ETB ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const shareUnits = (value: string | number | null | undefined) => {
  const normalized = String(value ?? '0').trim();
  const [whole = '0', fraction = ''] = normalized.split('.');
  return `${whole}.${fraction.padEnd(8, '0').slice(0, 8)}`;
};
const errorMessage = (error: unknown) => {
  const value = error as { response?: { data?: { message?: string; details?: { failures?: string[] } } }; message?: string };
  const failures = value.response?.data?.details?.failures;
  return failures?.length ? `${value.response?.data?.message}: ${failures.join("; ")}` : value.response?.data?.message || value.message || "Request failed";
};
const statusVariant = (status: string) => status === "PAID" || status === "READY_FOR_PAYOUT" ? "default" : status === "VOID" || status === "REJECTED" ? "destructive" : "secondary";

const InfoTip = ({ title, description, example }: { title: string; description: string; example: string }) => {
  const [open, setOpen] = useState(false);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <button type="button" aria-label={`Explain ${title}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Info className="h-4 w-4" />
      </button>
    </PopoverTrigger>
    <PopoverContent side="bottom" align="end" className="w-80 text-sm" onOpenAutoFocus={(event) => event.preventDefault()}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-muted-foreground">{description}</p>
      <div className="mt-3 rounded-md bg-muted p-2.5"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Simple example</p><p className="mt-1">{example}</p></div>
    </PopoverContent>
  </Popover>;
};

const MetricCard = ({ label, value, icon, description, example }: { label: string; value: string; icon: ReactNode; description: string; example: string }) => <Card>
  <CardHeader className="pb-2">
    <div className="flex items-start justify-between gap-2"><CardDescription>{label}</CardDescription><InfoTip title={label} description={description} example={example} /></div>
    <CardTitle>{value}</CardTitle>
  </CardHeader>
  <CardContent>{icon}</CardContent>
</Card>;

const ReportMetric = ({ label, value, description, example }: { label: string; value: string; description: string; example: string }) => <div className="rounded-md border bg-card p-3">
  <div className="flex items-start justify-between gap-2"><p className="text-xs text-muted-foreground">{label}</p><InfoTip title={label} description={description} example={example} /></div>
  <p className="text-xl font-bold">{value}</p>
</div>;

const ProfitDistributions = () => {
  const navigate = useNavigate();
  const client = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [overrideMember, setOverrideMember] = useState<MemberAllocation | null>(null);
  const [resolveVote, setResolveVote] = useState<Vote | null>(null);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [period, setPeriod] = useState({ period_start: "", period_end: "" });
  const [adjustment, setAdjustment] = useState({ direction: "INFLOW", classification: "MANUAL_REVENUE", amount: "", entry_date: new Date().toISOString().slice(0, 10), affects_profit: true, description: "" });
  const [ledgerFilters, setLedgerFilters] = useState({ date_from: "", date_to: "", direction: "ALL", entry_type: "ALL" });
  const [override, setOverride] = useState({ share_units: "", reason: "" });
  const [voteReason, setVoteReason] = useState("");
  const [resolutionReason, setResolutionReason] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [policyForm, setPolicyForm] = useState<Policy | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [ledgerPdfBusy, setLedgerPdfBusy] = useState(false);
  const [policyPdfBusy, setPolicyPdfBusy] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return navigate("/login");
    const parsed = JSON.parse(stored) as User;
    if (!["ADMIN", "MANAGER", "AUDITOR", "BOARD_MEMBER"].includes(parsed.role)) return navigate("/dashboard");
    setUser(parsed);
  }, [navigate]);

  const summaryQuery = useQuery({ queryKey: ["master-summary"], queryFn: async () => (await api.get<{ data: MasterSummary }>("/profit-distributions/master-account/summary")).data.data, enabled: !!user });
  const ledgerQuery = useQuery({ queryKey: ["master-ledger", ledgerFilters], queryFn: async () => {
    const params = new URLSearchParams({ limit: "100" });
    if (ledgerFilters.date_from) params.set("date_from", ledgerFilters.date_from);
    if (ledgerFilters.date_to) params.set("date_to", ledgerFilters.date_to);
    if (ledgerFilters.direction !== "ALL") params.set("direction", ledgerFilters.direction);
    if (ledgerFilters.entry_type !== "ALL") params.set("entry_type", ledgerFilters.entry_type);
    return (await api.get<{ data: LedgerEntry[] }>(`/profit-distributions/master-account/ledger?${params}`)).data.data;
  }, enabled: !!user });
  const policyQuery = useQuery({ queryKey: ["profit-policy"], queryFn: async () => (await api.get<{ data: Policy }>("/profit-distributions/policies/current")).data.data, enabled: !!user });
  const policyHistoryQuery = useQuery({ queryKey: ["profit-policies"], queryFn: async () => (await api.get<{ data: Policy[] }>("/profit-distributions/policies")).data.data, enabled: !!user });
  const productsQuery = useQuery({ queryKey: ["account-products"], queryFn: async () => (await api.get<{ data: AccountProduct[] }>("/account-products")).data.data, enabled: !!user });
  const distributionsQuery = useQuery({ queryKey: ["profit-distributions"], queryFn: async () => (await api.get<{ data: Distribution[] }>("/profit-distributions")).data.data, enabled: !!user });
  const detailQuery = useQuery({ queryKey: ["profit-distribution", selectedId], queryFn: async () => (await api.get<{ data: Distribution }>(`/profit-distributions/${selectedId}`)).data.data, enabled: !!user && !!selectedId });
  const payoutValidationQuery = useQuery({ queryKey: ["profit-distribution-payout-validation", selectedId], queryFn: async () => (await api.get<{ data: PayoutValidation }>(`/profit-distributions/${selectedId}/payout-validation`)).data.data, enabled: !!user && !!selectedId && detailQuery.data?.status === "READY_FOR_PAYOUT" });

  useEffect(() => { if (!selectedId && distributionsQuery.data?.[0]) setSelectedId(distributionsQuery.data[0].distribution_id); }, [distributionsQuery.data, selectedId]);
  useEffect(() => { if (policyQuery.data && !policyForm) setPolicyForm(JSON.parse(JSON.stringify(policyQuery.data))); }, [policyQuery.data, policyForm]);

  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["master-summary"] }), client.invalidateQueries({ queryKey: ["master-ledger"] }),
      client.invalidateQueries({ queryKey: ["profit-policy"] }), client.invalidateQueries({ queryKey: ["profit-policies"] }), client.invalidateQueries({ queryKey: ["profit-distributions"] }),
      client.invalidateQueries({ queryKey: ["profit-distribution"] })
    ]);
  };
  const mutation = useMutation({
    mutationFn: async ({ method = "post", url, body }: { method?: "post" | "put"; url: string; body?: unknown }) => (await api[method](url, body || {})).data,
    onSuccess: async () => { toast({ title: "Success", description: "The financial record was updated successfully." }); await refresh(); },
    onError: (error) => toast({ title: "Action failed", description: errorMessage(error), variant: "destructive" })
  });

  const selected = detailQuery.data;
  const filteredMembers = useMemo(() => (selected?.members || []).filter((row) => `${row.membership_no} ${row.member_name}`.toLowerCase().includes(memberSearch.toLowerCase())), [selected?.members, memberSearch]);
  const chartData = selected ? [{ name: "Inflows", amount: Number(selected.total_inflows) }, { name: "Outflows", amount: Number(selected.total_outflows) }, { name: "Net Profit", amount: Number(selected.net_profit) }] : [];
  const allocationData = selected?.allocations?.map((item) => ({ name: item.bucket_name || item.name || item.bucket_code.replaceAll("_", " "), value: Number(item.allocated_amount), rate: Number(item.percentage_bps) / 100 })) || [];
  const memberBucketFormula = selected?.allocations?.filter((item) => item.is_member_payable).map((item) => money(item.allocated_amount)).join(" + ") || "No member buckets";
  const internalBucketFormula = selected?.allocations?.filter((item) => !item.is_member_payable).map((item) => money(item.allocated_amount)).join(" + ") || "No internal buckets";
  const colors = ["#0f766e", "#2563eb", "#d97706", "#7c3aed", "#dc2626", "#0891b2", "#65a30d"];
  const currentVote = selected?.votes?.find((vote) => vote.voter_id === user?.user_id);
  const approvals = selected?.votes?.filter((vote) => vote.decision === "APPROVED").length || 0;
  const unresolved = selected?.votes?.filter((vote) => vote.decision === "REJECTED" && !vote.rejection_resolved).length || 0;
  const percentTotal = policyForm ? policyForm.reserve_bps + policyForm.buckets.reduce((sum, bucket) => sum + Number(bucket.percentage_bps), 0) : 0;
  const exportMembers = () => {
    if (!selected?.members?.length) return;
    const rows = [["Membership No", "Member", "Share Balance", "Fractional Shares", "Eligible Savings", "Share Dividend", "Savings Dividend", "Total Payout"], ...selected.members.map((member) => [member.membership_no, member.member_name, member.share_balance, shareUnits(member.override_share_units ?? member.calculated_share_units), member.eligible_savings_balance, member.share_dividend_amount, member.savings_dividend_amount, member.total_payout_amount])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `profit-distribution-${selected.period_start}-${selected.period_end}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadFullReportPdf = () => {
    if (!selected) return;
    setPdfBusy(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 12;
      const reportAllocations = selected.allocations || [];
      const reportMembers = selected.members || [];
      const reportVotes = selected.votes || [];

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("ALEF DELTA SACCO - Profit Distribution Report", margin, 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Period: ${selected.period_start} to ${selected.period_end}   Status: ${selected.status.replaceAll("_", " ")}   Policy: v${selected.policy_snapshot.policy_version}`, margin, 22);
      doc.text(`Distribution ID: ${selected.distribution_id}   Generated: ${new Date(selected.created_at).toLocaleString()}`, margin, 27);

      autoTable(doc, {
        startY: 32,
        head: [["Total Inflows", "Total Outflows", "Net Profit", "Statutory Reserve", "Member Payout", "Other Retained", "Share Price", "Fractional Shares", "Eligible Savings"]],
        body: [[money(selected.total_inflows), money(selected.total_outflows), money(selected.net_profit), money(selected.reserve_amount), money(selected.member_payout_amount), money(selected.retained_allocation_amount), money(selected.share_price), shareUnits(selected.total_share_units), money(selected.total_eligible_savings)]],
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [15, 118, 110] }
      });

      let cursorY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 45) + 7;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Profit Summary", margin, cursorY);
      cursorY += 5;
      const profitRows = [
        { name: "Inflows", value: Number(selected.total_inflows), color: [15, 118, 110] as [number, number, number] },
        { name: "Outflows", value: Number(selected.total_outflows), color: [217, 119, 6] as [number, number, number] },
        { name: "Net Profit", value: Number(selected.net_profit), color: [37, 99, 235] as [number, number, number] }
      ];
      const maxProfitValue = Math.max(1, ...profitRows.map((row) => Math.abs(row.value)));
      profitRows.forEach((row, index) => {
        const y = cursorY + index * 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(row.name, margin, y + 3.5);
        doc.setFillColor(235, 238, 240);
        doc.rect(margin + 24, y, 70, 4, "F");
        doc.setFillColor(...row.color);
        doc.rect(margin + 24, y, 70 * Math.abs(row.value) / maxProfitValue, 4, "F");
        doc.text(money(row.value), margin + 98, y + 3.5);
      });

      autoTable(doc, {
        startY: cursorY + 25,
        head: [["Color", "Allocation Bucket", "Rate", "Basis", "Member Payable", "Allocated Amount"]],
        body: reportAllocations.map((bucket) => ["", bucket.bucket_name || bucket.name || bucket.bucket_code.replaceAll("_", " "), `${(Number(bucket.percentage_bps) / 100).toFixed(2)}%`, bucket.allocation_basis.replaceAll("_", " "), bucket.is_member_payable ? "Yes" : "No", money(bucket.allocated_amount)]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 118, 110] },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 0) {
            const color = colors[data.row.index % colors.length];
            data.cell.styles.fillColor = [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)];
          }
        }
      });

      autoTable(doc, {
        startY: ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || cursorY + 35) + 8,
        head: [["Membership No", "Member", "Share Balance", "Fractional Shares", "Eligible Savings", "Share Dividend", "Savings Dividend", "Total Payout", "Payout Status"]],
        body: reportMembers.map((member) => [member.membership_no, member.member_name, money(member.share_balance), shareUnits(member.override_share_units ?? member.calculated_share_units), money(member.eligible_savings_balance), money(member.share_dividend_amount), money(member.savings_dividend_amount), money(member.total_payout_amount), member.payout_status]),
        styles: { fontSize: 6.5, cellPadding: 1.6, overflow: "linebreak" },
        headStyles: { fillColor: [37, 99, 235] },
        columnStyles: { 1: { cellWidth: 40 } },
        margin: { left: margin, right: margin }
      });

      if (reportVotes.length) {
        autoTable(doc, {
          startY: ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 20) + 8,
          head: [["Board Member", "Decision", "Reason", "Rejection Resolution"]],
          body: reportVotes.map((vote) => [vote.username, vote.decision, vote.reason || "-", vote.rejection_resolved ? `${vote.resolved_by_username || "Admin"}: ${vote.resolution_reason || "Resolved"}` : vote.decision === "REJECTED" ? "Unresolved" : "-"]),
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [124, 58, 237] },
          columnStyles: { 2: { cellWidth: 85 }, 3: { cellWidth: 85 } },
          margin: { left: margin, right: margin }
        });
      }

      const pageCount = doc.getNumberOfPages();
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setFontSize(7);
        doc.setTextColor(100);
        doc.text(`ALEF DELTA SACCO | ${selected.period_start} to ${selected.period_end}`, margin, 204);
        doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, 204, { align: "right" });
      }
      doc.save(`profit-distribution-${selected.period_start}-${selected.period_end}.pdf`);
      toast({ title: "PDF Downloaded", description: `The complete report includes ${reportMembers.length} member allocation row(s).` });
    } catch (error) {
      toast({ title: "PDF Export Failed", description: errorMessage(error), variant: "destructive" });
    } finally {
      setPdfBusy(false);
    }
  };

  const downloadLedgerPdf = async () => {
    setLedgerPdfBusy(true);
    try {
      const rows: LedgerEntry[] = [];
      let offset = 0;
      let total = 0;
      do {
        const params = new URLSearchParams({ limit: "200", offset: String(offset) });
        if (ledgerFilters.date_from) params.set("date_from", ledgerFilters.date_from);
        if (ledgerFilters.date_to) params.set("date_to", ledgerFilters.date_to);
        if (ledgerFilters.direction !== "ALL") params.set("direction", ledgerFilters.direction);
        if (ledgerFilters.entry_type !== "ALL") params.set("entry_type", ledgerFilters.entry_type);
        const response = await api.get<{ data: LedgerEntry[]; total: number }>(`/profit-distributions/master-account/ledger?${params}`);
        const pageRows = response.data.data || [];
        if (!pageRows.length) break;
        rows.push(...pageRows);
        total = Number(response.data.total || rows.length);
        offset += pageRows.length;
      } while (offset < total && offset > 0);

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("ALEF DELTA SACCO - Master Ledger", 12, 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const periodLabel = ledgerFilters.date_from || ledgerFilters.date_to ? `${ledgerFilters.date_from || "Beginning"} to ${ledgerFilters.date_to || "Present"}` : "All available dates";
      doc.text(`Period: ${periodLabel}   Direction: ${ledgerFilters.direction}   Entry type: ${ledgerFilters.entry_type}`, 12, 22);
      doc.text(`Exported: ${new Date().toLocaleString()}   Records: ${rows.length}`, 12, 27);
      autoTable(doc, {
        startY: 32,
        head: [["Date", "Entry Type", "Direction", "Amount", "Balance After", "Profit Treatment", "Performed By", "Description"]],
        body: rows.map((entry) => [entry.entry_date, entry.entry_type.replaceAll("_", " "), entry.direction, money(entry.amount), money(entry.balance_after), entry.affects_profit ? "Affects profit" : "Non-profit", entry.performed_by_username || "System", entry.description || "-"]),
        styles: { fontSize: 7, cellPadding: 1.8, overflow: "linebreak" },
        headStyles: { fillColor: [15, 118, 110] },
        columnStyles: { 7: { cellWidth: 72 } },
        margin: { left: 12, right: 12, bottom: 12 }
      });
      const pageCount = doc.getNumberOfPages();
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page); doc.setFontSize(7); doc.setTextColor(100);
        doc.text("ALEF DELTA SACCO | Append-only Master Ledger", 12, 204);
        doc.text(`Page ${page} of ${pageCount}`, doc.internal.pageSize.getWidth() - 12, 204, { align: "right" });
      }
      doc.save(`sacco-master-ledger-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: "Ledger PDF Downloaded", description: `${rows.length} ledger record(s) were included using the current filters.` });
    } catch (error) {
      toast({ title: "Ledger PDF Failed", description: errorMessage(error), variant: "destructive" });
    } finally {
      setLedgerPdfBusy(false);
    }
  };

  const downloadPolicyPdf = () => {
    const policy = policyQuery.data;
    if (!policy) return;
    setPolicyPdfBusy(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("ALEF DELTA SACCO - Profit Distribution Policy", 12, 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Active Version: ${policy.policy_version}   Name: ${policy.name}   Status: ${policy.status}`, 12, 22);
      autoTable(doc, {
        startY: 28,
        head: [["Statutory Reserve", "Board Quorum", "Payout Account Product", "Configured Total"]],
        body: [[`${(policy.reserve_bps / 100).toFixed(2)}%`, `${policy.board_quorum_count} approvals`, policy.payout_product_code, `${((policy.reserve_bps + policy.buckets.reduce((sum, bucket) => sum + Number(bucket.percentage_bps), 0)) / 100).toFixed(2)}%`]],
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [15, 118, 110] }
      });
      autoTable(doc, {
        startY: ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 45) + 8,
        head: [["Order", "Bucket Code", "Bucket Name", "Rate", "Allocation Basis", "Member Payable", "Eligible Savings Products"]],
        body: policy.buckets.map((bucket, index) => [String(index + 1), bucket.bucket_code, bucket.name, `${(bucket.percentage_bps / 100).toFixed(2)}%`, bucket.allocation_basis.replaceAll("_", " "), bucket.is_member_payable ? "Yes" : "No", bucket.eligible_products.join(", ") || "Internal allocation"]),
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [37, 99, 235] },
        columnStyles: { 2: { cellWidth: 65 }, 6: { cellWidth: 55 } },
        margin: { left: 12, right: 12, bottom: 12 }
      });
      const pageCount = doc.getNumberOfPages();
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page); doc.setFontSize(7); doc.setTextColor(100);
        doc.text(`ALEF DELTA SACCO | Active Policy v${policy.policy_version}`, 12, 204);
        doc.text(`Page ${page} of ${pageCount}`, doc.internal.pageSize.getWidth() - 12, 204, { align: "right" });
      }
      doc.save(`profit-distribution-policy-v${policy.policy_version}.pdf`);
      toast({ title: "Policy PDF Downloaded", description: "The active configuration and complete allocation table were included." });
    } catch (error) {
      toast({ title: "Policy PDF Failed", description: errorMessage(error), variant: "destructive" });
    } finally {
      setPolicyPdfBusy(false);
    }
  };

  if (!user) return null;
  return <div className="min-h-screen bg-background">
    <ModernHeader title="SACCO Profit Distribution" subtitle="Master ledger, statutory allocations, Board approval and dividend payout" onBack={() => navigate("/dashboard")} actions={<Button variant="outline" onClick={() => refresh()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>} />
    <main className="container mx-auto space-y-6 px-4 py-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Master Balance" value={money(summaryQuery.data?.balance)} icon={<Landmark className="h-5 w-5 text-primary" />} description="The cash currently held in the SACCO master account after every recorded inflow and outflow." example={`${money(summaryQuery.data?.total_inflows)} total inflows − ${money(summaryQuery.data?.total_outflows)} total outflows = ${money(summaryQuery.data?.balance)}.`} />
        <MetricCard label="Operating Profit to Date" value={money(summaryQuery.data?.operating_profit)} icon={<Banknote className="h-5 w-5 text-emerald-600" />} description="Revenue that affects profit minus expenses that affect profit. Dividend payouts and opening adjustments are excluded." example="If loan interest and fees are ETB 10,000 and regular savings interest expense is ETB 2,000, operating profit is ETB 8,000." />
        <MetricCard label="Recorded Inflows" value={money(summaryQuery.data?.total_inflows)} icon={<Plus className="h-5 w-5 text-blue-600" />} description="All money added to the master account, including registration fees, collected loan interest, penalties and manual inflows." example="ETB 1,000 registration fee + ETB 500 loan interest = ETB 1,500 recorded inflows." />
        <MetricCard label="Recorded Outflows" value={money(summaryQuery.data?.total_outflows)} icon={<Scale className="h-5 w-5 text-amber-600" />} description="All money leaving the master account, including regular savings interest, expenses and completed dividend payouts." example="ETB 200 savings interest + ETB 800 dividend payout = ETB 1,000 recorded outflows." />
        <MetricCard label="Retained Allocations" value={money(summaryQuery.data?.retained_allocations)} icon={<ShieldCheck className="h-5 w-5 text-violet-600" />} description="The statutory reserve plus internal allocation buckets retained from completed distributions. This money is not paid to members." example="From ETB 100 profit: ETB 30 reserve + ETB 13 internal funds = ETB 43 retained." />
        <MetricCard label="Available Balance" value={money(summaryQuery.data?.available_balance)} icon={<CheckCircle2 className="h-5 w-5 text-teal-600" />} description="The current master-account amount available before a new payout. The system checks this against the required member payout." example={`If a payout needs ETB 30 and the available balance is ${money(summaryQuery.data?.available_balance)}, payout is allowed only when the available amount is at least ETB 30.`} />
      </div>

      <Tabs defaultValue="distributions">
        <TabsList className="flex h-auto flex-wrap"><TabsTrigger value="distributions">Distributions</TabsTrigger><TabsTrigger value="ledger">Master Ledger</TabsTrigger><TabsTrigger value="policy">Policy Settings</TabsTrigger></TabsList>
        <TabsContent value="ledger" className="space-y-4">
          <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={downloadLedgerPdf} disabled={ledgerPdfBusy}><Download className="mr-2 h-4 w-4" />{ledgerPdfBusy ? "Preparing PDF..." : "Download Ledger PDF"}</Button>{user.role === "ADMIN" && <Button onClick={() => setAdjustOpen(true)}><Plus className="mr-2 h-4 w-4" />Manual Adjustment</Button>}</div>
          <Card><CardContent className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-4"><div><Label>From</Label><Input type="date" value={ledgerFilters.date_from} onChange={(e) => setLedgerFilters({ ...ledgerFilters, date_from: e.target.value })} /></div><div><Label>To</Label><Input type="date" value={ledgerFilters.date_to} onChange={(e) => setLedgerFilters({ ...ledgerFilters, date_to: e.target.value })} /></div><div><Label>Direction</Label><Select value={ledgerFilters.direction} onValueChange={(value) => setLedgerFilters({ ...ledgerFilters, direction: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All directions</SelectItem><SelectItem value="INFLOW">Inflows</SelectItem><SelectItem value="OUTFLOW">Outflows</SelectItem></SelectContent></Select></div><div><Label>Entry type</Label><Select value={ledgerFilters.entry_type} onValueChange={(value) => setLedgerFilters({ ...ledgerFilters, entry_type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All types</SelectItem>{["REGISTRATION_FEE", "LOAN_INTEREST", "LOAN_PENALTY", "SAVINGS_INTEREST", "MANUAL_REVENUE", "MANUAL_EXPENSE", "OPENING_ADJUSTMENT", "DIVIDEND_PAYOUT", "REVERSAL"].map((type) => <SelectItem key={type} value={type}>{type.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></div></CardContent></Card>
          <Card><CardHeader><CardTitle>Append-only Master Ledger</CardTitle><CardDescription>Operating entries affect profit; dividend payouts and opening adjustments do not.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Direction</TableHead><TableHead>Amount</TableHead><TableHead>Balance</TableHead><TableHead>Description</TableHead></TableRow></TableHeader><TableBody>{ledgerQuery.data?.map((entry) => <TableRow key={entry.ledger_id}><TableCell>{entry.entry_date}</TableCell><TableCell>{entry.entry_type.replaceAll("_", " ")}</TableCell><TableCell><Badge variant={entry.direction === "INFLOW" ? "default" : "secondary"}>{entry.direction}</Badge></TableCell><TableCell>{money(entry.amount)}</TableCell><TableCell>{money(entry.balance_after)}</TableCell><TableCell className="max-w-md">{entry.description || "—"}{!entry.affects_profit && <Badge className="ml-2" variant="outline">Non-profit</Badge>}</TableCell></TableRow>)}{!ledgerQuery.data?.length && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No master-ledger entries yet.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
        </TabsContent>

        <TabsContent value="policy">
          <Card><CardHeader><div className="flex flex-wrap items-start justify-between gap-4"><div><CardTitle>Active Distribution Policy v{policyQuery.data?.policy_version}</CardTitle><CardDescription>Reserve and buckets must total exactly 100.00%.</CardDescription></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={downloadPolicyPdf} disabled={!policyQuery.data || policyPdfBusy}><Download className="mr-2 h-4 w-4" />{policyPdfBusy ? "Preparing PDF..." : "Download Policy PDF"}</Button>{user.role === "ADMIN" && <Button variant="outline" onClick={() => { setPolicyForm(JSON.parse(JSON.stringify(policyQuery.data))); setPolicyOpen(true); }}>Create New Version</Button>}</div></div></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-3"><div><p className="text-xs text-muted-foreground">Statutory Reserve</p><p className="font-semibold">{((policyQuery.data?.reserve_bps || 0) / 100).toFixed(2)}%</p></div><div><p className="text-xs text-muted-foreground">Board Quorum</p><p className="font-semibold">{policyQuery.data?.board_quorum_count} approvals</p></div><div><p className="text-xs text-muted-foreground">Payout Product</p><p className="font-semibold">{policyQuery.data?.payout_product_code}</p></div></div><Table><TableHeader><TableRow><TableHead>Bucket</TableHead><TableHead>Rate</TableHead><TableHead>Basis</TableHead><TableHead>Eligible Products</TableHead></TableRow></TableHeader><TableBody>{policyQuery.data?.buckets.map((bucket) => <TableRow key={bucket.bucket_code}><TableCell>{bucket.name}</TableCell><TableCell>{(bucket.percentage_bps / 100).toFixed(2)}%</TableCell><TableCell>{bucket.allocation_basis.replaceAll("_", " ")}</TableCell><TableCell>{bucket.eligible_products.join(", ") || "Internal"}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
          {!!policyHistoryQuery.data && policyHistoryQuery.data.length > 1 && <div className="mt-5 space-y-3"><div><h3 className="text-lg font-semibold">Policy Version History</h3><p className="text-sm text-muted-foreground">Only one version can be active. Historical distributions keep their original frozen policy.</p></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{policyHistoryQuery.data.map((policy) => <Card key={policy.policy_id} className={policy.status === "ACTIVE" ? "border-primary ring-1 ring-primary/30" : ""}><CardHeader className="pb-3"><div className="flex items-start justify-between gap-2"><div><CardTitle className="text-base">Version {policy.policy_version}</CardTitle><CardDescription>{policy.name}</CardDescription></div><Badge variant={policy.status === "ACTIVE" ? "default" : "secondary"}>{policy.status === "ACTIVE" ? "Active" : "Inactive"}</Badge></div></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-2 text-sm"><div><p className="text-xs text-muted-foreground">Reserve</p><p className="font-medium">{(policy.reserve_bps / 100).toFixed(2)}%</p></div><div><p className="text-xs text-muted-foreground">Board approvals</p><p className="font-medium">{policy.board_quorum_count}</p></div></div><div className="text-xs text-muted-foreground">{policy.buckets.map((bucket) => `${bucket.name} ${(bucket.percentage_bps / 100).toFixed(2)}%`).join(" · ")}</div>{user.role === "ADMIN" && policy.status !== "ACTIVE" && <Button className="w-full" variant="outline" disabled={mutation.isPending} onClick={() => { if (window.confirm(`Activate policy version ${policy.policy_version}? New reports will use this version.`)) mutation.mutate({ url: `/profit-distributions/policies/${policy.policy_id}/activate` }); }}>Activate This Version</Button>}</CardContent></Card>)}</div></div>}
        </TabsContent>

        <TabsContent value="distributions" className="space-y-5">
          {user.role === "ADMIN" && <div className="flex justify-end"><Button onClick={() => setGenerateOpen(true)}><FileBarChart className="mr-2 h-4 w-4" />Generate Distribution</Button></div>}
          <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
            <Card><CardHeader><CardTitle>Reports</CardTitle></CardHeader><CardContent className="space-y-2">{distributionsQuery.data?.map((item) => <button key={item.distribution_id} onClick={() => setSelectedId(item.distribution_id)} className={`w-full rounded-md border p-3 text-left transition ${selectedId === item.distribution_id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}><div className="flex justify-between gap-2"><span className="font-medium">{item.period_start} – {item.period_end}</span><Badge variant={statusVariant(item.status)}>{item.status.replaceAll("_", " ")}</Badge></div><p className="mt-1 text-sm text-muted-foreground">Net {money(item.net_profit)}</p></button>)}{!distributionsQuery.data?.length && <p className="py-6 text-center text-sm text-muted-foreground">No reports generated.</p>}</CardContent></Card>
            {!selected ? <Card><CardContent className="py-20 text-center text-muted-foreground">Select or generate a distribution report.</CardContent></Card> : <div className="space-y-5">
              <Card><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{selected.period_start} – {selected.period_end}</CardTitle><CardDescription>Frozen period-end allocation report. Generating and voting move no money.</CardDescription></div><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={downloadFullReportPdf} disabled={pdfBusy}><Download className="mr-2 h-4 w-4" />{pdfBusy ? "Preparing PDF..." : "Download Full PDF"}</Button><Badge variant={statusVariant(selected.status)}>{selected.status.replaceAll("_", " ")}</Badge></div></div></CardHeader><CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><ReportMetric label="Net Profit" value={money(selected.net_profit)} description="Profit-affecting inflows collected inside this report period minus profit-affecting outflows in the same period." example={`${money(selected.total_inflows)} inflows − ${money(selected.total_outflows)} outflows = ${money(selected.net_profit)} net profit.`} /><ReportMetric label="Statutory Reserve" value={money(selected.reserve_amount)} description="The mandatory reserve percentage is deducted from net profit first and kept by the SACCO." example={`${money(selected.net_profit)} × ${(selected.policy_snapshot.reserve_bps / 100).toFixed(2)}% = ${money(selected.reserve_amount)} reserve.`} /><ReportMetric label="Member Payout" value={money(selected.member_payout_amount)} description="The sum of all member-payable buckets, currently allocated using full share units and eligible savings balances." example={`${memberBucketFormula} = ${money(selected.member_payout_amount)} total member payout.`} /><ReportMetric label="Other Retained Allocations" value={money(selected.retained_allocation_amount)} description="Internal policy buckets such as education and statutory allocations. This excludes the statutory reserve shown separately." example={`${internalBucketFormula} = ${money(selected.retained_allocation_amount)} retained internally.`} /></CardContent></Card>
              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <CardHeader><div className="flex items-start justify-between gap-2"><div><CardTitle className="text-base">Profit Summary</CardTitle><CardDescription>Compares operating money earned, spent, and remaining as distributable profit.</CardDescription></div><InfoTip title="Profit Summary Chart" description="Inflows are profit-generating revenue for the selected period. Outflows are profit-affecting expenses. Net profit is the difference available for reserve and allocation calculations." example={`${money(selected.total_inflows)} − ${money(selected.total_outflows)} = ${money(selected.net_profit)}.`} /></div></CardHeader>
                  <CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value) => money(Number(value))} /><Bar dataKey="amount" fill="#0f766e" /></BarChart></ResponsiveContainer></CardContent>
                </Card>
                <Card>
                  <CardHeader><div className="flex items-start justify-between gap-2"><div><CardTitle className="text-base">Allocation Buckets</CardTitle><CardDescription>Each color represents one frozen policy allocation.</CardDescription></div><InfoTip title="Allocation Buckets Chart" description="The pie divides net profit among the configured policy buckets. Member-payable buckets become dividends; internal buckets and the separate statutory reserve remain with the SACCO." example={`${allocationData.map((item) => `${item.name} ${item.rate.toFixed(2)}%`).join(" + ")} plus the statutory reserve = 100%.`} /></div></CardHeader>
                  <CardContent className="space-y-3">
                    <ResponsiveContainer width="100%" height={210}><PieChart><Pie data={allocationData} dataKey="value" nameKey="name" outerRadius={82}>{allocationData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip formatter={(value, _name, item) => [money(Number(value)), item?.payload?.name || "Allocation"]} /></PieChart></ResponsiveContainer>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {allocationData.map((item, index) => <div key={`${item.name}-${index}`} className="flex items-start gap-2 rounded-md border p-2 text-xs"><span className="mt-0.5 h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: colors[index % colors.length] }} /><div className="min-w-0"><p className="font-medium leading-tight">{item.name}</p><p className="text-muted-foreground">{item.rate.toFixed(2)}% · {money(item.value)}</p></div></div>)}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card><CardHeader><CardTitle>Approval Workflow</CardTitle><CardDescription>{approvals}/{selected.policy_snapshot.board_quorum_count} required approvals · {unresolved} unresolved rejection(s)</CardDescription></CardHeader><CardContent className="space-y-3"><div className="grid gap-2 md:grid-cols-2">{selected.votes?.map((vote) => <div key={vote.vote_id} className="rounded-md border p-3"><div className="flex justify-between"><span className="font-medium">{vote.username}</span><Badge variant={vote.decision === "REJECTED" ? "destructive" : vote.decision === "APPROVED" ? "default" : "secondary"}>{vote.decision}</Badge></div>{vote.reason && <p className="mt-2 text-sm">{vote.reason}</p>}{vote.decision === "REJECTED" && <p className="mt-1 text-xs text-muted-foreground">{vote.rejection_resolved ? `Resolved by ${vote.resolved_by_username}: ${vote.resolution_reason}` : "Requires Admin resolution"}</p>}{user.role === "ADMIN" && vote.decision === "REJECTED" && !vote.rejection_resolved && <Button className="mt-2" size="sm" variant="outline" onClick={() => { setResolveVote(vote); setResolutionReason(""); }}>Resolve</Button>}</div>)}</div>
                {user.role === "BOARD_MEMBER" && currentVote?.decision === "PENDING" && selected.status === "PENDING_BOARD" && <div className="space-y-2 rounded-md border p-4"><Label htmlFor="vote-reason">Decision reason</Label><Textarea id="vote-reason" value={voteReason} onChange={(e) => setVoteReason(e.target.value)} placeholder="Required for rejection; optional for approval" /><div className="flex gap-2"><Button onClick={() => mutation.mutate({ url: `/profit-distributions/${selected.distribution_id}/vote`, body: { decision: "APPROVED", reason: voteReason } })}>Approve</Button><Button variant="destructive" disabled={voteReason.trim().length < 10} onClick={() => mutation.mutate({ url: `/profit-distributions/${selected.distribution_id}/vote`, body: { decision: "REJECTED", reason: voteReason } })}>Reject</Button></div></div>}
                {user.role === "ADMIN" && <div className="space-y-2"><div className="flex flex-wrap gap-2">{selected.status === "DRAFT" && <Button onClick={() => mutation.mutate({ url: `/profit-distributions/${selected.distribution_id}/submit` })}><ShieldCheck className="mr-2 h-4 w-4" />Submit for Board Review</Button>}{selected.status === "READY_FOR_PAYOUT" && <Button disabled={!payoutValidationQuery.data?.valid || payoutValidationQuery.isLoading} onClick={() => setPayoutOpen(true)}><CheckCircle2 className="mr-2 h-4 w-4" />Approve & Payout Dividends</Button>}</div>{selected.status === "READY_FOR_PAYOUT" && payoutValidationQuery.data && !payoutValidationQuery.data.valid && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{payoutValidationQuery.data.failures.join("; ")}</div>}</div>}
              </CardContent></Card>
              <Card><CardHeader><div className="flex flex-wrap items-end justify-between gap-3"><div><CardTitle>Member Allocations</CardTitle><CardDescription>Every fractional share unit participates. The displayed {money(selected.share_price)} is the active price snapshot, not a recalculation of older ownership. Payout goes to {selected.policy_snapshot.payout_product_code}.</CardDescription></div><div className="flex gap-2"><Input className="max-w-xs" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search member" /><Button variant="outline" onClick={exportMembers}>Export CSV</Button></div></div></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Share Balance</TableHead><TableHead>Fractional Shares</TableHead><TableHead>Eligible Savings</TableHead><TableHead>Share Dividend</TableHead><TableHead>Savings Dividend</TableHead><TableHead>Total</TableHead>{user.role === "ADMIN" && selected.status === "DRAFT" && <TableHead />}</TableRow></TableHeader><TableBody>{filteredMembers.map((member) => <TableRow key={member.member_id}><TableCell><p className="font-medium">{member.member_name}</p><p className="text-xs text-muted-foreground">{member.membership_no}</p></TableCell><TableCell>{money(member.share_balance)}</TableCell><TableCell className="font-mono">{shareUnits(member.override_share_units ?? member.calculated_share_units)}{member.override_share_units !== null && <Badge className="ml-2" variant="secondary">Overridden</Badge>}</TableCell><TableCell>{money(member.eligible_savings_balance)}</TableCell><TableCell>{money(member.share_dividend_amount)}</TableCell><TableCell>{money(member.savings_dividend_amount)}</TableCell><TableCell className="font-semibold">{money(member.total_payout_amount)}</TableCell>{user.role === "ADMIN" && selected.status === "DRAFT" && <TableCell><Button size="sm" variant="outline" onClick={() => { setOverrideMember(member); setOverride({ share_units: String(member.override_share_units ?? member.calculated_share_units), reason: "" }); }}>Adjust Shares</Button></TableCell>}</TableRow>)}</TableBody></Table></CardContent></Card>
            </div>}
          </div>
        </TabsContent>
      </Tabs>
    </main>

    <Dialog open={generateOpen} onOpenChange={setGenerateOpen}><DialogContent><DialogHeader><DialogTitle>Generate Profit Distribution</DialogTitle><DialogDescription>This freezes the master-ledger result and member balances for an inclusive date range. No money moves.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="period-start">Start date</Label><Input id="period-start" type="date" value={period.period_start} onChange={(e) => setPeriod({ ...period, period_start: e.target.value })} /></div><div><Label htmlFor="period-end">End date</Label><Input id="period-end" type="date" value={period.period_end} onChange={(e) => setPeriod({ ...period, period_end: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button><Button disabled={!period.period_start || !period.period_end || mutation.isPending} onClick={() => mutation.mutate({ url: "/profit-distributions", body: period }, { onSuccess: (result) => { const id = result.data?.distribution_id; if (id) setSelectedId(id); setGenerateOpen(false); } })}>Generate Report</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}><DialogContent><DialogHeader><DialogTitle>Manual Master Account Adjustment</DialogTitle><DialogDescription>Every manual entry is permanent, identified and audited.</DialogDescription></DialogHeader><div className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><Label>Direction</Label><Select value={adjustment.direction} onValueChange={(value) => setAdjustment({ ...adjustment, direction: value, classification: value === "INFLOW" ? "MANUAL_REVENUE" : "MANUAL_EXPENSE" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INFLOW">Add funds</SelectItem><SelectItem value="OUTFLOW">Withdraw funds</SelectItem></SelectContent></Select></div><div><Label>Classification</Label><Select value={adjustment.classification} onValueChange={(value) => setAdjustment({ ...adjustment, classification: value, affects_profit: value !== "OPENING_ADJUSTMENT" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{adjustment.direction === "INFLOW" && <SelectItem value="MANUAL_REVENUE">Manual Revenue</SelectItem>}{adjustment.direction === "OUTFLOW" && <SelectItem value="MANUAL_EXPENSE">Manual Expense</SelectItem>}<SelectItem value="OPENING_ADJUSTMENT">Opening Adjustment</SelectItem></SelectContent></Select></div></div><div className="grid grid-cols-2 gap-4"><div><Label htmlFor="adjust-amount">Amount (ETB)</Label><Input id="adjust-amount" type="number" min="0.01" step="0.01" value={adjustment.amount} onChange={(e) => setAdjustment({ ...adjustment, amount: e.target.value })} /></div><div><Label htmlFor="adjust-date">Effective date</Label><Input id="adjust-date" type="date" value={adjustment.entry_date} onChange={(e) => setAdjustment({ ...adjustment, entry_date: e.target.value })} /></div></div><div className="flex items-center justify-between rounded-md border p-3"><div><Label>Affects net profit</Label><p className="text-xs text-muted-foreground">Opening adjustments should not affect operating profit.</p></div><Switch disabled={adjustment.classification === "OPENING_ADJUSTMENT"} checked={adjustment.affects_profit} onCheckedChange={(checked) => setAdjustment({ ...adjustment, affects_profit: checked })} /></div><div><Label htmlFor="adjust-description">Description *</Label><Textarea id="adjust-description" value={adjustment.description} onChange={(e) => setAdjustment({ ...adjustment, description: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button><Button disabled={Number(adjustment.amount) <= 0 || adjustment.description.trim().length < 10 || mutation.isPending} onClick={() => mutation.mutate({ url: "/profit-distributions/master-account/adjustments", body: { ...adjustment, idempotency_key: crypto.randomUUID() } }, { onSuccess: () => setAdjustOpen(false) })}>Post Adjustment</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={policyOpen} onOpenChange={setPolicyOpen}><DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0"><DialogHeader className="shrink-0 border-b px-6 py-5 pr-12"><DialogTitle>Create New Policy Version</DialogTitle><DialogDescription>The active version remains immutable. Reserve plus buckets must equal 100.00%.</DialogDescription></DialogHeader>{policyForm && <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-4"><div className="grid gap-4 md:grid-cols-3"><div><Label>Name</Label><Input value={policyForm.name} onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })} /></div><div><Label>Statutory Reserve (%)</Label><Input type="number" step="0.01" value={policyForm.reserve_bps / 100} onChange={(e) => setPolicyForm({ ...policyForm, reserve_bps: Math.round(Number(e.target.value) * 100) })} /></div><div><Label>Board Quorum</Label><Input type="number" min="1" value={policyForm.board_quorum_count} onChange={(e) => setPolicyForm({ ...policyForm, board_quorum_count: Number(e.target.value) })} /></div><div><Label>Payout Product</Label><Select value={policyForm.payout_product_code} onValueChange={(value) => setPolicyForm({ ...policyForm, payout_product_code: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{productsQuery.data?.filter((product) => product.is_active && product.financial_category === "COMPULSORY_SAVINGS").map((product) => <SelectItem key={product.product_code} value={product.product_code}>{product.name}</SelectItem>)}</SelectContent></Select></div></div><div className={`rounded-md p-3 text-sm font-medium ${percentTotal === 10000 ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>Configured total: {(percentTotal / 100).toFixed(2)}%</div><div className="flex justify-end"><Button type="button" size="sm" variant="outline" onClick={() => setPolicyForm({ ...policyForm, buckets: [...policyForm.buckets, { bucket_code: `NEW_BUCKET_${policyForm.buckets.length + 1}`, name: "New Allocation", percentage_bps: 0, allocation_basis: "INTERNAL", is_member_payable: false, eligible_products: [] }] })}><Plus className="mr-2 h-4 w-4" />Add Bucket</Button></div>{policyForm.buckets.map((bucket, index) => <div key={`${bucket.bucket_code}-${index}`} className="space-y-3 rounded-md border p-3"><div className="grid gap-3 md:grid-cols-[1fr_1.4fr_0.7fr_1fr_auto]"><div><Label>Code</Label><Input value={bucket.bucket_code} onChange={(e) => { const buckets = [...policyForm.buckets]; buckets[index] = { ...bucket, bucket_code: e.target.value }; setPolicyForm({ ...policyForm, buckets }); }} /></div><div><Label>Name</Label><Input value={bucket.name} onChange={(e) => { const buckets = [...policyForm.buckets]; buckets[index] = { ...bucket, name: e.target.value }; setPolicyForm({ ...policyForm, buckets }); }} /></div><div><Label>Percentage</Label><Input type="number" step="0.01" value={bucket.percentage_bps / 100} onChange={(e) => { const buckets = [...policyForm.buckets]; buckets[index] = { ...bucket, percentage_bps: Math.round(Number(e.target.value) * 100) }; setPolicyForm({ ...policyForm, buckets }); }} /></div><div><Label>Basis</Label><Select value={bucket.allocation_basis} onValueChange={(value) => { const buckets = [...policyForm.buckets]; buckets[index] = { ...bucket, allocation_basis: value as BucketBasis, is_member_payable: value !== "INTERNAL", eligible_products: value === "SAVINGS_BALANCE" ? bucket.eligible_products : [] }; setPolicyForm({ ...policyForm, buckets }); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SHARE_UNITS">Share Units</SelectItem><SelectItem value="SAVINGS_BALANCE">Savings Balance</SelectItem><SelectItem value="INTERNAL">Internal</SelectItem></SelectContent></Select></div><Button type="button" size="icon" variant="ghost" className="mt-5 text-destructive" onClick={() => setPolicyForm({ ...policyForm, buckets: policyForm.buckets.filter((_, bucketIndex) => bucketIndex !== index) })}><Trash2 className="h-4 w-4" /></Button></div>{bucket.allocation_basis === "SAVINGS_BALANCE" && <div><Label>Eligible Savings Products *</Label><div className="mt-2 grid gap-2 sm:grid-cols-2">{productsQuery.data?.filter((product) => product.is_active && ["COMPULSORY_SAVINGS", "VOLUNTARY_SAVINGS"].includes(product.financial_category || "")).map((product) => <label key={product.product_code} className="flex items-center gap-2 rounded border p-2 text-sm"><Checkbox checked={bucket.eligible_products.includes(product.product_code)} onCheckedChange={(checked) => { const buckets = [...policyForm.buckets]; const eligible = checked ? [...bucket.eligible_products, product.product_code] : bucket.eligible_products.filter((code) => code !== product.product_code); buckets[index] = { ...bucket, eligible_products: eligible }; setPolicyForm({ ...policyForm, buckets }); }} />{product.name} ({product.product_code})</label>)}</div></div>}</div>)}</div>}<DialogFooter className="shrink-0 border-t bg-background px-6 py-4"><Button variant="outline" onClick={() => setPolicyOpen(false)}>Cancel</Button><Button disabled={!policyForm || percentTotal !== 10000 || mutation.isPending} onClick={() => mutation.mutate({ url: "/profit-distributions/policies", body: policyForm }, { onSuccess: () => { setPolicyOpen(false); setPolicyForm(null); } })}>Activate New Version</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={!!overrideMember} onOpenChange={(open) => !open && setOverrideMember(null)}><DialogContent><DialogHeader><DialogTitle>Override Counted Fractional Shares</DialogTitle><DialogDescription>This changes only this draft report for {overrideMember?.member_name}; it does not alter the Share Capital account.</DialogDescription></DialogHeader><div className="space-y-4"><div><Label htmlFor="override-units">Fractional share units</Label><Input id="override-units" type="number" min="0" step="0.00000001" value={override.share_units} onChange={(e) => setOverride({ ...override, share_units: e.target.value })} /></div><div><Label htmlFor="override-reason">Mandatory reason</Label><Textarea id="override-reason" value={override.reason} onChange={(e) => setOverride({ ...override, reason: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setOverrideMember(null)}>Cancel</Button><Button disabled={!overrideMember || override.reason.trim().length < 10 || mutation.isPending} onClick={() => mutation.mutate({ method: "put", url: `/profit-distributions/${selectedId}/members/${overrideMember?.member_id}/share-override`, body: override }, { onSuccess: () => setOverrideMember(null) })}>Recalculate Report</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={!!resolveVote} onOpenChange={(open) => !open && setResolveVote(null)}><DialogContent><DialogHeader><DialogTitle>Resolve Board Rejection</DialogTitle><DialogDescription>The rejection remains visible in the audit trail and does not count toward the approval quorum.</DialogDescription></DialogHeader><div><Label htmlFor="resolution-reason">Admin resolution reason</Label><Textarea id="resolution-reason" value={resolutionReason} onChange={(e) => setResolutionReason(e.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setResolveVote(null)}>Cancel</Button><Button disabled={resolutionReason.trim().length < 10 || mutation.isPending} onClick={() => mutation.mutate({ url: `/profit-distributions/${selectedId}/votes/${resolveVote?.vote_id}/resolve`, body: { reason: resolutionReason } }, { onSuccess: () => setResolveVote(null) })}>Resolve Rejection</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}><DialogContent><DialogHeader><DialogTitle>Approve & Payout Dividends?</DialogTitle><DialogDescription>This is the only step that moves money. It will debit the SACCO master account by {money(selected?.member_payout_amount)} and deposit every member allocation into {selected?.policy_snapshot.payout_product_code}. The operation is atomic and cannot be partially completed.</DialogDescription></DialogHeader><div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Confirm that the Board quorum is complete and all listed member accounts are correct.</div><DialogFooter><Button variant="outline" onClick={() => setPayoutOpen(false)}>Cancel</Button><Button disabled={mutation.isPending} onClick={() => mutation.mutate({ url: `/profit-distributions/${selectedId}/payout`, body: { idempotency_key: crypto.randomUUID() } }, { onSuccess: () => setPayoutOpen(false) })}>Confirm Atomic Payout</Button></DialogFooter></DialogContent></Dialog>
  </div>;
};

export default ProfitDistributions;
