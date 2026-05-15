import { ModernHeader } from "@/components/shared/ModernHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/DataTable";
import { Shield, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import type { Collateral } from "@/types";

const CollateralManagement = () => {
  // Mock collateral data
  const collaterals: Collateral[] = [
    {
      id: "col-001",
      loan_id: "L-2024-0012",
      type: "VEHICLE",
      description: "Toyota Corolla 2018",
      estimated_value: 450000,
      document_url: "/docs/vehicle-col-001.pdf",
    },
    {
      id: "col-002",
      loan_id: "L-2024-0015",
      type: "HOUSE",
      description: "Residential Property - Bole",
      estimated_value: 2500000,
      document_url: "/docs/house-col-002.pdf",
    },
    {
      id: "col-003",
      loan_id: "L-2024-0018",
      type: "SALARY",
      description: "Salary Assignment - 24 months",
      estimated_value: 180000,
    },
  ];

  const columns = [
    {
      key: "id",
      header: "Collateral ID",
      cell: (col: Collateral) => (
        <span className="font-mono text-sm">{col.id}</span>
      ),
    },
    {
      key: "loan_id",
      header: "Loan ID",
      cell: (col: Collateral) => (
        <span className="font-mono text-sm">{col.loan_id}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (col: Collateral) => (
        <StatusBadge status={col.type} />
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (col: Collateral) => col.description,
    },
    {
      key: "value",
      header: "Estimated Value",
      cell: (col: Collateral) => <CurrencyDisplay amount={col.estimated_value} />,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (col: Collateral) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileCheck className="h-4 w-4 mr-1" />
            Verify
          </Button>
          {col.document_url && (
            <Button variant="outline" size="sm">
              View Docs
            </Button>
          )}
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
            <Shield className="h-8 w-8" />
            Collateral Management
          </h1>
          <p className="text-muted-foreground">
            View and verify loan collateral documentation
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Collateral Records</CardTitle>
            <CardDescription>Collateral attached to active loans</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable data={collaterals} columns={columns} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CollateralManagement;
