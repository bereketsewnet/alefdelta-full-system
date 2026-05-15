import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Member } from "@/types";
import { api } from "@/lib/api";
import type { LoanProduct } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { calculateFlatInterest, calculateDecliningInterest } from "@/lib/utils/financial";
import { useDebounce } from "@/hooks/use-debounce";

const loanSchema = z.object({
  member_id: z.string().min(1, "Please select a member"),
  product_code: z.string().min(1, "Please select a loan product"),
  applied_amount: z.string().min(1, "Loan amount is required"),
  term_months: z.string().min(1, "Term is required"),
  purpose_description: z.string().min(10, "Purpose must be at least 10 characters"),
  repayment_frequency: z.enum(["MONTHLY", "QUARTERLY"]),
});

type LoanFormData = z.infer<typeof loanSchema>;

const NewLoanApplication = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Search Members (only when searching, max 10 results)
  const { data: membersData } = useQuery({
    queryKey: ['members-search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return [];
      const res = await api.get<{ data: Member[] }>(`/members?search=${debouncedSearch}&status=ACTIVE&limit=10`);
      return res.data.data;
    },
    enabled: !!debouncedSearch && !selectedMember && !!user
  });

  // Fetch loan products from API
  const { data: loanProductsData } = useQuery({
    queryKey: ['loan-products'],
    queryFn: async () => {
      const res = await api.get<{ data: LoanProduct[] }>('/loan-products');
      return res.data.data || [];
    },
    enabled: !!user
  });

  const loanProducts = loanProductsData || [];

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      member_id: "",
      product_code: "",
      applied_amount: "",
      term_months: "",
      purpose_description: "",
      repayment_frequency: "MONTHLY",
    },
  });

  const watchedProductCode = form.watch("product_code");
  const watchedAmount = form.watch("applied_amount");
  const watchedTerm = form.watch("term_months");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      if (!["CREDIT_OFFICER", "MANAGER", "ADMIN"].includes(userData.role)) {
        navigate("/dashboard");
      }
    }
  }, [navigate]);

  useEffect(() => {
    const product = loanProducts.find((p) => p.code === watchedProductCode);
    setSelectedProduct(product || null);
  }, [watchedProductCode, loanProducts]);

  if (!user) return null;

  const amount = parseFloat(watchedAmount) || 0;
  const term = parseInt(watchedTerm) || 0;
  const interestRate = selectedProduct?.interest_rate || 0;

  const flatCalc = amount > 0 && term > 0 ? calculateFlatInterest(amount, interestRate, term) : null;
  const decliningCalc = amount > 0 && term > 0 ? calculateDecliningInterest(amount, interestRate, term) : null;

  const onSubmit = async (data: LoanFormData) => {
    try {
      await api.post('/loans', {
        ...data,
        applied_amount: Number(data.applied_amount),
        term_months: Number(data.term_months),
      });
    
      const member = membersData?.find((m) => m.member_id === data.member_id);
    
      // Invalidate loans query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    
      toast({
        title: "Loan Application Submitted",
        description: `Application for ${member?.first_name} ${member?.last_name} has been created.`,
      });

      navigate("/loans");
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.response?.data?.message || "Failed to create loan application.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/loans")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">New Loan Application</h1>
              <p className="text-sm text-muted-foreground">Create a new loan application</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
                <CardDescription>
                  Enter loan application information. All fields are required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="member_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Member *</FormLabel>
                          {!selectedMember ? (
                            <div className="space-y-2">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search by name, member no, or phone..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="pl-10"
                                  autoFocus
                                />
                              </div>
                              {debouncedSearch && debouncedSearch.length > 0 && !membersData && (
                                <p className="text-sm text-muted-foreground">Searching...</p>
                              )}
                              {debouncedSearch && membersData && membersData.length === 0 && (
                                <p className="text-sm text-muted-foreground">No members found. Try a different search term.</p>
                              )}
                              {membersData && membersData.length > 0 && (
                                <div className="border rounded-md shadow-md bg-popover max-h-60 overflow-y-auto">
                                  {membersData.map(member => (
                                    <div
                                      key={member.member_id}
                                      className="p-3 hover:bg-accent cursor-pointer border-b last:border-0"
                                      onClick={() => {
                                        setSelectedMember(member);
                                        setSearchQuery("");
                                        field.onChange(member.member_id);
                                      }}
                                    >
                                      <p className="font-medium">{member.first_name} {member.middle_name} {member.last_name}</p>
                                      <p className="text-xs text-muted-foreground">{member.phone_primary} • {member.membership_no}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {!debouncedSearch && (
                                <p className="text-xs text-muted-foreground">
                                  Start typing to search for members...
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                              <div className="flex-1">
                                <p className="font-medium">{selectedMember.first_name} {selectedMember.middle_name} {selectedMember.last_name}</p>
                                <p className="text-xs text-muted-foreground">{selectedMember.phone_primary} • {selectedMember.membership_no}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedMember(null);
                                  field.onChange("");
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="product_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Product *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select loan product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {loanProducts.map((product) => (
                                <SelectItem key={product.code} value={product.code}>
                                  {product.name} ({product.interest_rate}% {product.interest_type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedProduct && (
                      <div className="p-4 bg-muted rounded-lg text-sm space-y-1">
                        <p>
                          <span className="font-medium">Category:</span> {selectedProduct.category}
                        </p>
                        <p>
                          <span className="font-medium">Interest Type:</span>{" "}
                          {selectedProduct.interest_type}
                        </p>
                        <p>
                          <span className="font-medium">Term Range:</span>{" "}
                          {selectedProduct.min_term_months} - {selectedProduct.max_term_months} months
                        </p>
                        <p>
                          <span className="font-medium">Penalty Rate:</span>{" "}
                          {selectedProduct.penalty_rate}%
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="applied_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loan Amount (ETB) *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="50000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="term_months"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Term (Months) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="24"
                                {...field}
                                min={selectedProduct?.min_term_months}
                                max={selectedProduct?.max_term_months}
                              />
                            </FormControl>
                            {selectedProduct && (
                              <FormDescription>
                                Between {selectedProduct.min_term_months} and{" "}
                                {selectedProduct.max_term_months} months
                              </FormDescription>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="repayment_frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repayment Frequency *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MONTHLY">Monthly</SelectItem>
                              <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="purpose_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Purpose *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the purpose of this loan..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Minimum 10 characters</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-4 pt-4">
                      <Button type="submit" className="flex-1">
                        <FileText className="mr-2 h-4 w-4" />
                        Submit Application
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/loans")}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-1 space-y-6">
            {flatCalc && selectedProduct?.interest_type === "FLAT" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Flat Interest Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Installment</p>
                    <CurrencyDisplay
                      amount={flatCalc.monthlyInstallment}
                      className="text-xl font-bold text-primary"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Interest</p>
                    <CurrencyDisplay amount={flatCalc.totalInterest} className="text-lg font-semibold" />
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Total Repayment</p>
                    <CurrencyDisplay
                      amount={flatCalc.totalRepayment}
                      className="text-2xl font-bold"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {decliningCalc && selectedProduct?.interest_type === "DECLINING" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Declining Balance Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Installment</p>
                    <CurrencyDisplay
                      amount={decliningCalc.monthlyInstallment}
                      className="text-xl font-bold text-primary"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Interest</p>
                    <CurrencyDisplay
                      amount={decliningCalc.totalInterest}
                      className="text-lg font-semibold"
                    />
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Total Repayment</p>
                    <CurrencyDisplay
                      amount={decliningCalc.totalRepayment}
                      className="text-2xl font-bold"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                  <li>Submit application for review</li>
                  <li>Verify collateral and guarantors</li>
                  <li>Complete eligibility checks</li>
                  <li>Await manager approval</li>
                  <li>Loan disbursement</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewLoanApplication;
