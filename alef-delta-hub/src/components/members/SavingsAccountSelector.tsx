import { useState } from "react";
import { ChevronDown, ChevronUp, WalletCards } from "lucide-react";
import type { AccountProduct } from "@/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export const DEFAULT_SAVINGS_PRODUCT_CODES = ["SAV_VOLUNTARY", "SAV_COMPULSORY"];

export function isSavingsProduct(product: AccountProduct) {
  return product.is_active && (product.category === "SAVINGS" ||
    product.financial_category === "COMPULSORY_SAVINGS" ||
    product.financial_category === "VOLUNTARY_SAVINGS");
}

export function isSimpleSavingsProduct(product: AccountProduct) {
  return isSavingsProduct(product) && !product.guardian_required &&
    !product.commodity_required && !product.target_required &&
    !["CHILDREN", "IN_KIND", "MICRO"].includes(product.product_kind);
}

type Props = {
  products: AccountProduct[];
  selectedCodes: string[];
  onSelectedCodesChange: (codes: string[]) => void;
  existingCodes?: string[];
};

export function SavingsAccountSelector({
  products,
  selectedCodes,
  onSelectedCodesChange,
  existingCodes = [],
}: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const savingsProducts = products.filter(isSavingsProduct);
  const eligibleProducts = savingsProducts.filter(isSimpleSavingsProduct);
  const defaultProducts = DEFAULT_SAVINGS_PRODUCT_CODES
    .map((code) => savingsProducts.find((product) => product.product_code === code))
    .filter((product): product is AccountProduct => Boolean(product));
  const additionalProducts = savingsProducts.filter(
    (product) => !DEFAULT_SAVINGS_PRODUCT_CODES.includes(product.product_code)
  );
  const existing = new Set(existingCodes);

  const useDefaults = () => {
    const defaults = defaultProducts
      .filter(isSimpleSavingsProduct)
      .filter((product) => !existing.has(product.product_code))
      .map((product) => product.product_code);
    onSelectedCodesChange(defaults);
  };

  const toggle = (productCode: string, checked: boolean) => {
    if (existing.has(productCode)) return;
    const next = checked
      ? [...new Set([...selectedCodes, productCode])]
      : selectedCodes.filter((code) => code !== productCode);
    onSelectedCodesChange(next);
  };

  const renderProduct = (product: AccountProduct) => {
    const alreadyExists = existing.has(product.product_code);
    const requiresSeparateSetup = !isSimpleSavingsProduct(product);
    const selectable = !alreadyExists && !requiresSeparateSetup;
    const checked = alreadyExists || selectedCodes.includes(product.product_code);
    return (
      <div
        key={product.product_code}
        className={`flex items-center justify-between gap-4 rounded-lg border p-3 ${selectable ? "cursor-pointer hover:bg-muted/50" : "opacity-75"}`}
        onClick={() => selectable && toggle(product.product_code, !checked)}
        onKeyDown={(event) => {
          if (selectable && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            toggle(product.product_code, !checked);
          }
        }}
        role="checkbox"
        aria-checked={checked}
        aria-disabled={!selectable}
        tabIndex={selectable ? 0 : -1}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{product.name}</p>
            {DEFAULT_SAVINGS_PRODUCT_CODES.includes(product.product_code) && <Badge variant="secondary">Default</Badge>}
            {alreadyExists && <Badge variant="outline">Already exists</Badge>}
            {requiresSeparateSetup && <Badge variant="outline">Create separately</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">Code: {product.product_code} · {product.category || "SAVINGS"}</p>
          {requiresSeparateSetup && (
            <p className="mt-1 text-xs text-muted-foreground">
              Additional guardian, target, or commodity information is required.
            </p>
          )}
        </div>
        <Switch
          checked={checked}
          disabled={!selectable}
          onCheckedChange={(value) => toggle(product.product_code, value)}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Create ${product.name}`}
        />
      </div>
    );
  };

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-start gap-3">
        <WalletCards className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <p className="font-semibold">Savings Accounts</p>
          <p className="text-sm text-muted-foreground">
            Default savings accounts start selected. You may turn either one off or choose another eligible account.
            No opening deposit or balance transaction is created.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={useDefaults}>
          Select defaults
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onSelectedCodesChange([])}
          disabled={selectedCodes.length === 0}
        >
          Clear selection
        </Button>
      </div>

      <div className="space-y-2">
        {defaultProducts.map(renderProduct)}
        {defaultProducts.length === 0 && (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            The default savings products are not currently active. No default account will be created.
          </p>
        )}
      </div>

      {additionalProducts.length > 0 && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            className="px-0"
            onClick={() => setAdvancedOpen((open) => !open)}
          >
            {advancedOpen ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            Advanced account selection
          </Button>
          {advancedOpen && <div className="space-y-2">{additionalProducts.map(renderProduct)}</div>}
        </div>
      )}
    </div>
  );
}
