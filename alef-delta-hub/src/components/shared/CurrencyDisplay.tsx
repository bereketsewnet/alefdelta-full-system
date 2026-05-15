import { formatCurrency } from "@/lib/utils/financial";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
  showSymbol?: boolean;
  variant?: "default" | "positive" | "negative" | "muted";
}

export function CurrencyDisplay({
  amount,
  className,
  showSymbol = true,
  variant = "default",
}: CurrencyDisplayProps) {
  const variantStyles = {
    default: "text-foreground",
    positive: "text-success",
    negative: "text-destructive",
    muted: "text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "numeric-display font-medium",
        variantStyles[variant],
        className
      )}
    >
      {formatCurrency(amount, showSymbol)}
    </span>
  );
}
