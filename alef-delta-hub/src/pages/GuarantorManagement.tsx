import { ModernHeader } from "@/components/shared/ModernHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/DataTable";
import { Users, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { MOCK_MEMBERS } from "@/lib/mockData";
import type { Guarantor } from "@/types";

const GuarantorManagement = () => {
  // Mock guarantor data with full member details
  const guarantors: (Guarantor & { guarantor_name?: string })[] = [
    {
      id: "gua-001",
      loan_id: "L-2024-0012",
      guarantor_member_id: "M001",
      guaranteed_amount: 50000,
      guarantor_name: "Almaz Tadesse",
    },
    {
      id: "gua-002",
      loan_id: "L-2024-0012",
      guarantor_member_id: "M002",
      guaranteed_amount: 50000,
      guarantor_name: "Berhane Gebre",
    },
    {
      id: "gua-003",
      loan_id: "L-2024-0015",
      guarantor_member_id: "M003",
      guaranteed_amount: 75000,
      guarantor_name: "Chaltu Alemayehu",
    },
  ];

  const columns = [
    {
      key: "id",
      header: "Guarantor ID",
      cell: (guar: typeof guarantors[0]) => (
        <span className="font-mono text-sm">{guar.id}</span>
      ),
    },
    {
      key: "loan_id",
      header: "Loan ID",
      cell: (guar: typeof guarantors[0]) => (
        <span className="font-mono text-sm">{guar.loan_id}</span>
      ),
    },
    {
      key: "guarantor",
      header: "Guarantor",
      cell: (guar: typeof guarantors[0]) => {
        const member = MOCK_MEMBERS.find(m => m.member_id === guar.guarantor_member_id);
        return (
          <div>
            <p className="font-medium">{guar.guarantor_name || "Unknown"}</p>
            <p className="text-sm text-muted-foreground font-mono">
              {member?.membership_no || guar.guarantor_member_id}
            </p>
          </div>
        );
      },
    },
    {
      key: "amount",
      header: "Guaranteed Amount",
      cell: (guar: typeof guarantors[0]) => (
        <CurrencyDisplay amount={guar.guaranteed_amount} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: () => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <UserCheck className="h-4 w-4 mr-1" />
            Verify
          </Button>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Users className="h-8 w-8" />
            Guarantor Management
          </h1>
          <p className="text-muted-foreground">
            View and verify loan guarantor information
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Guarantor Records</CardTitle>
            <CardDescription>Guarantors for active loan applications</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable data={guarantors} columns={columns} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default GuarantorManagement;
