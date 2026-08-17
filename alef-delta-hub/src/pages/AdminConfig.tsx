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
import type { AccountProduct, LoanProduct, User } from "@/types";

type TierForm = {
  client_id: string;
  tier_id?: string;
  tier_code: string;
  name: string;
  min_savings_duration_months: string;
  loan_amount_min_etb: string;
  loan_amount_max_etb: string;
  max_term_months: string;
  interest_rate: string;
  required_pre_savings_pct: string;
  required_share_purchase_pct: string;
  eligible_savings_products: string[];
};

const EMPTY_TIER: TierForm = {
  client_id: 'new-tier-1',
  tier_code: 'DEFAULT', name: 'Default Tier', min_savings_duration_months: '0',
  loan_amount_min_etb: '0', loan_amount_max_etb: '', max_term_months: '24',
  interest_rate: '0', required_pre_savings_pct: '0', required_share_purchase_pct: '0',
  eligible_savings_products: ['SAV_COMPULSORY']
};

const EMPTY_FORM = {
  product_code: '',
  name: '',
  interest_rate: '',
  interest_type: 'DECLINING' as 'FLAT' | 'DECLINING',
  min_term_months: '',
  max_term_months: '',
  penalty_rate: '',
  penalty_mode: 'PERCENT' as 'PERCENT' | 'FIXED', penalty_fixed_amount: '', penalty_grace_days: '0', penalty_escalation_enabled: false, penalty_escalation_value: '',
  service_charge_mode: 'PERCENT' as 'PERCENT' | 'FIXED', service_charge_rate: '', service_charge_fixed_amount: '',
  category: '',
  loan_category: '' as '' | 'STANDARD' | 'VEHICLE' | 'HOUSING',
  min_savings_duration_months: '',
  loan_amount_min_etb: '',
  loan_amount_max_etb: '',
  required_pre_savings_pct: '',
  eligible_savings_types: '',
  requires_lump_sum_pre_savings: false,
  tiers: [{ ...EMPTY_TIER }] as TierForm[],
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
  const { data: accountProductsResponse } = useQuery({
    queryKey: ['account-products'],
    queryFn: async () => (await api.get<{ data: AccountProduct[] }>('/account-products')).data.data || [],
    enabled: !!user
  });
  const compulsoryProducts = (accountProductsResponse || []).filter(
    (product) => product.is_active && product.financial_category === 'COMPULSORY_SAVINGS'
  );

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
      penalty_mode: (product.penalty_mode as any) || 'PERCENT', penalty_fixed_amount: String(product.penalty_fixed_amount || ''), penalty_grace_days: String(product.penalty_grace_days || 0), penalty_escalation_enabled: product.penalty_escalation_enabled || false, penalty_escalation_value: String(product.penalty_escalation_value || ''),
      service_charge_mode: (product.service_charge_mode as any) || 'PERCENT', service_charge_rate: String(product.service_charge_rate || ''), service_charge_fixed_amount: String(product.service_charge_fixed_amount || ''),
      category: product.category || '',
      loan_category: (product.loan_category as any) || '',
      min_savings_duration_months: product.min_savings_duration_months != null ? String(product.min_savings_duration_months) : '',
      loan_amount_min_etb: product.loan_amount_min_etb != null ? String(product.loan_amount_min_etb) : '',
      loan_amount_max_etb: product.loan_amount_max_etb != null ? String(product.loan_amount_max_etb) : '',
      required_pre_savings_pct: product.required_pre_savings_pct != null ? String(product.required_pre_savings_pct) : '',
      eligible_savings_types: product.eligible_savings_types || '',
      requires_lump_sum_pre_savings: product.requires_lump_sum_pre_savings ?? false,
      tiers: (product.tiers || []).map((tier) => ({
        client_id: tier.tier_id,
        tier_id: tier.tier_id,
        tier_code: tier.tier_code,
        name: tier.name,
        min_savings_duration_months: String(tier.min_savings_duration_months),
        loan_amount_min_etb: String(tier.loan_amount_min_etb),
        loan_amount_max_etb: tier.loan_amount_max_etb == null ? '' : String(tier.loan_amount_max_etb),
        max_term_months: String(tier.max_term_months),
        interest_rate: String(tier.interest_rate),
        required_pre_savings_pct: String(tier.required_pre_savings_pct),
        required_share_purchase_pct: String(tier.required_share_purchase_pct),
        eligible_savings_products: tier.eligible_savings_products
      }))
    });
  };

  const tierPayload = (tiers: TierForm[]) => tiers.map((tier, index) => ({
    ...(tier.tier_id ? { tier_id: tier.tier_id } : {}),
    tier_code: tier.tier_code.toUpperCase(),
    name: tier.name,
    display_order: index + 1,
    min_savings_duration_months: Number(tier.min_savings_duration_months),
    loan_amount_min_etb: Number(tier.loan_amount_min_etb),
    loan_amount_max_etb: tier.loan_amount_max_etb === '' ? null : Number(tier.loan_amount_max_etb),
    max_term_months: Number(tier.max_term_months),
    interest_rate: Number(tier.interest_rate),
    required_pre_savings_pct: Number(tier.required_pre_savings_pct),
    required_share_purchase_pct: Number(tier.required_share_purchase_pct),
    eligible_savings_products: tier.eligible_savings_products
  }));

  const handleSave = () => {
    const updates: any = {
      name: editForm.name,
      interest_rate: parseFloat(editForm.interest_rate),
      interest_type: editForm.interest_type,
      min_term_months: parseInt(editForm.min_term_months),
      max_term_months: parseInt(editForm.max_term_months),
      penalty_rate: parseFloat(editForm.penalty_rate || '0'),
      penalty_mode: editForm.penalty_mode, penalty_fixed_amount: parseFloat(editForm.penalty_fixed_amount || '0'), penalty_grace_days: parseInt(editForm.penalty_grace_days || '0'), penalty_escalation_enabled: editForm.penalty_escalation_enabled, penalty_escalation_value: parseFloat(editForm.penalty_escalation_value || '0'),
      service_charge_mode: editForm.service_charge_mode, service_charge_rate: parseFloat(editForm.service_charge_rate || '0'), service_charge_fixed_amount: parseFloat(editForm.service_charge_fixed_amount || '0'),
      category: editForm.category || null,
      loan_category: editForm.loan_category || null,
      min_savings_duration_months: editForm.min_savings_duration_months !== '' ? parseInt(editForm.min_savings_duration_months) : null,
      loan_amount_min_etb: editForm.loan_amount_min_etb !== '' ? parseFloat(editForm.loan_amount_min_etb) : null,
      loan_amount_max_etb: editForm.loan_amount_max_etb !== '' ? parseFloat(editForm.loan_amount_max_etb) : null,
      required_pre_savings_pct: editForm.required_pre_savings_pct !== '' ? parseFloat(editForm.required_pre_savings_pct) : null,
      eligible_savings_types: editForm.eligible_savings_types || null,
      requires_lump_sum_pre_savings: editForm.requires_lump_sum_pre_savings,
      tiers: tierPayload(editForm.tiers),
    };
    updateMutation.mutate({ code: editingProduct!, updates });
  };

  const handleDelete = (code: string) => {
    if (confirm('Deactivate this loan product? Existing loan history will be preserved.')) {
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
      penalty_mode: productForm.penalty_mode, penalty_fixed_amount: parseFloat(productForm.penalty_fixed_amount || '0'), penalty_grace_days: parseInt(productForm.penalty_grace_days || '0'), penalty_escalation_enabled: productForm.penalty_escalation_enabled, penalty_escalation_value: parseFloat(productForm.penalty_escalation_value || '0'),
      service_charge_mode: productForm.service_charge_mode, service_charge_rate: parseFloat(productForm.service_charge_rate || '0'), service_charge_fixed_amount: parseFloat(productForm.service_charge_fixed_amount || '0'),
      category: productForm.category || null,
      loan_category: productForm.loan_category || null,
      min_savings_duration_months: productForm.min_savings_duration_months !== '' ? parseInt(productForm.min_savings_duration_months) : null,
      loan_amount_min_etb: productForm.loan_amount_min_etb !== '' ? parseFloat(productForm.loan_amount_min_etb) : null,
      loan_amount_max_etb: productForm.loan_amount_max_etb !== '' ? parseFloat(productForm.loan_amount_max_etb) : null,
      required_pre_savings_pct: productForm.required_pre_savings_pct !== '' ? parseFloat(productForm.required_pre_savings_pct) : null,
      eligible_savings_types: productForm.eligible_savings_types || null,
      requires_lump_sum_pre_savings: productForm.requires_lump_sum_pre_savings,
      tiers: tierPayload(productForm.tiers),
    };
    createMutation.mutate(product);
  };

  const setEdit = (key: keyof FormState, value: any) => setEditForm(f => ({ ...f, [key]: value }));
  const setCreate = (key: keyof FormState, value: any) => setProductForm(f => ({ ...f, [key]: value }));

  const hasTierConfig = (p: LoanProduct) => Boolean(p.tiers?.length);

  if (!user) return null;

  const renderTierFields = ({
    form,
    set,
    disabled,
  }: {
    form: FormState;
    set: (k: keyof FormState, v: any) => void;
    disabled: boolean;
  }) => (
    <div className="col-span-full border rounded-lg p-4 space-y-4 bg-muted/40">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <ShieldCheck className="h-4 w-4" /> Dynamic Tier / Policy Requirements
        </div>
        {!disabled && <Button type="button" size="sm" variant="outline" onClick={() => set('tiers', [...form.tiers, { ...EMPTY_TIER, client_id: `new-tier-${Date.now()}`, tier_code: `TIER-${form.tiers.length + 1}`, name: `Tier ${form.tiers.length + 1}` }])}><Plus className="h-4 w-4 mr-1" />Add Tier</Button>}
      </div>
      <div className="max-w-sm">
        <Label>Loan Category</Label>
        <Select value={form.loan_category || 'NONE'} onValueChange={(v) => set('loan_category', v === 'NONE' ? '' : v)} disabled={disabled}>
          <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent><SelectItem value="NONE">None</SelectItem><SelectItem value="STANDARD">Standard</SelectItem><SelectItem value="VEHICLE">Vehicle</SelectItem><SelectItem value="HOUSING">Housing</SelectItem></SelectContent>
        </Select>
      </div>
      <div className="space-y-4">
        {form.tiers.map((tier, index) => {
          const updateTier = (key: keyof TierForm, value: any) => set('tiers', form.tiers.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
          return <div key={tier.tier_id || tier.client_id} className="rounded-lg border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between"><p className="font-medium">Tier {index + 1}: {tier.name || tier.tier_code}</p>{!disabled && form.tiers.length > 1 && <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => set('tiers', form.tiers.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button>}</div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div><Label>Tier Code *</Label><Input value={tier.tier_code} disabled={disabled} onChange={(e) => updateTier('tier_code', e.target.value.toUpperCase())} /></div>
              <div><Label>Tier Name *</Label><Input value={tier.name} disabled={disabled} onChange={(e) => updateTier('name', e.target.value)} /></div>
              <div><Label>Min Savings Duration *</Label><Input type="number" min="0" value={tier.min_savings_duration_months} disabled={disabled} onChange={(e) => updateTier('min_savings_duration_months', e.target.value)} /></div>
              <div><Label>Maximum Term (Months) *</Label><Input type="number" min="1" value={tier.max_term_months} disabled={disabled} onChange={(e) => updateTier('max_term_months', e.target.value)} /></div>
              <div><Label>Loan Amount Min (ETB) *</Label><Input type="number" min="0" value={tier.loan_amount_min_etb} disabled={disabled} onChange={(e) => updateTier('loan_amount_min_etb', e.target.value)} /></div>
              <div><Label>Loan Amount Max (ETB)</Label><Input type="number" min="0" placeholder="No ceiling" value={tier.loan_amount_max_etb} disabled={disabled} onChange={(e) => updateTier('loan_amount_max_etb', e.target.value)} /></div>
              <div><Label>Interest Rate (%) *</Label><Input type="number" min="0" max="100" step="0.01" value={tier.interest_rate} disabled={disabled} onChange={(e) => updateTier('interest_rate', e.target.value)} /></div>
              <div><Label>Required Pre-Savings (%) *</Label><Input type="number" min="0" max="100" step="0.01" value={tier.required_pre_savings_pct} disabled={disabled} onChange={(e) => updateTier('required_pre_savings_pct', e.target.value)} /></div>
              <div><Label>Required Share Purchase (%) *</Label><Input type="number" min="0" max="100" step="0.01" value={tier.required_share_purchase_pct} disabled={disabled} onChange={(e) => updateTier('required_share_purchase_pct', e.target.value)} /></div>
            </div>
            <div><Label>Eligible Compulsory Savings Products *</Label><div className="mt-2 flex flex-wrap gap-3">{compulsoryProducts.map((accountProduct) => <label key={accountProduct.product_code} className="flex items-center gap-2 rounded border px-3 py-2 text-sm"><input type="checkbox" disabled={disabled} checked={tier.eligible_savings_products.includes(accountProduct.product_code)} onChange={(e) => updateTier('eligible_savings_products', e.target.checked ? [...tier.eligible_savings_products, accountProduct.product_code] : tier.eligible_savings_products.filter((code) => code !== accountProduct.product_code))} />{accountProduct.name} ({accountProduct.product_code})</label>)}</div>{compulsoryProducts.length === 0 && <p className="text-sm text-destructive mt-1">Configure at least one active Compulsory Savings account product first.</p>}</div>
          </div>;
        })}
      </div>
      <p className="text-xs text-muted-foreground">Only explicitly selected compulsory savings accounts count. Voluntary savings and Share Capital never count toward the pre-savings requirement.</p>
      {/* Legacy fields remain in the database for historical compatibility and are intentionally not editable here. */}
      <div className="hidden">
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
                      {isEditing && <>
                        <div><Label>Penalty Type</Label><Select value={editForm.penalty_mode} onValueChange={(v: any) => setEdit('penalty_mode', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PERCENT">Percentage of installment</SelectItem><SelectItem value="FIXED">Fixed ETB amount</SelectItem></SelectContent></Select></div>
                        <div><Label>Grace Period (days)</Label><Input type="number" min="0" value={editForm.penalty_grace_days} onChange={(e) => setEdit('penalty_grace_days', e.target.value)} /></div>
                        {editForm.penalty_mode === 'FIXED' && <div><Label>Fixed Penalty (ETB)</Label><Input type="number" min="0" value={editForm.penalty_fixed_amount} onChange={(e) => setEdit('penalty_fixed_amount', e.target.value)} /></div>}
                        <div className="flex items-center gap-2"><Switch checked={editForm.penalty_escalation_enabled} onCheckedChange={(v) => setEdit('penalty_escalation_enabled', v)} /><Label>Escalate each overdue period</Label></div>
                        {editForm.penalty_escalation_enabled && <div><Label>Extra rate / amount each period</Label><Input type="number" min="0" value={editForm.penalty_escalation_value} onChange={(e) => setEdit('penalty_escalation_value', e.target.value)} /></div>}
                      </>}
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
                        renderTierFields({
                          form: isEditing ? editForm : {
                            ...EMPTY_FORM,
                            loan_category: (product.loan_category as any) || '',
                            min_savings_duration_months: product.min_savings_duration_months != null ? String(product.min_savings_duration_months) : '',
                            loan_amount_min_etb: product.loan_amount_min_etb != null ? String(product.loan_amount_min_etb) : '',
                            loan_amount_max_etb: product.loan_amount_max_etb != null ? String(product.loan_amount_max_etb) : '',
                            required_pre_savings_pct: product.required_pre_savings_pct != null ? String(product.required_pre_savings_pct) : '',
                            eligible_savings_types: product.eligible_savings_types || '',
                            requires_lump_sum_pre_savings: product.requires_lump_sum_pre_savings ?? false,
                            tiers: (product.tiers || []).map((tier) => ({
                              client_id: tier.tier_id,
                              tier_id: tier.tier_id, tier_code: tier.tier_code, name: tier.name,
                              min_savings_duration_months: String(tier.min_savings_duration_months),
                              loan_amount_min_etb: String(tier.loan_amount_min_etb),
                              loan_amount_max_etb: tier.loan_amount_max_etb == null ? '' : String(tier.loan_amount_max_etb),
                              max_term_months: String(tier.max_term_months), interest_rate: String(tier.interest_rate),
                              required_pre_savings_pct: String(tier.required_pre_savings_pct),
                              required_share_purchase_pct: String(tier.required_share_purchase_pct),
                              eligible_savings_products: tier.eligible_savings_products
                            })),
                          },
                          set: setEdit,
                          disabled: !isEditing
                        })
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
              </div>
              <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
                <div className="md:col-span-2"><p className="font-medium">Penalty Policy</p><p className="text-xs text-muted-foreground">Applied only after the grace period. Escalation adds the configured rate or fixed amount for every additional overdue period.</p></div>
                <div><Label>Penalty Type</Label><Select value={productForm.penalty_mode} onValueChange={(v: any) => setCreate('penalty_mode', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PERCENT">Percentage of installment</SelectItem><SelectItem value="FIXED">Fixed ETB amount</SelectItem></SelectContent></Select></div>
                <div><Label>Grace Period (days)</Label><Input type="number" min="0" value={productForm.penalty_grace_days} onChange={(e) => setCreate('penalty_grace_days', e.target.value)} /></div>
                {productForm.penalty_mode === 'PERCENT' ? <div><Label>Penalty Rate (%)</Label><Input type="number" step="0.01" min="0" value={productForm.penalty_rate} onChange={(e) => setCreate('penalty_rate', e.target.value)} /></div> : <div><Label>Fixed Penalty (ETB)</Label><Input type="number" step="0.01" min="0" value={productForm.penalty_fixed_amount} onChange={(e) => setCreate('penalty_fixed_amount', e.target.value)} /></div>}
                <div className="flex items-center gap-2 pt-6"><Switch checked={productForm.penalty_escalation_enabled} onCheckedChange={(v) => setCreate('penalty_escalation_enabled', v)} /><Label>Escalate each overdue period</Label></div>
                {productForm.penalty_escalation_enabled && <div><Label>Extra rate / amount each period</Label><Input type="number" step="0.01" min="0" value={productForm.penalty_escalation_value} onChange={(e) => setCreate('penalty_escalation_value', e.target.value)} /></div>}
              </div>
              <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
                <div className="md:col-span-2"><p className="font-medium">Loan Service Charge</p><p className="text-xs text-muted-foreground">Recorded separately from interest and penalties on each new loan.</p></div>
                <div><Label>Charge Type</Label><Select value={productForm.service_charge_mode} onValueChange={(v: any) => setCreate('service_charge_mode', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PERCENT">Percentage of loan amount</SelectItem><SelectItem value="FIXED">Fixed ETB amount</SelectItem></SelectContent></Select></div>
                {productForm.service_charge_mode === 'PERCENT' ? <div><Label>Service Charge Rate (%)</Label><Input type="number" step="0.01" min="0" value={productForm.service_charge_rate} onChange={(e) => setCreate('service_charge_rate', e.target.value)} /></div> : <div><Label>Fixed Service Charge (ETB)</Label><Input type="number" step="0.01" min="0" value={productForm.service_charge_fixed_amount} onChange={(e) => setCreate('service_charge_fixed_amount', e.target.value)} /></div>}
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  placeholder="e.g., Service, Asset, Business, Special"
                  value={productForm.category}
                  onChange={(e) => setCreate('category', e.target.value)}
                />
              </div>

              {renderTierFields({ form: productForm, set: setCreate, disabled: false })}
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
