import { Badge } from "@/components/ui/badge";
import type { MemberStatus, LoanStatus, AccountStatus } from "@/types";

interface StatusBadgeProps {
  status: MemberStatus | LoanStatus | AccountStatus | string;
  variant?: "default" | "outline";
}

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  const getStatusConfig = (
    status: string
  ): { className: string; label: string } => {
    const upperStatus = status.toUpperCase();

    switch (upperStatus) {
      case "ACTIVE":
        return {
          className: "status-active",
          label: "Active",
        };
      case "PENDING":
      case "REVIEW":
      case "SUBMITTED":
        return {
          className: "status-pending",
          label: status.charAt(0) + status.slice(1).toLowerCase(),
        };
      case "SUSPENDED":
      case "FROZEN":
      case "REJECTED":
      case "DEFAULT":
        return {
          className: "status-suspended",
          label: status.charAt(0) + status.slice(1).toLowerCase(),
        };
      case "APPROVED":
      case "DISBURSED":
        return {
          className: "status-approved",
          label: status.charAt(0) + status.slice(1).toLowerCase(),
        };
      case "DORMANT":
      case "CLOSED":
      case "DRAFT":
        return {
          className: "bg-muted text-muted-foreground border border-muted-foreground/20",
          label: status.charAt(0) + status.slice(1).toLowerCase(),
        };
      default:
        return {
          className: "bg-muted text-muted-foreground",
          label: status,
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
