import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModernHeader } from "@/components/shared/ModernHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Plus, Trash2, Edit, X, ShieldCheck } from "lucide-react";
import type { LoanProduct, User } from "@/types";

const EMPTY_FORM = {
  product_code: '',
  name: '',
  interest_rate: '',
  interest_type: 'DECLINING' as 'FLAT' | 'DECLINING',
  min_term_months: '',
  max_term_months: '',
  penalty_rate: '',
  category: '',
  loan_category: '' as '' | 'STANDARD' | 'VEHICLE' | 'HOUSING',
  min_savings_duration_months: '',
  loan_amount_min_etb: '',
  loan_amount_max_etb: '',
  required_pre_savings_pct: '',
  eligible_savings_types: '',
  requires_lump_sum_pre_savings: false,
};

type FormState = typeof EMPTY_FORM;

const LOAN_CATEGORY_LABELS: Record<string, string> = {
  STANDARD: 'Standard',
  VEHICLE: 'Vehicle',
  HOUSING: 'Housing',
};

const AdminConfig = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [productForm, setProductForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['loan-products'],
    queryFn: async () => {
      const res = await api.get<{ data: LoanProduct[] }>('/loan-products');
      return res.data.data || [];
    },
    enabled: !!user
  });

  const products = productsResponse || [];

  const updateMutation = useMutation({
    mutationFn: async ({ code, updates }: { code: string; updates: Partial<LoanProduct> }) => {
      return api.put(`/loan-products/${code}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-products'] });
      toast({ title: "Success", description: "Loan product updated successfully" });
      setEditingProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update loan product",
        variant: "destructive"
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (product: any) => {
      return api.post('/loan-products', product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-products'] });
      toast({ title: "Success", description: "Loan product created successfully" });
      setCreateDialogOpen(false);
      setProductForm(EMPTY_FORM);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create loan product",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (code: string) => {
      return api.delete(`/loan-products/${code}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-products'] });
      toast({ title: "Success", description: "Loan product deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete loan product",
        variant: "destructive"
      });
    }
  });

  const handleEdit = (product: LoanProduct) => {
    setEditingProduct(product.code);
    setEditForm({
      product_code: product.code,
      name: product.name,
      interest_rate: String(product.interest_rate),
      interest_type: product.interest_type,
      min_term_months: String(product.min_term_months),
      max_term_months: String(product.max_term_months),
      penalty_rate: String(product.penalty_rate),
      category: product.category || '',
      loan_category: (product.loan_category as any) || '',
      min_savings_duration_months: product.min_savings_duration_months != null ? String(product.min_savings_duration_months) : '',
      loan_amount_min_etb: product.loan_amount_min_etb != null ? String(product.loan_amount_min_etb) : '',
      loan_amount_max_etb: product.loan_amount_max_etb != null ? String(product.loan_amount_max_etb) : '',
      required_pre_savings_pct: product.required_pre_savings_pct != null ? String(product.required_pre_savings_pct) : '',
      eligible_savings_types: product.eligible_savings_types || '',
      requires_lump_sum_pre_savings: product.requires_lump_sum_pre_savings ?? false,
    });
  };

  const handleSave = () => {
    const updates: any = {
      name: editForm.name,
      interest_rate: parseFloat(editForm.interest_rate),
      interest_type: editForm.interest_type,
      min_term_months: parseInt(editForm.min_term_months),
      max_term_months: parseInt(editForm.max_term_months),
      penalty_rate: parseFloat(editForm.penalty_rate || '0'),
      category: editForm.category || null,
      loan_category: editForm.loan_category || null,
      min_savings_duration_months: editForm.min_savings_duration_months !== '' ? parseInt(editForm.min_savings_duration_months) : null,
      loan_amount_min_etb: editForm.loan_amount_min_etb !== '' ? parseFloat(editForm.loan_amount_min_etb) : null,
      loan_amount_max_etb: editForm.loan_amount_max_etb !== '' ? parseFloat(editForm.loan_amount_max_etb) : null,
      required_pre_savings_pct: editForm.required_pre_savings_pct !== '' ? parseFloat(editForm.required_pre_savings_pct) : null,
      eligible_savings_types: editForm.eligible_savings_types || null,
      requires_lump_sum_pre_savings: editForm.requires_lump_sum_pre_savings,
    };
    updateMutation.mutate({ code: editingProduct!, updates });
  };

  const handleDelete = (code: string) => {
    if (confirm(`Are you sure you want to delete this loan product? This action cannot be undone if it's not used in any loan applications.`)) {
      deleteMutation.mutate(code);
    }
  };

  const handleCreate = () => {
    const product = {
      product_code: productForm.product_code.toUpperCase(),
      name: productForm.name,
      interest_rate: parseFloat(productForm.interest_rate),
      interest_type: productForm.interest_type,
      min_term_months: parseInt(productForm.min_term_months),
      max_term_months: parseInt(productForm.max_term_months),
      penalty_rate: parseFloat(productForm.penalty_rate || '0'),
      category: productForm.category || null,
      loan_category: productForm.loan_category || null,
      min_savings_duration_months: productForm.min_savings_duration_months !== '' ? parseInt(productForm.min_savings_duration_months) : null,
      loan_amount_min_etb: productForm.loan_amount_min_etb !== '' ? parseFloat(productForm.loan_amount_min_etb) : null,
      loan_amount_max_etb: productForm.loan_amount_max_etb !== '' ? parseFloat(productForm.loan_amount_max_etb) : null,
      required_pre_savings_pct: productForm.required_pre_savings_pct !== '' ? parseFloat(productForm.required_pre_savings_pct) : null,
      eligible_savings_types: productForm.eligible_savings_types || null,
      requires_lump_sum_pre_savings: productForm.requires_lump_sum_pre_savings,
    };
    createMutation.mutate(product);
  };

  const setEdit = (key: keyof FormState, value: any) => setEditForm(f => ({ ...f, [key]: value }));
  const setCreate = (key: keyof FormState, value: any) => setProductForm(f => ({ ...f, [key]: value }));

  const hasTierConfig = (p: LoanProduct) =>
    p.loan_category || p.min_savings_duration_months != null || p.loan_amount_max_etb != null || p.eligible_savings_types;

  if (!user) return null;

  const TierFields = ({
    form,
    set,
    disabled,
  }: {
    form: FormState;
    set: (k: keyof FormState, v: any) => void;
    disabled: boolean;
  }) => (
    <div className="col-span-full border rounded-lg p-4 space-y-4 bg-muted/40">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <ShieldCheck className="h-4 w-4" />
        Tier / Policy Requirements
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>Loan Category</Label>
          <Select
            value={form.loan_category || 'NONE'}
            onValueChange={(v) => set('loan_category', v === 'NONE' ? '' : v)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">None</SelectItem>
              <SelectItem value="STANDARD">Standard</SelectItem>
              <SelectItem value="VEHICLE">Vehicle</SelectItem>
              <SelectItem value="HOUSING">Housing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Min Savings Duration (Months)</Label>
          <Input
            type="number"
            placeholder="e.g. 3"
            value={form.min_savings_duration_months}
            onChange={(e) => set('min_savings_duration_months', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <Label>Loan Amount Min (ETB)</Label>
          <Input
            type="number"
            placeholder="e.g. 0"
            value={form.loan_amount_min_etb}
            onChange={(e) => set('loan_amount_min_etb', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <Label>Loan Amount Max / Ceiling (ETB)</Label>
          <Input
            type="number"
            placeholder="e.g. 100000"
            value={form.loan_amount_max_etb}
            onChange={(e) => set('loan_amount_max_etb', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <Label>Required Pre-Savings (%)</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="e.g. 10"
            value={form.required_pre_savings_pct}
            onChange={(e) => set('required_pre_savings_pct', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <Label>Eligible Savings Types</Label>
          <Input
            placeholder="e.g. SAV_COMPULSORY,SAV_VOLUNTARY"
            value={form.eligible_savings_types}
            onChange={(e) => set('eligible_savings_types', e.target.value)}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Comma-separated. Leave empty to count all SAV accounts.
          </p>
        </div>
        <div className="flex items-center gap-3 pt-5">
          <Switch
            checked={form.requires_lump_sum_pre_savings}
            onCheckedChange={(v) => set('requires_lump_sum_pre_savings', v)}
            disabled={disabled}
          />
          <Label>Lump-Sum Pre-Savings Required</Label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Loan Product Configuration"
        subtitle="Manage loan products and interest rates"
        onBack={() => navigate("/dashboard")}
        actions={
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Loan Product
          </Button>
        }
      />

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-8">Loading loan products...</div>
        ) : (
          <div className="grid gap-6">
            {products.map((product) => {
              const isEditing = editingProduct === product.code;
              const form = isEditing ? editForm : null;
              return (
                <Card key={product.code}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <CardTitle>{product.name}</CardTitle>
                          <CardDescription>Code: {product.code}</CardDescription>
                        </div>
                        {product.loan_category && (
                          <Badge variant="secondary">{LOAN_CATEGORY_LABELS[product.loan_category] ?? product.loan_category}</Badge>
                        )}
                      </div>
                      {!isEditing && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.code)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <Label>Product Name</Label>
                        <Input
                          value={isEditing ? editForm.name : product.name}
                          onChange={(e) => setEdit('name', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>Interest Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={isEditing ? editForm.interest_rate : product.interest_rate}
                          onChange={(e) => setEdit('interest_rate', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>Interest Type</Label>
                        <Select
                          value={isEditing ? editForm.interest_type : product.interest_type}
                          onValueChange={(v) => setEdit('interest_type', v)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FLAT">Flat</SelectItem>
                            <SelectItem value="DECLINING">Declining Balance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Min Term (Months)</Label>
                        <Input
                          type="number"
                          value={isEditing ? editForm.min_term_months : product.min_term_months}
                          onChange={(e) => setEdit('min_term_months', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>Max Term (Months)</Label>
                        <Input
                          type="number"
                          value={isEditing ? editForm.max_term_months : product.max_term_months}
                          onChange={(e) => setEdit('max_term_months', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>Penalty Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={isEditing ? editForm.penalty_rate : product.penalty_rate}
                          onChange={(e) => setEdit('penalty_rate', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Input
                          placeholder="e.g., Service, Asset, Business"
                          value={isEditing ? editForm.category : (product.category || '')}
                          onChange={(e) => setEdit('category', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>

                      {/* Tier fields: always show in edit mode; show read-only when tier config exists */}
                      {(isEditing || hasTierConfig(product)) && (
                        <TierFields
                          form={isEditing ? editForm : {
                            ...EMPTY_FORM,
                            loan_category: (product.loan_category as any) || '',
                            min_savings_duration_months: product.min_savings_duration_months != null ? String(product.min_savings_duration_months) : '',
                            loan_amount_min_etb: product.loan_amount_min_etb != null ? String(product.loan_amount_min_etb) : '',
                            loan_amount_max_etb: product.loan_amount_max_etb != null ? String(product.loan_amount_max_etb) : '',
                            required_pre_savings_pct: product.required_pre_savings_pct != null ? String(product.required_pre_savings_pct) : '',
                            eligible_savings_types: product.eligible_savings_types || '',
                            requires_lump_sum_pre_savings: product.requires_lump_sum_pre_savings ?? false,
                          }}
                          set={setEdit}
                          disabled={!isEditing}
                        />
                      )}
                    </div>

                    {isEditing && (
                      <div className="flex gap-2 mt-4">
                        <Button onClick={handleSave} size="sm" disabled={updateMutation.isPending}>
                          <Save className="h-4 w-4 mr-2" />
                          {updateMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                        <Button variant="outline" onClick={() => setEditingProduct(null)} size="sm">
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {products.length === 0 && !isLoading && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No loan products found. Click "Add Loan Product" to create one.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Create Product Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Loan Product</DialogTitle>
              <DialogDescription>Add a new loan product to the system</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-code">Product Code *</Label>
                  <Input
                    id="create-code"
                    placeholder="e.g., L-EDU"
                    value={productForm.product_code}
                    onChange={(e) => setCreate('product_code', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="create-name">Product Name *</Label>
                  <Input
                    id="create-name"
                    placeholder="e.g., Education Loan"
                    value={productForm.name}
                    onChange={(e) => setCreate('name', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Interest Rate (%) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="12.5"
                    value={productForm.interest_rate}
                    onChange={(e) => setCreate('interest_rate', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Interest Type *</Label>
                  <Select
                    value={productForm.interest_type}
                    onValueChange={(v) => setCreate('interest_type', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FLAT">Flat</SelectItem>
                      <SelectItem value="DECLINING">Declining Balance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Min Term (Months) *</Label>
                  <Input
                    type="number"
                    placeholder="6"
                    value={productForm.min_term_months}
                    onChange={(e) => setCreate('min_term_months', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Term (Months) *</Label>
                  <Input
                    type="number"
                    placeholder="24"
                    value={productForm.max_term_months}
                    onChange={(e) => setCreate('max_term_months', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Penalty Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="2.0"
                    value={productForm.penalty_rate}
                    onChange={(e) => setCreate('penalty_rate', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  placeholder="e.g., Service, Asset, Business, Special"
                  value={productForm.category}
                  onChange={(e) => setCreate('category', e.target.value)}
                />
              </div>

              <TierFields form={productForm} set={setCreate} disabled={false} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || !productForm.product_code || !productForm.name}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Product'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminConfig;
