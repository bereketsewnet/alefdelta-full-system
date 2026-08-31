import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ModernHeader } from "@/components/shared/ModernHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Wallet, Plus, Trash2, Edit, ShieldCheck } from "lucide-react";
import type { AccountProduct, User } from "@/types";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type DialogMode = "create" | "edit";

// Helper function to extract error message from API errors
const getApiErrorMessage = (error: unknown): string | undefined => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return undefined;
};

// Type for account product payload
type AccountProductPayload = {
  name: string;
  description?: string | null;
  category?: string | null;
  financial_category: NonNullable<AccountProduct["financial_category"]>;
  product_kind: AccountProduct["product_kind"];
  is_active: boolean;
  guardian_required: boolean;
  commodity_required: boolean;
  target_required: boolean;
  default_commodity_type?: string | null;
  min_balance: number;
  min_deposit: number;
  interest_rate: number;
  interest_method: 'STANDARD' | 'PROFIT_SHARING';
  withdrawal_policy?: string | null;
  notes?: string | null;
};

type CreateAccountProductPayload = AccountProductPayload & {
  product_code: string;
};

type ProductFormState = {
  product_code: string;
  name: string;
  description: string;
  category: string;
  financial_category: NonNullable<AccountProduct["financial_category"]>;
  product_kind: AccountProduct["product_kind"];
  is_active: boolean;
  guardian_required: boolean;
  commodity_required: boolean;
  target_required: boolean;
  default_commodity_type: string;
  min_balance: string;
  min_deposit: string;
  interest_rate: string;
  interest_method: 'STANDARD' | 'PROFIT_SHARING';
  withdrawal_policy: string;
  notes: string;
};

const INITIAL_FORM_STATE: ProductFormState = {
  product_code: "",
  name: "",
  description: "",
  category: "",
  financial_category: "OTHER",
  product_kind: "STANDARD",
  is_active: true,
  guardian_required: false,
  commodity_required: false,
  target_required: false,
  default_commodity_type: "",
  min_balance: "0",
  min_deposit: "0",
  interest_rate: "0",
  interest_method: "STANDARD",
  withdrawal_policy: "",
  notes: ""
};

const PRODUCT_KIND_OPTIONS: { value: AccountProduct["product_kind"]; label: string }[] = [
  { value: "STANDARD", label: "Standard Savings" },
  { value: "CHILDREN", label: "Children's Savings" },
  { value: "IN_KIND", label: "In-Kind Savings" },
  { value: "MICRO", label: "Micro Savings" }
];

const parseNumberOrZero = (value: string) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapProductToForm = (product: AccountProduct): ProductFormState => ({
    product_code: product.product_code,
    name: product.name,
    description: product.description || "",
    category: product.category || "",
    financial_category: product.financial_category || "OTHER",
    product_kind: product.product_kind || "STANDARD",
    is_active: product.is_active,
    guardian_required: product.guardian_required,
    commodity_required: product.commodity_required,
    target_required: product.target_required,
    default_commodity_type: product.default_commodity_type || "",
    min_balance: product.min_balance?.toString() ?? "0",
    min_deposit: product.min_deposit?.toString() ?? "0",
    interest_rate: product.interest_rate?.toString() ?? "0",
    interest_method: product.interest_method || "STANDARD",
    withdrawal_policy: product.withdrawal_policy || "",
    notes: product.notes || ""
  });

const buildPayload = (form: ProductFormState) => ({
    name: form.name,
    description: form.description || null,
    category: form.category || null,
    financial_category: form.financial_category,
    product_kind: form.product_kind,
    is_active: form.is_active,
    guardian_required: form.guardian_required,
    commodity_required: form.commodity_required,
    target_required: form.target_required,
    default_commodity_type: form.commodity_required ? form.default_commodity_type || null : null,
    min_balance: parseNumberOrZero(form.min_balance),
    min_deposit: parseNumberOrZero(form.min_deposit),
    interest_rate: form.interest_method === 'PROFIT_SHARING' ? 0 : parseNumberOrZero(form.interest_rate),
    interest_method: form.interest_method,
    withdrawal_policy: form.withdrawal_policy || null,
    notes: form.notes || null
});

const AccountProductManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(INITIAL_FORM_STATE);
  const [editingCode, setEditingCode] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      if (userData.role !== "ADMIN") {
        navigate("/dashboard");
      }
    }
  }, [navigate]);

  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['account-products'],
    queryFn: async () => {
      const res = await api.get<{ data: AccountProduct[] }>('/account-products');
      return res.data.data || [];
    },
    enabled: !!user
  });

  const products = productsResponse || [];

  const createMutation = useMutation({
    mutationFn: async (payload: CreateAccountProductPayload) => api.post('/account-products', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-products'] });
      toast({ title: "Success", description: "Account product created successfully" });
      setDialogOpen(false);
      setForm(INITIAL_FORM_STATE);
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: getApiErrorMessage(error) || "Failed to create account product",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ code, payload }: { code: string; payload: AccountProductPayload }) => api.put(`/account-products/${code}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-products'] });
      toast({ title: "Success", description: "Account product updated successfully" });
      setDialogOpen(false);
      setEditingCode(null);
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: getApiErrorMessage(error) || "Failed to update account product",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (code: string) => api.delete(`/account-products/${code}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-products'] });
      toast({ title: "Success", description: "Account product deleted successfully" });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: getApiErrorMessage(error) || "Failed to delete account product",
        variant: "destructive"
      });
    }
  });

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingCode(null);
    setForm(INITIAL_FORM_STATE);
    setDialogOpen(true);
  };

  const openEditDialog = (product: AccountProduct) => {
    setDialogMode("edit");
    setEditingCode(product.product_code);
    setForm(mapProductToForm(product));
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.product_code.trim() || !form.name.trim()) {
      toast({ title: "Missing fields", description: "Product code and name are required", variant: "destructive" });
      return;
    }

    const payload = buildPayload(form);
    if (form.interest_method === 'STANDARD' && payload.interest_rate <= 0) {
      toast({ title: "Invalid interest", description: "Regular Interest requires a percentage greater than zero.", variant: "destructive" });
      return;
    }
    if (dialogMode === "create") {
      createMutation.mutate({
        product_code: form.product_code.toUpperCase().replace(/\s+/g, "_"),
        ...payload
      });
    } else if (editingCode) {
      updateMutation.mutate({ code: editingCode, payload });
    }
  };

  const handleDelete = (code: string) => {
    if (confirm("Are you sure you want to delete this account product?")) {
      deleteMutation.mutate(code);
    }
  };

  const handleProductKindChange = (value: AccountProduct["product_kind"]) => {
    setForm((prev) => {
      const next = { ...prev, product_kind: value };
      if (value === "CHILDREN") {
        next.guardian_required = true;
      }
      if (value === "IN_KIND") {
        next.commodity_required = true;
      }
      if (value === "MICRO") {
        next.target_required = true;
      }
      return next;
    });
  };

  const renderBadges = (product: AccountProduct) => (
    <div className="flex flex-wrap gap-2 mt-2">
      <Badge variant="outline">{product.product_kind}</Badge>
      <Badge variant="outline">{(product.financial_category || 'OTHER').replaceAll('_', ' ')}</Badge>
      <Badge variant={product.interest_method === 'PROFIT_SHARING' ? 'secondary' : 'outline'}>
        {product.interest_method === 'PROFIT_SHARING' ? 'Dividend (Profit Share)' : 'Regular Interest'}
      </Badge>
      {product.guardian_required && <Badge variant="secondary">Guardian Required</Badge>}
      {product.commodity_required && <Badge variant="secondary">In-Kind</Badge>}
      {product.target_required && <Badge variant="secondary">Target Savings</Badge>}
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Account Product Management"
        subtitle="Manage account templates and savings variants"
        onBack={() => navigate("/dashboard")}
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Product
          </Button>
        }
      />

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Loading account products...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {products.map((product) => (
              <Card key={product.product_code} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 flex-wrap">
                        {product.name}
                        {!product.is_active && <Badge variant="destructive">Inactive</Badge>}
                      </CardTitle>
                      <CardDescription>
                        Code: {product.product_code}
                        {product.category && ` · ${product.category}`}
                      </CardDescription>
                      {renderBadges(product)}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(product.product_code)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {product.description && <p>{product.description}</p>}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-foreground block">Min Balance</span>
                      ETB {product.min_balance.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium text-foreground block">Min Deposit</span>
                      ETB {product.min_deposit.toLocaleString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-foreground block">Interest Rate</span>
                      {product.interest_method === 'PROFIT_SHARING' ? 'Periodic profit distribution' : `${product.interest_rate}%`}
                    </div>
                    {product.default_commodity_type && (
                      <div>
                        <span className="font-medium text-foreground block">Commodity Type</span>
                        {product.default_commodity_type}
                      </div>
                    )}
                  </div>
                  {product.withdrawal_policy && (
                    <div>
                      <span className="font-medium text-foreground block">Withdrawal Policy</span>
                      <p>{product.withdrawal_policy}</p>
                    </div>
                  )}
                  {product.notes && (
                    <div className="flex items-center gap-2 text-foreground">
                      <ShieldCheck className="h-4 w-4" />
                      <span>{product.notes}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {products.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No account products configured yet. Click “New Product” to create one.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[calc(100vh-2rem)] overflow-hidden p-0 flex flex-col">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
            <DialogTitle>{dialogMode === "create" ? "Create Account Product" : "Update Account Product"}</DialogTitle>
            <DialogDescription>
              Define savings templates, withdrawal policies, and guardian/commodity requirements mandated by the directive.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 overflow-y-auto px-6 pb-4">
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-code">Product Code *</Label>
                <Input
                  id="product-code"
                  placeholder="e.g., SAV_CHILD_EDU"
                  value={form.product_code}
                  onChange={(e) => setForm({ ...form, product_code: e.target.value })}
                  disabled={dialogMode === "edit"}
                />
              </div>
              <div>
                <Label htmlFor="product-name">Product Name *</Label>
                <Input
                  id="product-name"
                  placeholder="e.g., Children's Education Savings"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>Product Kind</Label>
                <Select value={form.product_kind} onValueChange={(value) => handleProductKindChange(value as AccountProduct["product_kind"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select kind" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_KIND_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <div>
                  <Label className="text-sm">Guardian Required</Label>
                  <p className="text-xs text-muted-foreground">Enforce guardian info for minors</p>
                </div>
                <Switch checked={form.guardian_required} onCheckedChange={(checked) => setForm({ ...form, guardian_required: checked })} />
              </div>
              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <div>
                  <Label className="text-sm">In-Kind Deposits</Label>
                  <p className="text-xs text-muted-foreground">Allow commodity-based saving</p>
                </div>
                <Switch checked={form.commodity_required} onCheckedChange={(checked) => setForm({ ...form, commodity_required: checked })} />
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <div>
                  <Label className="text-sm">Target Savings</Label>
                  <p className="text-xs text-muted-foreground">Capture target amount/date</p>
                </div>
                <Switch checked={form.target_required} onCheckedChange={(checked) => setForm({ ...form, target_required: checked })} />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  placeholder="e.g., SAVINGS, SHARES"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div>
                <Label>Financial Category *</Label>
                <Select value={form.financial_category} onValueChange={(value) => setForm({ ...form, financial_category: value as ProductFormState['financial_category'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPULSORY_SAVINGS">Compulsory Savings</SelectItem>
                    <SelectItem value="VOLUNTARY_SAVINGS">Voluntary Savings</SelectItem>
                    <SelectItem value="SHARE_CAPITAL">Share Capital</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.is_active ? "true" : "false"} onValueChange={(value) => setForm({ ...form, is_active: value === "true" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.commodity_required && (
              <div>
                <Label>Default Commodity Type</Label>
                <Input
                  placeholder="e.g., Grain, Coffee"
                  value={form.default_commodity_type}
                  onChange={(e) => setForm({ ...form, default_commodity_type: e.target.value })}
                />
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Min Balance (ETB)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.min_balance}
                  onChange={(e) => setForm({ ...form, min_balance: e.target.value })}
                />
              </div>
              <div>
                <Label>Min Deposit (ETB)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.min_deposit}
                  onChange={(e) => setForm({ ...form, min_deposit: e.target.value })}
                />
              </div>
              <div>
                <Label>Interest Type *</Label>
                <Select value={form.interest_method} onValueChange={(value) => setForm((prev) => ({ ...prev, interest_method: value as ProductFormState['interest_method'], interest_rate: value === 'PROFIT_SHARING' ? '0' : prev.interest_rate }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Regular Interest</SelectItem>
                    <SelectItem value="PROFIT_SHARING">Dividend (Profit Share)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Interest Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.interest_rate}
                  onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
                  disabled={form.interest_method === 'PROFIT_SHARING'}
                />
                {form.interest_method === 'PROFIT_SHARING' && <p className="mt-1 text-xs text-muted-foreground">Monthly interest is skipped. Growth comes only from approved profit distributions.</p>}
              </div>
            </div>

            <div>
              <Label>Withdrawal Policy</Label>
              <Textarea
                placeholder="Outline notice period, allowed withdrawals, etc."
                value={form.withdrawal_policy}
                onChange={(e) => setForm({ ...form, withdrawal_policy: e.target.value })}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Explain the purpose of this savings product"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <Label>Internal Notes</Label>
              <Textarea
                placeholder="Operational notes, Sharia board references, etc."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          </div>

          <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {dialogMode === "create" ? (createMutation.isPending ? "Creating..." : "Create Product") : (updateMutation.isPending ? "Saving..." : "Save Changes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountProductManagement;
