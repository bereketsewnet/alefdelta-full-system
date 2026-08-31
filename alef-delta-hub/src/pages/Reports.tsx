import { ModernHeader } from "@/components/shared/ModernHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { FileText, Download, Calendar as CalendarIcon, TrendingUp, Info, Eye, Loader2 } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";

const Reports = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfDay(new Date()));
  const [formatType, setFormatType] = useState("pdf");
  const [selectedBranch, setSelectedBranch] = useState("head_office");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Dialog State
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  // Preview State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewTitle, setPreviewTitle] = useState("");

  const formatDataForExport = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && data !== null) {
      // Check for common array properties in API response
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.transactions)) return data.transactions;
      if (Array.isArray(data.members)) return data.members;
      if (Array.isArray(data.loans)) return data.loans;
      
      // If it's a single object (summary report), convert to array of key-value pairs for display
      return Object.entries(data).map(([key, value]) => ({
        Metric: key.replace(/_/g, ' ').toUpperCase(),
        Value: typeof value === 'object' ? JSON.stringify(value) : value
      }));
    }
    return [];
  };

  const exportToPDF = (data: any[], title: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Generated on: ${format(new Date(), "PPP")}`, 14, 30);
    doc.text(`Branch: ${selectedBranch === 'head_office' ? 'Head Office' : selectedBranch}`, 14, 36);
    if (startDate && endDate) {
      doc.text(`Period: ${format(startDate, "PP")} - ${format(endDate, "PP")}`, 14, 42);
    }

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = data.map(item => Object.values(item).map(val => 
        typeof val === 'object' ? JSON.stringify(val) : String(val)
      ));

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 50,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });
    } else {
        doc.text("No data available for the selected period.", 14, 50);
    }

    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  const exportToCSV = (data: any[], title: string) => {
    if (data.length === 0) {
      toast.error("No data available to export");
      return;
    }
    const escapeCell = (value: unknown) => {
      let text = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
      // Prevent spreadsheet formula injection when the CSV is opened in Excel.
      if (/^[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const headers = Object.keys(data[0]);
    const csvOutput = [
      headers.map(escapeCell).join(','),
      ...data.map((row) => headers.map((header) => escapeCell(row[header])).join(','))
    ].join('\n');
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), "yyyyMMdd")}.csv`);
  };

  const handleGenerateReport = async (reportId: string, reportName: string, mode: 'download' | 'preview' = 'download') => {
    setIsGenerating(true);
    toast.info(`${mode === 'preview' ? 'Fetching' : 'Generating'} ${reportName}...`);
    
    try {
      let endpoint = "";
      const params: any = {};

      if (startDate) params.start_date = startOfDay(startDate).toISOString();
      if (endDate) params.end_date = endOfDay(endDate).toISOString();

      switch (reportId) {
        case "daily-operational":
          endpoint = "/reports/daily-operational";
          params.date = startDate ? startDate.toISOString() : new Date().toISOString();
          break;
        case "monthly-statement":
          endpoint = "/reports/monthly-statement";
          const d = startDate || new Date();
          params.month = d.getMonth() + 1;
          params.year = d.getFullYear();
          break;
        case "regulatory":
          endpoint = "/reports/regulatory";
          break;
        case "transactions":
          endpoint = "/reports/transactions";
          break;
        case "loan-portfolio":
          endpoint = "/reports/loan-portfolio";
          break;
        case "delinquency":
          endpoint = "/reports/delinquency";
          break;
        case "cash-flow":
          endpoint = "/reports/cash-flow";
          break;
        case "member-summary":
          endpoint = "/reports/member-summary";
          break;
        default:
          endpoint = "/reports/summary"; 
          break;
      }

      const response = await api.get(endpoint, { params });
      const data = formatDataForExport(response.data);

      if (mode === 'preview') {
        setPreviewTitle(reportName);
        setPreviewData(data);
        setPreviewOpen(true);
      } else {
        if (formatType === 'pdf') exportToPDF(data, reportName);
        else if (formatType === 'csv') exportToCSV(data, reportName);
        
        toast.success(`${reportName} downloaded successfully`);
      }

    } catch (error) {
      console.error("Report generation failed", error);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShowDescription = (report: any) => {
    setSelectedReport(report);
    setDescriptionDialogOpen(true);
  };

  const reportTypes = [
    {
      id: "transactions",
      name: "Transaction Report",
      description: "Detailed list of all transactions",
      longDescription: "Provides a comprehensive log of all financial transactions including deposits, withdrawals, transfers, and adjustments. Includes transaction IDs, dates, amounts, performed by user, and associated account details. Useful for auditing and tracking daily cash flow.",
      icon: FileText,
    },
    {
      id: "loan-portfolio",
      name: "Loan Portfolio Report",
      description: "Overview of all active loans",
      longDescription: "Summarizes the current state of the loan portfolio. Metrics include total outstanding principal, interest accrued, number of active loans, portfolio at risk (PAR), and sector-wise distribution. Critical for assessing credit risk and asset quality.",
      icon: TrendingUp,
    },
    {
      id: "member-summary",
      name: "Member Summary",
      description: "Member demographics and account balances",
      longDescription: "Aggregates member data including total count, active vs inactive status, gender distribution, and total savings deposits. Helps in understanding the customer base and deposit mobilization trends.",
      icon: FileText,
    },
    {
      id: "delinquency",
      name: "Delinquency Report",
      description: "Loans in arrears and default status",
      longDescription: "Lists all loans that are past due. Categorizes them by days overdue (e.g., 1-30, 31-60, 61-90, 90+). Includes borrower details, overdue amount, and penalty interest. Essential for collections and recovery efforts.",
      icon: FileText,
    },
    {
      id: "cash-flow",
      name: "Cash Flow Statement",
      description: "Daily cash movements and balances",
      longDescription: "Tracks the inflow and outflow of cash for a specific period. Shows opening balance, total receipts (deposits, repayments), total payments (withdrawals, disbursements, expenses), and closing balance. Validates liquidity position.",
      icon: FileText,
    },
    {
      id: "financial",
      name: "Financial Statement",
      description: "Balance sheet and income statement",
      longDescription: "Standard financial reports including the Balance Sheet (Assets, Liabilities, Equity) and Income Statement (Revenue, Expenses, Net Income). Complies with standard accounting practices for cooperative societies.",
      icon: FileText,
    },
    {
      id: "daily-operational",
      name: "Daily Operational Report",
      description: "End-of-day summary of all operations",
      longDescription: "A holistic view of the day's activities. Includes total transaction counts/volumes by type, new members added, new accounts opened, and loans disbursed. Used by branch managers to sign off on the day's business.",
      icon: FileText,
    },
    {
      id: "monthly-statement",
      name: "Monthly Statement",
      description: "Member account statements for the month",
      longDescription: "Generates individual account statements for members for a selected month. Shows opening balance, itemized transactions with dates and descriptions, interest earned/charged, and closing balance.",
      icon: FileText,
    },
    {
      id: "regulatory",
      name: "Regulatory Compliance",
      description: "Tax and regulatory reporting (Directive 982/2024)",
      longDescription: "Specific reports required by the regulatory body (Directive No. 982/2024). Calculates key prudential ratios like Capital Adequacy, Liquidity Ratio, and Non-Performing Loan (NPL) ratios. Ensures compliance with government standards.",
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader 
        title="Reports & Analytics"
        subtitle="Generate and download operational reports"
        onBack={() => window.history.back()}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">Generate and download various operational reports</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
            <CardDescription>Select date range and format for your reports</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>Format</Label>
              <Select defaultValue="pdf" onValueChange={setFormatType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Branch</Label>
              <Select defaultValue="head_office" onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="head_office">Head Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => {
            const ReportIcon = report.icon;
            return (
              <Card key={report.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ReportIcon className="h-5 w-5" />
                      {report.name}
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 -mt-1 -mr-2"
                      onClick={() => handleShowDescription(report)}
                    >
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <CardDescription className="mt-2">{report.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto grid grid-cols-2 gap-2">
                   <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleGenerateReport(report.id, report.name, 'preview')}
                    disabled={isGenerating}
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                    Preview
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => handleGenerateReport(report.id, report.name, 'download')}
                    disabled={isGenerating}
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    Download
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Report Description Dialog */}
        <Dialog open={descriptionDialogOpen} onOpenChange={setDescriptionDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedReport?.icon && <selectedReport.icon className="h-5 w-5 text-primary" />}
                {selectedReport?.name}
              </DialogTitle>
              <DialogDescription className="pt-2 text-base text-foreground">
                {selectedReport?.longDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
              <p><strong>Selected Format:</strong> {formatType.toUpperCase()}</p>
              <p><strong>Selected Branch:</strong> {selectedBranch.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              <p><strong>Period:</strong> {startDate ? format(startDate, 'PP') : 'All Time'} - {endDate ? format(endDate, 'PP') : 'Present'}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDescriptionDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setDescriptionDialogOpen(false);
                handleGenerateReport(selectedReport?.id, selectedReport?.name, 'download');
              }}>
                <Download className="h-4 w-4 mr-2" />
                Download Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Data Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-[800px] h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview: {previewTitle}
              </DialogTitle>
              <DialogDescription>
                Previewing data for {selectedBranch.replace('_', ' ')} ({startDate ? format(startDate, 'MMM d') : ''} - {endDate ? format(endDate, 'MMM d') : ''})
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 border rounded-md overflow-hidden relative">
              <div className="absolute inset-0 overflow-auto">
                <div className="min-w-full inline-block align-middle">
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {previewData.length > 0 ? Object.keys(previewData[0]).map((key) => (
                            <TableHead key={key} className="font-bold whitespace-nowrap bg-background sticky top-0 z-10">{key.replace(/_/g, ' ').toUpperCase()}</TableHead>
                          )) : <TableHead>No Data</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                         {previewData.length > 0 ? (
                            previewData.map((row, i) => (
                              <TableRow key={i}>
                                {Object.values(row).map((val: any, j) => (
                                  <TableCell key={j} className="whitespace-nowrap">
                                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                         ) : (
                           <TableRow>
                             <TableCell colSpan={100} className="text-center h-24 text-muted-foreground">
                               No records found for the selected criteria.
                             </TableCell>
                           </TableRow>
                         )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2">
               <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Close Preview
              </Button>
              <Button onClick={() => {
                setPreviewOpen(false);
                exportToPDF(previewData, previewTitle);
              }}>
                Download PDF
              </Button>
               <Button variant="secondary" onClick={() => {
                setPreviewOpen(false);
                exportToExcel(previewData, previewTitle);
              }}>
                Download Excel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
};

export default Reports;
