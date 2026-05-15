import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModernHeader } from "@/components/shared/ModernHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Plus, Trash2, Edit, X } from "lucide-react";
import type { LoanProduct, User } from "@/types";

const AdminConfig = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    product_code: '',
    name: '',
    interest_rate: '',
    interest_type: 'FLAT' as 'FLAT' | 'DECLINING',
    min_term_months: '',
    max_term_months: '',
    penalty_rate: ''
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  // Fetch loan products from API
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
      setProductForm({
        product_code: '',
        name: '',
        interest_rate: '',
        interest_type: 'FLAT',
        min_term_months: '',
        max_term_months: '',
        penalty_rate: '',
        category: ''
      });
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
  };

  const handleSave = (product: LoanProduct) => {
    const formData = {
      name: (document.getElementById(`name-${product.code}`) as HTMLInputElement)?.value || product.name,
      interest_rate: parseFloat((document.getElementById(`rate-${product.code}`) as HTMLInputElement)?.value || '0'),
      interest_type: (document.getElementById(`type-${product.code}`) as HTMLSelectElement)?.value || product.interest_type,
      min_term_months: parseInt((document.getElementById(`min-term-${product.code}`) as HTMLInputElement)?.value || '0'),
      max_term_months: parseInt((document.getElementById(`max-term-${product.code}`) as HTMLInputElement)?.value || '0'),
      penalty_rate: parseFloat((document.getElementById(`penalty-${product.code}`) as HTMLInputElement)?.value || '0'),
      category: (document.getElementById(`category-${product.code}`) as HTMLInputElement)?.value || product.category || null
    };

    updateMutation.mutate({ code: product.code, updates: formData });
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
      category: productForm.category || null
    };

    createMutation.mutate(product);
  };

  if (!user) return null;

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
          {products.map((product) => (
            <Card key={product.code}>
              <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                <CardTitle>{product.name}</CardTitle>
                      <CardDescription>Code: {product.code}</CardDescription>
                    </div>
                    {editingProduct !== product.code && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.code)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
              </CardHeader>
              <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <Label htmlFor={`name-${product.code}`}>Product Name</Label>
                      <Input
                        id={`name-${product.code}`}
                        defaultValue={product.name}
                        disabled={editingProduct !== product.code}
                      />
                    </div>
                  <div>
                    <Label htmlFor={`rate-${product.code}`}>Interest Rate (%)</Label>
                    <Input
                      id={`rate-${product.code}`}
                      type="number"
                      step="0.1"
                      defaultValue={product.interest_rate}
                      disabled={editingProduct !== product.code}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`type-${product.code}`}>Interest Type</Label>
                      <Select 
                        defaultValue={product.interest_type} 
                        disabled={editingProduct !== product.code}
                      >
                      <SelectTrigger id={`type-${product.code}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FLAT">Flat</SelectItem>
                        <SelectItem value="DECLINING">Declining Balance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                    <div>
                      <Label htmlFor={`min-term-${product.code}`}>Min Term (Months)</Label>
                      <Input
                        id={`min-term-${product.code}`}
                        type="number"
                        defaultValue={product.min_term_months}
                        disabled={editingProduct !== product.code}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`max-term-${product.code}`}>Max Term (Months)</Label>
                      <Input
                        id={`max-term-${product.code}`}
                        type="number"
                        defaultValue={product.max_term_months}
                        disabled={editingProduct !== product.code}
                      />
                    </div>
                  <div>
                    <Label htmlFor={`penalty-${product.code}`}>Penalty Rate (%)</Label>
                    <Input
                      id={`penalty-${product.code}`}
                      type="number"
                      step="0.1"
                      defaultValue={product.penalty_rate}
                      disabled={editingProduct !== product.code}
                    />
                  </div>
                    <div>
                      <Label htmlFor={`category-${product.code}`}>Category</Label>
                      <Input
                        id={`category-${product.code}`}
                        placeholder="e.g., Service, Asset, Business"
                        defaultValue={product.category || ''}
                        disabled={editingProduct !== product.code}
                      />
                    </div>
                  </div>
                  {editingProduct === product.code && (
                    <div className="flex gap-2 mt-4">
                      <Button onClick={() => handleSave(product)} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setEditingProduct(null)} 
                        size="sm"
                      >
                          Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
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
          <DialogContent className="max-w-2xl">
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
                    onChange={(e) => setProductForm({ ...productForm, product_code: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="create-name">Product Name *</Label>
                  <Input
                    id="create-name"
                    placeholder="e.g., Education Loan"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-rate">Interest Rate (%) *</Label>
                  <Input
                    id="create-rate"
                    type="number"
                    step="0.1"
                    placeholder="12.5"
                    value={productForm.interest_rate}
                    onChange={(e) => setProductForm({ ...productForm, interest_rate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="create-type">Interest Type *</Label>
                  <Select
                    value={productForm.interest_type}
                    onValueChange={(value) => setProductForm({ ...productForm, interest_type: value as 'FLAT' | 'DECLINING' })}
                  >
                    <SelectTrigger id="create-type">
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
                  <Label htmlFor="create-min-term">Min Term (Months) *</Label>
                  <Input
                    id="create-min-term"
                    type="number"
                    placeholder="6"
                    value={productForm.min_term_months}
                    onChange={(e) => setProductForm({ ...productForm, min_term_months: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="create-max-term">Max Term (Months) *</Label>
                  <Input
                    id="create-max-term"
                    type="number"
                    placeholder="24"
                    value={productForm.max_term_months}
                    onChange={(e) => setProductForm({ ...productForm, max_term_months: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="create-penalty">Penalty Rate (%)</Label>
                  <Input
                    id="create-penalty"
                    type="number"
                    step="0.1"
                    placeholder="2.0"
                    value={productForm.penalty_rate}
                    onChange={(e) => setProductForm({ ...productForm, penalty_rate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="create-category">Category</Label>
                <Input
                  id="create-category"
                  placeholder="e.g., Service, Asset, Business, Special"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                />
              </div>
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
