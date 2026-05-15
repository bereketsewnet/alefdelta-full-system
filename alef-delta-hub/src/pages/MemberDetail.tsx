import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Member, Account, Transaction, Beneficiary, AccountMetadata, EmergencyContact, MemberDocument } from "@/types";
import { api } from "@/lib/api";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, FileText, Phone, Mail, MapPin, User as UserIcon, Shield, Upload, X, Image as ImageIcon, Plus, Trash2, Users, Lock, Unlock, Ban } from "lucide-react";
import { formatCurrency } from "@/lib/utils/financial";
import { useToast } from "@/hooks/use-toast";
import { useAccountProducts } from "@/hooks/use-account-products";
import { ModernHeader } from "@/components/shared/ModernHeader";

// Helper function to get full image URL
// Images are served at /uploads (not /api/uploads), so we need to remove /api from base URL
const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  let apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://sacco-api.alefdelta.com/api';
  // Remove /api from the end if present, since images are served directly at /uploads
  apiBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
};

const getApiErrorMessage = (error: unknown): string | undefined => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return undefined;
};

const MemberDetail = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get return path from location state (if coming from Account Management or other pages)
  const returnTo = (location.state as { returnTo?: string })?.returnTo || '/members';
  
  // File input refs
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const idCardFrontRef = useRef<HTMLInputElement>(null);
  const idCardBackRef = useRef<HTMLInputElement>(null);
  
  // Member documents refs
  const kebeleIdFrontRef = useRef<HTMLInputElement>(null);
  const kebeleIdBackRef = useRef<HTMLInputElement>(null);
  const driverLicenseRef = useRef<HTMLInputElement>(null);
  const passportRef = useRef<HTMLInputElement>(null);
  const workerIdRef = useRef<HTMLInputElement>(null);
  const registrationReceiptRef = useRef<HTMLInputElement>(null);
  
  // National ID number state
  const [nationalIdNumber, setNationalIdNumber] = useState<string>("");
  const [isEditingNationalId, setIsEditingNationalId] = useState(false);
  
  // Member documents and emergency contacts state
  const [memberDocumentPreviews, setMemberDocumentPreviews] = useState<{
    [key: string]: string[];
  }>({});
  const [emergencyContactDialogOpen, setEmergencyContactDialogOpen] = useState(false);
  const [editingEmergencyContact, setEditingEmergencyContact] = useState<EmergencyContact | null>(null);
  const [emergencyContactForm, setEmergencyContactForm] = useState({
    full_name: '',
    subcity: '',
    woreda: '',
    kebele: '',
    house_number: '',
    phone_number: '',
    relationship: ''
  });
  
  // Beneficiary management state
  const [beneficiaryDialogOpen, setBeneficiaryDialogOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [beneficiaryForm, setBeneficiaryForm] = useState({
    full_name: '',
    relationship: '',
    phone: ''
  });
  const [beneficiaryFilePreviews, setBeneficiaryFilePreviews] = useState<{
    profile_photo?: string;
    id_card_front?: string;
    id_card_back?: string;
  }>({});
  const beneficiaryProfileRef = useRef<HTMLInputElement>(null);
  const beneficiaryIdFrontRef = useRef<HTMLInputElement>(null);
  const beneficiaryIdBackRef = useRef<HTMLInputElement>(null);
  
  // Account management state
const [accountDialogOpen, setAccountDialogOpen] = useState(false);
const [editingAccount, setEditingAccount] = useState<Account | null>(null);
const [accountForm, setAccountForm] = useState({
  product_code: '' as Account['product_code'],
  currency: 'ETB',
  guardian_name: '',
  guardian_relationship: '',
  guardian_phone: '',
  commodity_type: '',
  commodity_quantity: '',
  commodity_unit: '',
  estimated_value: '',
  target_amount: '',
  target_date: '',
  additional_notes: ''
});

  // Transaction dialog state - MUST be before early returns
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRow | null>(null);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const receiptFileRef = useRef<HTMLInputElement>(null);
  
  // Transaction filters
  const [txnTypeFilter, setTxnTypeFilter] = useState<string>('ALL');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('ALL');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const { data: member, isLoading: loadingMember } = useQuery({
    queryKey: ['member', id],
    queryFn: async () => {
      const res = await api.get<Member>(`/members/${id}`);
      return res.data;
    },
    enabled: !!id && !!user
  });

  // Fetch member documents
  const { data: memberDocumentsResponse, isLoading: loadingDocuments } = useQuery({
    queryKey: ['member-documents', id],
    queryFn: async () => {
      const res = await api.get<{ data: MemberDocument[] }>(`/member-documents/member/${id}`);
      return res.data;
    },
    enabled: !!id && !!user
  });

  const memberDocuments = memberDocumentsResponse?.data || [];

  // Fetch emergency contacts
  const { data: emergencyContactsResponse, isLoading: loadingEmergencyContacts } = useQuery({
    queryKey: ['emergency-contacts', id],
    queryFn: async () => {
      const res = await api.get<{ data: EmergencyContact[] }>(`/emergency-contacts/member/${id}`);
      return res.data;
    },
    enabled: !!id && !!user
  });

  const emergencyContacts = emergencyContactsResponse?.data || [];

  // Initialize national ID number from member data
  useEffect(() => {
    if (member?.national_id_number) {
      setNationalIdNumber(member.national_id_number);
    }
  }, [member]);

  const { data: accountsResponse, isLoading: loadingAccounts } = useQuery({
    queryKey: ['member-accounts', id],
    queryFn: async () => {
      const res = await api.get<{ data: Account[] }>(`/accounts/member/${id}`);
      return res.data;
    },
    enabled: !!id && !!user
  });

  const { data: beneficiariesResponse, isLoading: loadingBeneficiaries } = useQuery({
    queryKey: ['member-beneficiaries', id],
    queryFn: async () => {
      const res = await api.get<{ data: Beneficiary[] }>(`/beneficiaries/member/${id}`);
      return res.data;
    },
    enabled: !!id && !!user
  });

  // Fetch account products
const { data: accountProducts = [] } = useAccountProducts(!!user);
const activeAccountProducts = accountProducts.filter(p => p.is_active);
const selectedAccountProduct = activeAccountProducts.find(p => p.product_code === accountForm.product_code);

  useEffect(() => {
    if (activeAccountProducts.length && !accountForm.product_code) {
      setAccountForm((prev) => ({
        ...prev,
        product_code: activeAccountProducts[0].product_code as Account['product_code']
      }));
    }
  }, [activeAccountProducts, accountForm.product_code]);

  // Fetch member transactions - MUST be before early returns (Rules of Hooks)
  const { data: transactionsResponse, isLoading: loadingTransactions } = useQuery({
    queryKey: ['member-transactions', id, txnTypeFilter, dateFromFilter, dateToFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (txnTypeFilter !== 'ALL') params.append('txn_type', txnTypeFilter);
      if (dateFromFilter) params.append('date_from', dateFromFilter);
      if (dateToFilter) params.append('date_to', dateToFilter);
      const queryString = params.toString();
      const res = await api.get<{ data: Transaction[] }>(`/transactions/member/${id}${queryString ? `?${queryString}` : ''}`);
      return res.data;
    },
    enabled: !!id && !!user
  });

  const memberAccounts = accountsResponse?.data || [];
  const memberTransactions = transactionsResponse?.data || [];

  // Fetch system configuration (for share lien calculation)
  const { data: systemConfigResponse } = useQuery({
    queryKey: ['system-config'],
    queryFn: async () => {
      const res = await api.get<{ data: { config_key: string; config_value: string }[] }>('/system/config');
      return res.data.data;
    },
    enabled: !!user
  });

  const systemConfigMap: Record<string, string> = (systemConfigResponse || []).reduce((acc, item) => {
    acc[item.config_key] = item.config_value;
    return acc;
  }, {} as Record<string, string>);

  // Calculate totals
  const totalBalance = memberAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const totalLien = memberAccounts.reduce((sum, acc) => sum + Number(acc.lien_amount), 0);

  const sharePrice = Number(systemConfigMap.share_price ?? 300);
  const minSharesRequired = Number(systemConfigMap.min_shares_required ?? 5);
  const requestedShares = Number(member?.shares_requested ?? 0);
  // Use per-member shares if set (>0). Only fall back to default minimum when member shares are 0/unset.
  const effectiveShares = (requestedShares && requestedShares > 0) ? requestedShares : (minSharesRequired || 0);
  const shareLienAmount =
    (Number.isFinite(sharePrice) ? sharePrice : 300) *
    (Number.isFinite(effectiveShares) ? effectiveShares : 0);

  // Display lien should reflect share requirement even if account lien amounts are 0
  const displayLienAmount = Math.max(totalLien, shareLienAmount);
  const displayAvailableAmount = Math.max(0, totalBalance - displayLienAmount);

  if (!user) return null;
  if (loadingMember) return <div className="p-8 text-center">Loading member details...</div>;

  if (!member) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Member Not Found</CardTitle>
            <CardDescription>The requested member does not exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(returnTo)}>Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    let apiBase = import.meta.env.VITE_API_BASE_URL || 'https://sacco-api.alefdelta.com/api';
    // Remove /api from the end if present, since images are served directly at /uploads
    apiBase = apiBase.replace(/\/api\/?$/, '');
    return `${apiBase}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const handleReceiptFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadReceipt = async () => {
    if (!selectedTransaction || !receiptFile) return;

    try {
      setUploadingReceipt(true);
      const formData = new FormData();
      formData.append('receipt', receiptFile);

      await api.put(`/transactions/${selectedTransaction.txn_id}/receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast({
        title: "Success",
        description: "Receipt photo updated successfully",
      });

      // Refresh transactions
      queryClient.invalidateQueries({ queryKey: ['member-transactions', id] });
      
      // Update selected transaction
      setSelectedTransaction({
        ...selectedTransaction,
        receipt_photo_url: selectedTransaction.receipt_photo_url // Will be updated by refetch
      });

      // Reset file state
      setReceiptFile(null);
      setReceiptPreview(null);
      if (receiptFileRef.current) receiptFileRef.current.value = '';
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error) || "Failed to upload receipt photo",
        variant: "destructive"
      });
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleOpenTransactionDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setReceiptFile(null);
    setReceiptPreview(null);
    if (receiptFileRef.current) receiptFileRef.current.value = '';
    setTransactionDialogOpen(true);
  };

  const transactionColumns = [
    {
      key: "created_at",
      header: "Date",
      cell: (row: Transaction) => (
        <span className="text-sm">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "txn_type",
      header: "Type",
      cell: (row: Transaction) => (
        <Badge variant={row.txn_type === 'DEPOSIT' ? 'default' : 'destructive'}>
          {row.txn_type}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row: Transaction) => (
        <CurrencyDisplay 
          amount={row.amount} 
          className={`text-sm font-medium ${row.txn_type === 'DEPOSIT' ? 'text-success' : 'text-destructive'}`}
        />
      ),
    },
    {
      key: "balance_after",
      header: "Balance After",
      cell: (row: Transaction) => (
        <CurrencyDisplay amount={row.balance_after} className="text-sm" />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: Transaction) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenTransactionDialog(row)}
        >
          View Details
        </Button>
      ),
    },
  ];

  // Account management handlers
  const openAddAccount = () => {
    setEditingAccount(null);
    const firstProduct = activeAccountProducts[0]?.product_code || '';
    setAccountForm({
      product_code: firstProduct as Account['product_code'],
      currency: 'ETB',
      guardian_name: '',
      guardian_relationship: '',
      guardian_phone: '',
      commodity_type: '',
      commodity_quantity: '',
      commodity_unit: '',
      estimated_value: '',
      target_amount: '',
      target_date: '',
      additional_notes: ''
    });
    setAccountDialogOpen(true);
  };

  const openEditAccount = (account: Account) => {
    setEditingAccount(account);
    const metadata = (account.metadata ?? undefined) as AccountMetadata | undefined;
    const guardian = metadata?.guardian || {};
    const inKind = metadata?.in_kind || {};
    const micro = metadata?.micro || {};
    setAccountForm({
      product_code: account.product_code,
      currency: account.currency || 'ETB',
      guardian_name: guardian.name || '',
      guardian_relationship: guardian.relationship || '',
      guardian_phone: guardian.phone || '',
      commodity_type: inKind.type || '',
      commodity_quantity: inKind.quantity?.toString?.() || '',
      commodity_unit: inKind.unit || '',
      estimated_value: inKind.estimated_value?.toString?.() || '',
      target_amount: micro.target_amount?.toString?.() || '',
      target_date: micro.target_date || '',
      additional_notes: metadata.notes || ''
    });
    setAccountDialogOpen(true);
  };

  const handleAccountSubmit = async () => {
    if (!id) return;

    try {
      const selectedProduct = activeAccountProducts.find(p => p.product_code === accountForm.product_code);
      if (!selectedProduct) {
        toast({ title: "Error", description: "Please choose a valid account product", variant: "destructive" });
        return;
      }

      const metadataPayload: AccountMetadata = {};

      if (selectedProduct.guardian_required || accountForm.guardian_name) {
        if (selectedProduct.guardian_required && !accountForm.guardian_name) {
          toast({ title: "Missing guardian", description: "Guardian name is required for this product", variant: "destructive" });
          return;
        }
        metadataPayload.guardian = {
          name: accountForm.guardian_name || undefined,
          relationship: accountForm.guardian_relationship || undefined,
          phone: accountForm.guardian_phone || undefined
        };
      }

      if (selectedProduct.commodity_required || accountForm.commodity_type) {
        const quantity = accountForm.commodity_quantity ? Number(accountForm.commodity_quantity) : undefined;
        const estimatedValue = accountForm.estimated_value ? Number(accountForm.estimated_value) : undefined;
        if (selectedProduct.commodity_required && !accountForm.commodity_type) {
          toast({ title: "Missing commodity", description: "Commodity type is required for this product", variant: "destructive" });
          return;
        }
        if (selectedProduct.commodity_required && (!quantity || quantity <= 0)) {
          toast({ title: "Invalid quantity", description: "Please provide a valid commodity quantity", variant: "destructive" });
          return;
        }
        metadataPayload.in_kind = {
          type: accountForm.commodity_type || selectedProduct.default_commodity_type || undefined,
          quantity: quantity || undefined,
          unit: accountForm.commodity_unit || undefined,
          estimated_value: estimatedValue || undefined
        };
      }

      if (selectedProduct.target_required || selectedProduct.product_kind === "MICRO" || accountForm.target_amount) {
        const targetAmount = accountForm.target_amount ? Number(accountForm.target_amount) : undefined;
        if ((selectedProduct.target_required || selectedProduct.product_kind === "MICRO") && (!targetAmount || targetAmount <= 0)) {
          toast({ title: "Missing target", description: "Target amount is required for this product", variant: "destructive" });
          return;
        }
        metadataPayload.micro = {
          target_amount: targetAmount || undefined,
          target_date: accountForm.target_date || undefined
        };
      }

      if (accountForm.additional_notes) {
        metadataPayload.notes = accountForm.additional_notes;
      }

      const metadata = Object.keys(metadataPayload).length ? metadataPayload : undefined;

      if (editingAccount) {
        await api.put(`/accounts/${editingAccount.account_id}`, {
          product_code: accountForm.product_code,
          currency: accountForm.currency,
          metadata
        });
        toast({
          title: "Success",
          description: "Account updated successfully",
        });
      } else {
        await api.post('/accounts', {
          member_id: id,
          product_code: accountForm.product_code,
          currency: accountForm.currency,
          metadata
        });
        toast({
          title: "Success",
          description: "Account created successfully",
        });
      }

      queryClient.invalidateQueries({ queryKey: ['member-accounts', id] });
      queryClient.invalidateQueries({ queryKey: ['account-products'] }); // Refresh account products
      setAccountDialogOpen(false);
      const firstProduct = activeAccountProducts[0]?.product_code || '';
      setAccountForm({
        product_code: firstProduct as Account['product_code'],
        currency: 'ETB',
        guardian_name: '',
        guardian_relationship: '',
        guardian_phone: '',
        commodity_type: '',
        commodity_quantity: '',
        commodity_unit: '',
        estimated_value: '',
        target_amount: '',
        target_date: '',
        additional_notes: ''
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error) || "Failed to save account",
        variant: "destructive",
      });
    }
  };

  const handleFreezeAccount = async (accountId: string) => {
    try {
      await api.post(`/accounts/${accountId}/freeze`);
      toast({
        title: "Success",
        description: "Account frozen successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['member-accounts', id] });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error) || "Failed to freeze account",
        variant: "destructive",
      });
    }
  };

  const handleUnfreezeAccount = async (accountId: string) => {
    try {
      await api.post(`/accounts/${accountId}/unfreeze`);
      toast({
        title: "Success",
        description: "Account unfrozen successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['member-accounts', id] });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error) || "Failed to unfreeze account",
        variant: "destructive",
      });
    }
  };

  const handleCloseAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to close this account? This action cannot be undone.')) return;

    try {
      await api.post(`/accounts/${accountId}/close`);
      toast({
        title: "Success",
        description: "Account closed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['member-accounts', id] });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error) || "Failed to close account",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account? This action is permanent and cannot be undone.')) return;

    try {
      await api.delete(`/accounts/${accountId}`);
      toast({
        title: "Success",
        description: "Account deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['member-accounts', id] });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error) || "Failed to delete account",
        variant: "destructive",
      });
    }
  };

  // Helper function to get product name from product_code
  const getProductName = (productCode: string) => {
    const product = accountProducts.find(p => p.product_code === productCode);
    return product?.name || productCode.replace(/_/g, " ");
  };

type AccountWithMetadata = Account & { metadata?: AccountMetadata | null };
type TransactionRow = Transaction & {
  product_code?: string | null;
  performed_by_username?: string | null;
  receipt_photo_url?: string | null;
};

const renderAccountMetadataSummary = (account: AccountWithMetadata) => {
    const metadata = account.metadata ?? undefined;
    if (!metadata) return null;

    const guardian = metadata.guardian;
    const inKind = metadata.in_kind;
    const micro = metadata.micro;

    if (!guardian && !inKind && !micro && !metadata.notes) {
      return null;
    }

    return (
      <div className="text-xs text-muted-foreground mt-1 space-y-1">
        {guardian?.name && (
          <p>
            Guardian: {guardian.name}
            {guardian.relationship ? ` (${guardian.relationship})` : ""}{guardian.phone ? ` · ${guardian.phone}` : ""}
          </p>
        )}
        {inKind?.type && (
          <p>
            Commodity: {inKind.type}
            {inKind.quantity ? ` · Qty ${inKind.quantity}${inKind.unit ? ` ${inKind.unit}` : ""}` : ""}
            {inKind.estimated_value ? ` · ETB ${Number(inKind.estimated_value).toLocaleString()}` : ""}
          </p>
        )}
        {micro?.target_amount && (
          <p>
            Target: ETB {Number(micro.target_amount).toLocaleString()}
            {micro.target_date ? ` by ${micro.target_date}` : ""}
          </p>
        )}
        {metadata.notes && <p>Notes: {metadata.notes}</p>}
      </div>
    );
  };

  const accountColumns = [
    {
      key: "product_code",
      header: "Product",
      cell: (row: Account) => (
        <div>
          <span className="font-medium text-sm">{getProductName(row.product_code)}</span>
          {renderAccountMetadataSummary(row as AccountWithMetadata)}
        </div>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      cell: (row: Account) => (
        <CurrencyDisplay amount={row.balance} className="text-sm font-semibold" />
      ),
    },
    {
      key: "lien_amount",
      header: "Lien",
      cell: (row: Account) => (
        <CurrencyDisplay amount={row.lien_amount} className="text-sm text-muted-foreground" />
      ),
    },
    {
      key: "available_balance",
      header: "Available",
      cell: (row: Account) => {
        const available = Number(row.balance) - Number(row.lien_amount);
        return <CurrencyDisplay amount={available} className="text-sm text-success" />;
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (row: Account) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: Account) => (
        <div className="flex items-center gap-2">
          {['TELLER', 'MANAGER', 'ADMIN'].includes(user?.role || '') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditAccount(row)}
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
          {['MANAGER', 'ADMIN'].includes(user?.role || '') && (
            <>
              {row.status === 'FROZEN' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnfreezeAccount(row.account_id)}
                  title="Unfreeze Account"
                >
                  <Unlock className="h-3 w-3" />
                </Button>
              ) : row.status === 'ACTIVE' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFreezeAccount(row.account_id)}
                  title="Freeze Account"
                >
                  <Lock className="h-3 w-3" />
                </Button>
              ) : null}
              {row.status !== 'CLOSED' && Number(row.balance) === 0 && Number(row.lien_amount) === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCloseAccount(row.account_id)}
                  title="Close Account"
                >
                  <Ban className="h-3 w-3" />
                </Button>
              )}
            </>
          )}
          {user?.role === 'ADMIN' && row.status === 'CLOSED' && Number(row.balance) === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteAccount(row.account_id)}
              title="Delete Account"
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleFileUpload = async (fileType: 'profile_photo' | 'id_card_front' | 'id_card_back', file: File | null) => {
    if (!file || !id) return;

    try {
      const formData = new FormData();
      formData.append(fileType, file);

      await api.post(`/members/${id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: "Upload Successful",
        description: `${fileType.replace('_', ' ')} uploaded successfully.`,
      });

      // Refresh member data
      queryClient.invalidateQueries({ queryKey: ['member', id] });
    } catch (error: unknown) {
      toast({
        title: "Upload Failed",
        description: getApiErrorMessage(error) || "Failed to upload file.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (fileType: 'profile_photo' | 'id_card_front' | 'id_card_back', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(fileType, file);
    }
  };

  // Member document handlers
  const handleMemberDocumentUpload = async (
    documentType: 'KEBELE_ID' | 'DRIVER_LICENSE' | 'PASSPORT' | 'WORKER_ID' | 'REGISTRATION_RECEIPT',
    frontFiles: File[],
    backFiles: File[] = []
  ) => {
    if (!id || (frontFiles.length === 0 && backFiles.length === 0)) return;

    try {
      const formData = new FormData();
      formData.append('document_type', documentType);
      
      frontFiles.forEach((file) => {
        formData.append('front_photo', file);
      });
      
      backFiles.forEach((file) => {
        formData.append('back_photo', file);
      });

      await api.post(`/member-documents/member/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: "Upload Successful",
        description: `${documentType.replace('_', ' ')} uploaded successfully.`,
      });

      queryClient.invalidateQueries({ queryKey: ['member-documents', id] });
      setMemberDocumentPreviews(prev => {
        const newPrev = { ...prev };
        delete newPrev[`${documentType}_front`];
        delete newPrev[`${documentType}_back`];
        return newPrev;
      });
    } catch (error: unknown) {
      toast({
        title: "Upload Failed",
        description: getApiErrorMessage(error) || "Failed to upload document.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMemberDocument = async (documentId: string) => {
    if (!id) return;

    try {
      await api.delete(`/member-documents/${documentId}`);
      toast({
        title: "Success",
        description: "Document deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['member-documents', id] });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error) || "Failed to delete document.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateNationalId = async () => {
    if (!id) return;

    try {
      await api.put(`/members/${id}`, {
        national_id_number: nationalIdNumber || null,
      });
      toast({
        title: "Success",
        description: "National ID number updated successfully.",
      });
      setIsEditingNationalId(false);
      queryClient.invalidateQueries({ queryKey: ['member', id] });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error) || "Failed to update National ID number.",
        variant: "destructive",
      });
    }
  };

  const handleMemberDocumentFileChange = async (
    documentType: 'KEBELE_ID' | 'DRIVER_LICENSE' | 'PASSPORT' | 'WORKER_ID' | 'REGISTRATION_RECEIPT',
    side: 'front' | 'back',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Create previews
    const previewPromises = files.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    const previews = await Promise.all(previewPromises);
    setMemberDocumentPreviews(prev => ({
      ...prev,
      [`${documentType}_${side}`]: [...(prev[`${documentType}_${side}`] || []), ...previews],
    }));

    // Upload files
    if (side === 'front') {
      await handleMemberDocumentUpload(documentType, files, []);
    } else {
      // For back side, we need to get front files if they exist
      await handleMemberDocumentUpload(documentType, [], files);
    }
  };

  // Emergency contact handlers
  const openAddEmergencyContact = () => {
    setEditingEmergencyContact(null);
    setEmergencyContactForm({
      full_name: '',
      subcity: '',
      woreda: '',
      kebele: '',
      house_number: '',
      phone_number: '',
      relationship: ''
    });
    setEmergencyContactDialogOpen(true);
  };

  const openEditEmergencyContact = (contact: EmergencyContact) => {
    setEditingEmergencyContact(contact);
    setEmergencyContactForm({
      full_name: contact.full_name,
      subcity: contact.subcity || '',
      woreda: contact.woreda || '',
      kebele: contact.kebele || '',
      house_number: contact.house_number || '',
      phone_number: contact.phone_number,
      relationship: contact.relationship || ''
    });
    setEmergencyContactDialogOpen(true);
  };

  const handleEmergencyContactSubmit = async () => {
    if (!id || !emergencyContactForm.full_name || !emergencyContactForm.phone_number) {
      toast({
        title: "Validation Error",
        description: "Full name and phone number are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingEmergencyContact) {
        await api.put(`/emergency-contacts/${editingEmergencyContact.emergency_contact_id}`, emergencyContactForm);
        toast({
          title: "Success",
          description: "Emergency contact updated successfully.",
        });
      } else {
        await api.post(`/emergency-contacts/member/${id}`, emergencyContactForm);
        toast({
          title: "Success",
          description: "Emergency contact added successfully.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['emergency-contacts', id] });
      setEmergencyContactDialogOpen(false);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error) || "Failed to save emergency contact.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEmergencyContact = async (contactId: string) => {
    if (!id) return;

    try {
      await api.delete(`/emergency-contacts/${contactId}`);
      toast({
        title: "Success",
        description: "Emergency contact deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['emergency-contacts', id] });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error) || "Failed to delete emergency contact.",
        variant: "destructive",
      });
    }
  };

  // Beneficiary management handlers
  const openAddBeneficiary = () => {
    setEditingBeneficiary(null);
    setBeneficiaryForm({ full_name: '', relationship: '', phone: '' });
    setBeneficiaryFilePreviews({});
    setBeneficiaryDialogOpen(true);
  };

  const openEditBeneficiary = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary);
    setBeneficiaryForm({
      full_name: beneficiary.full_name,
      relationship: beneficiary.relationship,
      phone: beneficiary.phone
    });
    setBeneficiaryFilePreviews({
      profile_photo: beneficiary.profile_photo_url ? getImageUrl(beneficiary.profile_photo_url) : undefined,
      id_card_front: beneficiary.id_front_url ? getImageUrl(beneficiary.id_front_url) : undefined,
      id_card_back: beneficiary.id_back_url ? getImageUrl(beneficiary.id_back_url) : undefined,
    });
    setBeneficiaryDialogOpen(true);
  };

  const handleBeneficiaryFileChange = (fileType: 'profile_photo' | 'id_card_front' | 'id_card_back', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBeneficiaryFilePreviews(prev => ({
          ...prev,
          [fileType]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBeneficiarySubmit = async () => {
    if (!id || !beneficiaryForm.full_name || !beneficiaryForm.relationship || !beneficiaryForm.phone) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check if ID cards are provided (required for new beneficiaries, optional for updates)
    if (!editingBeneficiary) {
      const idFront = beneficiaryIdFrontRef.current?.files?.[0];
      const idBack = beneficiaryIdBackRef.current?.files?.[0];
      if (!idFront || !idBack) {
        toast({
          title: "Validation Error",
          description: "ID Card Front and Back are required",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append('full_name', beneficiaryForm.full_name);
      formData.append('relationship', beneficiaryForm.relationship);
      formData.append('phone', beneficiaryForm.phone);

      const profilePhoto = beneficiaryProfileRef.current?.files?.[0];
      const idFront = beneficiaryIdFrontRef.current?.files?.[0];
      const idBack = beneficiaryIdBackRef.current?.files?.[0];

      if (profilePhoto) formData.append('profile_photo', profilePhoto);
      if (idFront) formData.append('id_card_front', idFront);
      if (idBack) formData.append('id_card_back', idBack);

      if (editingBeneficiary) {
        await api.put(`/beneficiaries/${editingBeneficiary.beneficiary_id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast({
          title: "Success",
          description: "Beneficiary updated successfully",
        });
      } else {
        await api.post(`/beneficiaries/member/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast({
          title: "Success",
          description: "Beneficiary added successfully",
        });
      }

      queryClient.invalidateQueries({ queryKey: ['member-beneficiaries', id] });
      setBeneficiaryDialogOpen(false);
      setBeneficiaryForm({ full_name: '', relationship: '', phone: '' });
      setBeneficiaryFilePreviews({});
      // Reset file inputs
      if (beneficiaryProfileRef.current) beneficiaryProfileRef.current.value = '';
      if (beneficiaryIdFrontRef.current) beneficiaryIdFrontRef.current.value = '';
      if (beneficiaryIdBackRef.current) beneficiaryIdBackRef.current.value = '';
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error) || "Failed to save beneficiary",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBeneficiary = async (beneficiaryId: string) => {
    if (!confirm('Are you sure you want to delete this beneficiary?')) return;

    try {
      await api.delete(`/beneficiaries/${beneficiaryId}`);
      toast({
        title: "Success",
        description: "Beneficiary deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['member-beneficiaries', id] });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error) || "Failed to delete beneficiary",
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
            <Button variant="ghost" size="icon" onClick={() => navigate(returnTo)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Member Profile</h1>
              <p className="text-sm text-muted-foreground">{member.membership_no}</p>
            </div>
            <Button variant="outline" onClick={() => navigate(`/members/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Member Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  {member.profile_photo_url ? (
                    <AvatarImage 
                      src={getImageUrl(member.profile_photo_url)} 
                      alt={`${member.first_name} ${member.last_name}`}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="text-2xl">
                    {member.first_name[0]}
                    {member.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>
                  {member.first_name} {member.middle_name} {member.last_name}
                </CardTitle>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <StatusBadge status={member.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{member.phone_primary}</span>
                </div>
                {member.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{member.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {member.address_subcity}, {member.address_woreda}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{member.member_type.replace("_", " ")}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Income: {formatCurrency(member.monthly_income)}/mo</span>
                </div>
              </CardContent>
            </Card>

            {/* Balance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Balance</span>
                  <CurrencyDisplay
                    amount={totalBalance}
                    className="font-semibold text-lg text-primary"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Lien Amount</span>
                  <CurrencyDisplay
                    amount={displayLienAmount}
                    className="font-medium text-sm text-destructive"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Share lien: {effectiveShares} × {Number.isFinite(sharePrice) ? sharePrice : 300} ETB
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Available</span>
                  <CurrencyDisplay
                    amount={displayAvailableAmount}
                    className="font-semibold text-lg text-success"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="accounts" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="accounts">Accounts</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="loans">Loans</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="beneficiaries">Beneficiaries</TabsTrigger>
                <TabsTrigger value="emergency-contacts">Emergency Contacts</TabsTrigger>
              </TabsList>

              <TabsContent value="accounts" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                    <CardTitle>Member Accounts</CardTitle>
                    <CardDescription>
                      {memberAccounts.length} account{memberAccounts.length !== 1 ? "s" : ""}
                    </CardDescription>
                      </div>
                      {['TELLER', 'MANAGER', 'ADMIN'].includes(user?.role || '') && (
                        <Button onClick={openAddAccount}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Account
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingAccounts ? (
                      <div className="text-center py-8">Loading accounts...</div>
                    ) : memberAccounts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No accounts found</p>
                        {['TELLER', 'MANAGER', 'ADMIN'].includes(user?.role || '') && (
                          <Button variant="outline" className="mt-4" onClick={openAddAccount}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create First Account
                          </Button>
                        )}
                      </div>
                    ) : (
                    <DataTable
                      data={memberAccounts}
                      columns={accountColumns}
                      emptyMessage="No accounts found."
                    />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>All transactions for this member</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <Label htmlFor="txn-type-filter">Transaction Type</Label>
                        <Select value={txnTypeFilter} onValueChange={setTxnTypeFilter}>
                          <SelectTrigger id="txn-type-filter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">All Types</SelectItem>
                            <SelectItem value="DEPOSIT">Deposit</SelectItem>
                            <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="account-type-filter">Account Type</Label>
                        <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                          <SelectTrigger id="account-type-filter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">All Accounts</SelectItem>
                            {activeAccountProducts.map((product) => (
                              <SelectItem key={product.product_code} value={product.product_code}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="date-from">From Date</Label>
                        <Input
                          id="date-from"
                          type="date"
                          value={dateFromFilter}
                          onChange={(e) => setDateFromFilter(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="date-to">To Date</Label>
                        <Input
                          id="date-to"
                          type="date"
                          value={dateToFilter}
                          onChange={(e) => setDateToFilter(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {loadingTransactions ? (
                      <div className="text-center py-8">Loading transactions...</div>
                    ) : (
                    <DataTable
                      data={(memberTransactions as TransactionRow[]).filter((txn) => {
                        if (accountTypeFilter !== 'ALL' && txn.product_code !== accountTypeFilter) {
                          return false;
                        }
                        return true;
                      })}
                      columns={transactionColumns}
                      emptyMessage="No transactions found."
                    />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Transaction Details Dialog */}
              <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Transaction Details</DialogTitle>
                    <DialogDescription>
                      View complete transaction information
                    </DialogDescription>
                  </DialogHeader>
                  {selectedTransaction && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Transaction ID</Label>
                          <p className="font-mono text-sm">{selectedTransaction.txn_id}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Type</Label>
                          <div>
                            <Badge variant={selectedTransaction.txn_type === 'DEPOSIT' ? 'default' : 'destructive'}>
                              {selectedTransaction.txn_type}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Amount</Label>
                          <p className={`font-semibold ${selectedTransaction.txn_type === 'DEPOSIT' ? 'text-success' : 'text-destructive'}`}>
                            {selectedTransaction.txn_type === 'DEPOSIT' ? '+' : '-'}
                            {formatCurrency(selectedTransaction.amount)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Balance After</Label>
                          <p className="font-semibold">{formatCurrency(selectedTransaction.balance_after)}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Reference</Label>
                          <p className="text-sm">{selectedTransaction.reference || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Date & Time</Label>
                          <p className="text-sm">
                            {new Date(selectedTransaction.created_at).toLocaleString()}
                          </p>
                        </div>
                        {selectedTransaction.product_code && (
                          <div>
                            <Label className="text-muted-foreground">Account Type</Label>
                            <p className="text-sm">{selectedTransaction.product_code}</p>
                          </div>
                        )}
                        {selectedTransaction.performed_by_username && (
                          <div>
                            <Label className="text-muted-foreground">Performed By</Label>
                            <p className="text-sm">{selectedTransaction.performed_by_username}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Receipt Photo</Label>
                        <div className="mt-2 space-y-3">
                          {/* Image Preview - Fixed rectangular size */}
                          {(receiptPreview || selectedTransaction.receipt_photo_url) && (
                            <div className="relative w-full h-64 border rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center">
                              <img
                                src={receiptPreview || getImageUrl(selectedTransaction.receipt_photo_url) || ''}
                                alt="Receipt"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Upload/Update Button */}
                          <div className="flex items-center gap-2">
                            <input
                              ref={receiptFileRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleReceiptFileChange}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => receiptFileRef.current?.click()}
                              disabled={uploadingReceipt}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {selectedTransaction.receipt_photo_url ? 'Update Receipt' : 'Upload Receipt'}
                            </Button>
                            {receiptFile && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleUploadReceipt}
                                disabled={uploadingReceipt}
                              >
                                {uploadingReceipt ? 'Uploading...' : 'Save Receipt'}
                              </Button>
                            )}
                            {receiptFile && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setReceiptFile(null);
                                  setReceiptPreview(null);
                                  if (receiptFileRef.current) receiptFileRef.current.value = '';
                                }}
                                disabled={uploadingReceipt}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTransactionDialogOpen(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <TabsContent value="loans" className="mt-6">
                <MemberLoansTab memberId={member.member_id} />
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>Member documentation and files</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* National ID Number */}
                      <div className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">National ID Card Number</p>
                              <p className="text-xs text-muted-foreground">
                                {isEditingNationalId ? "Editing..." : (member.national_id_number || "Not set")}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {isEditingNationalId ? (
                              <>
                                <Input
                                  value={nationalIdNumber}
                                  onChange={(e) => setNationalIdNumber(e.target.value)}
                                  placeholder="Enter National ID number"
                                  className="w-48"
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={handleUpdateNationalId}
                                >
                                  Save
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setIsEditingNationalId(false);
                                    setNationalIdNumber(member.national_id_number || "");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setIsEditingNationalId(true);
                                  setNationalIdNumber(member.national_id_number || "");
                                }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                {member.national_id_number ? 'Edit' : 'Add'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Profile Photo */}
                      <div className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Profile Photo</p>
                              <p className="text-xs text-muted-foreground">
                                {member.profile_photo_url ? "Uploaded" : "Not uploaded"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {member.profile_photo_url && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => window.open(getImageUrl(member.profile_photo_url), '_blank')}
                              >
                                View
                              </Button>
                            )}
                            <input
                              ref={profilePhotoRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileChange('profile_photo', e)}
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => profilePhotoRef.current?.click()}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              {member.profile_photo_url ? 'Replace' : 'Upload'}
                            </Button>
                          </div>
                        </div>
                        {member.profile_photo_url && (
                          <div className="mt-2">
                            <img 
                              src={getImageUrl(member.profile_photo_url)} 
                              alt="Profile" 
                              className="h-32 w-32 object-cover rounded-lg border"
                              onError={(e) => {
                                console.error('Image load error:', member.profile_photo_url);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* National ID Card - Front (Required) */}
                      <div className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">National ID Card - Front *</p>
                              <p className="text-xs text-muted-foreground">
                                {member.id_card_front_url ? "Uploaded" : "Required"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {member.id_card_front_url && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => window.open(getImageUrl(member.id_card_front_url), '_blank')}
                              >
                                View
                              </Button>
                            )}
                            <input
                              ref={idCardFrontRef}
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => handleFileChange('id_card_front', e)}
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => idCardFrontRef.current?.click()}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              {member.id_card_front_url ? 'Replace' : 'Upload'}
                            </Button>
                          </div>
                        </div>
                        {member.id_card_front_url && (
                          <div className="mt-2">
                            <img 
                              src={getImageUrl(member.id_card_front_url)} 
                              alt="National ID Card Front" 
                              className="h-40 w-auto object-contain rounded-lg border"
                              onError={(e) => {
                                console.error('Image load error:', member.id_card_front_url);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* ID Card Back (Optional) */}
                      <div className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">ID Card - Back (Optional)</p>
                              <p className="text-xs text-muted-foreground">
                                {member.id_card_back_url ? "Uploaded" : "Not uploaded"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {member.id_card_back_url && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => window.open(getImageUrl(member.id_card_back_url), '_blank')}
                              >
                                View
                              </Button>
                            )}
                            <input
                              ref={idCardBackRef}
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => handleFileChange('id_card_back', e)}
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => idCardBackRef.current?.click()}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              {member.id_card_back_url ? 'Replace' : 'Upload'}
                            </Button>
                          </div>
                        </div>
                        {member.id_card_back_url && (
                          <div className="mt-2">
                            <img 
                              src={getImageUrl(member.id_card_back_url)} 
                              alt="ID Card Back" 
                              className="h-40 w-auto object-contain rounded-lg border"
                              onError={(e) => {
                                console.error('Image load error:', member.id_card_back_url);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Kebele ID (Required - Front and Back) */}
                      {(() => {
                        const kebeleDocs = memberDocuments.filter(d => d.document_type === 'KEBELE_ID');
                        return (
                          <div className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">Kebele ID *</p>
                                  <p className="text-xs text-muted-foreground">
                                    {kebeleDocs.length > 0 ? `${kebeleDocs.length} document(s) uploaded` : "Required - Front and Back"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  ref={kebeleIdFrontRef}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => handleMemberDocumentFileChange('KEBELE_ID', 'front', e)}
                                />
                                <input
                                  ref={kebeleIdBackRef}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => handleMemberDocumentFileChange('KEBELE_ID', 'back', e)}
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => kebeleIdFrontRef.current?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Upload Front
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => kebeleIdBackRef.current?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Upload Back
                                </Button>
                              </div>
                            </div>
                            {kebeleDocs.length > 0 && (
                              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                                {kebeleDocs.map((doc) => (
                                  <div key={doc.document_id} className="relative">
                                    {doc.is_verified && (
                                      <Badge className="absolute top-2 right-2 z-10" variant="default">
                                        Verified
                                      </Badge>
                                    )}
                                    {doc.front_photo_url && (
                                      <div className="mb-2">
                                        <img 
                                          src={getImageUrl(doc.front_photo_url)} 
                                          alt="Kebele ID Front" 
                                          className="h-32 w-full object-contain rounded-lg border"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                        <div className="flex gap-2 mt-2">
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => window.open(getImageUrl(doc.front_photo_url), '_blank')}
                                          >
                                            View
                                          </Button>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => handleDeleteMemberDocument(doc.document_id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                    {doc.back_photo_url && (
                                      <div>
                                        <img 
                                          src={getImageUrl(doc.back_photo_url)} 
                                          alt="Kebele ID Back" 
                                          className="h-32 w-full object-contain rounded-lg border"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Driver License (Optional) */}
                      {(() => {
                        const driverLicenseDocs = memberDocuments.filter(d => d.document_type === 'DRIVER_LICENSE');
                        return (
                          <div className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">Driver License (Optional)</p>
                                  <p className="text-xs text-muted-foreground">
                                    {driverLicenseDocs.length > 0 ? `${driverLicenseDocs.length} document(s) uploaded` : "Not uploaded"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  ref={driverLicenseRef}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => handleMemberDocumentFileChange('DRIVER_LICENSE', 'front', e)}
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => driverLicenseRef.current?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Upload
                                </Button>
                              </div>
                            </div>
                            {driverLicenseDocs.length > 0 && (
                              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                                {driverLicenseDocs.map((doc) => (
                                  <div key={doc.document_id} className="relative">
                                    {doc.is_verified && (
                                      <Badge className="absolute top-2 right-2 z-10" variant="default">
                                        Verified
                                      </Badge>
                                    )}
                                    {doc.front_photo_url && (
                                      <>
                                        <img 
                                          src={getImageUrl(doc.front_photo_url)} 
                                          alt="Driver License" 
                                          className="h-32 w-full object-contain rounded-lg border"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                        <div className="flex gap-2 mt-2">
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => window.open(getImageUrl(doc.front_photo_url), '_blank')}
                                          >
                                            View
                                          </Button>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => handleDeleteMemberDocument(doc.document_id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Passport (Optional) */}
                      {(() => {
                        const passportDocs = memberDocuments.filter(d => d.document_type === 'PASSPORT');
                        return (
                          <div className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">Passport (Optional)</p>
                                  <p className="text-xs text-muted-foreground">
                                    {passportDocs.length > 0 ? `${passportDocs.length} document(s) uploaded` : "Not uploaded"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  ref={passportRef}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => handleMemberDocumentFileChange('PASSPORT', 'front', e)}
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => passportRef.current?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Upload
                                </Button>
                              </div>
                            </div>
                            {passportDocs.length > 0 && (
                              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                                {passportDocs.map((doc) => (
                                  <div key={doc.document_id} className="relative">
                                    {doc.is_verified && (
                                      <Badge className="absolute top-2 right-2 z-10" variant="default">
                                        Verified
                                      </Badge>
                                    )}
                                    {doc.front_photo_url && (
                                      <>
                                        <img 
                                          src={getImageUrl(doc.front_photo_url)} 
                                          alt="Passport" 
                                          className="h-32 w-full object-contain rounded-lg border"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                        <div className="flex gap-2 mt-2">
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => window.open(getImageUrl(doc.front_photo_url), '_blank')}
                                          >
                                            View
                                          </Button>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => handleDeleteMemberDocument(doc.document_id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Worker ID (Optional) */}
                      {(() => {
                        const workerIdDocs = memberDocuments.filter(d => d.document_type === 'WORKER_ID');
                        return (
                          <div className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">Worker ID (Optional)</p>
                                  <p className="text-xs text-muted-foreground">
                                    {workerIdDocs.length > 0 ? `${workerIdDocs.length} document(s) uploaded` : "Not uploaded"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  ref={workerIdRef}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => handleMemberDocumentFileChange('WORKER_ID', 'front', e)}
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => workerIdRef.current?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Upload
                                </Button>
                              </div>
                            </div>
                            {workerIdDocs.length > 0 && (
                              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                                {workerIdDocs.map((doc) => (
                                  <div key={doc.document_id} className="relative">
                                    {doc.is_verified && (
                                      <Badge className="absolute top-2 right-2 z-10" variant="default">
                                        Verified
                                      </Badge>
                                    )}
                                    {doc.front_photo_url && (
                                      <>
                                        <img 
                                          src={getImageUrl(doc.front_photo_url)} 
                                          alt="Worker ID" 
                                          className="h-32 w-full object-contain rounded-lg border"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                        <div className="flex gap-2 mt-2">
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => window.open(getImageUrl(doc.front_photo_url), '_blank')}
                                          >
                                            View
                                          </Button>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => handleDeleteMemberDocument(doc.document_id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Registration Payment Receipts */}
                      {(() => {
                        const registrationReceiptDocs = memberDocuments.filter(d => d.document_type === 'REGISTRATION_RECEIPT');
                        return (
                          <div className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">Registration Payment Receipts</p>
                                  <p className="text-xs text-muted-foreground">
                                    {registrationReceiptDocs.length > 0 ? `${registrationReceiptDocs.length} receipt(s) uploaded` : "No receipts uploaded"}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Total: 2,500 ETB (1,000 ETB registration + 1,500 ETB for 5 shares @ 300 ETB each)
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  ref={registrationReceiptRef}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => handleMemberDocumentFileChange('REGISTRATION_RECEIPT', 'front', e)}
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => registrationReceiptRef.current?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Upload Receipts
                                </Button>
                              </div>
                            </div>
                            {registrationReceiptDocs.length > 0 && (
                              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                                {registrationReceiptDocs.map((doc) => (
                                  <div key={doc.document_id} className="relative">
                                    {doc.is_verified && (
                                      <Badge className="absolute top-2 right-2 z-10" variant="default">
                                        Verified
                                      </Badge>
                                    )}
                                    {doc.front_photo_url && (
                                      <>
                                        <img 
                                          src={getImageUrl(doc.front_photo_url)} 
                                          alt="Registration Receipt" 
                                          className="h-32 w-full object-contain rounded-lg border"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                        <div className="flex gap-2 mt-2">
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => window.open(getImageUrl(doc.front_photo_url), '_blank')}
                                          >
                                            View
                                          </Button>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => handleDeleteMemberDocument(doc.document_id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="beneficiaries" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Beneficiaries (Next of Kin)</CardTitle>
                        <CardDescription>Manage member beneficiaries</CardDescription>
                      </div>
                      <Button onClick={openAddBeneficiary}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Beneficiary
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingBeneficiaries ? (
                      <div className="text-center py-8">Loading beneficiaries...</div>
                    ) : !beneficiariesResponse?.data || beneficiariesResponse.data.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No beneficiaries added yet</p>
                        <Button variant="outline" className="mt-4" onClick={openAddBeneficiary}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add First Beneficiary
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {beneficiariesResponse.data.map((beneficiary) => (
                          <Card key={beneficiary.beneficiary_id} className="p-4">
                            <div className="flex items-start gap-4">
                              {beneficiary.profile_photo_url ? (
                                <Avatar className="h-16 w-16">
                                  <AvatarImage src={getImageUrl(beneficiary.profile_photo_url)} alt={beneficiary.full_name} />
                                  <AvatarFallback>{beneficiary.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                              ) : (
                                <Avatar className="h-16 w-16">
                                  <AvatarFallback>{beneficiary.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                              )}
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-semibold">{beneficiary.full_name}</h3>
                                    <p className="text-sm text-muted-foreground">{beneficiary.relationship}</p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {beneficiary.phone}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEditBeneficiary(beneficiary)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDeleteBeneficiary(beneficiary.beneficiary_id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                {(beneficiary.id_front_url || beneficiary.id_back_url) && (
                                  <div className="flex gap-2 pt-2 border-t">
                                    {beneficiary.id_front_url && (
                                      <Button variant="outline" size="sm" onClick={() => window.open(getImageUrl(beneficiary.id_front_url), '_blank')}>
                                        <FileText className="h-4 w-4 mr-1" />
                                        View ID Front
                                      </Button>
                                    )}
                                    {beneficiary.id_back_url && (
                                      <Button variant="outline" size="sm" onClick={() => window.open(getImageUrl(beneficiary.id_back_url), '_blank')}>
                                        <FileText className="h-4 w-4 mr-1" />
                                        View ID Back
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="emergency-contacts" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Emergency Contacts</CardTitle>
                        <CardDescription>Manage emergency contact information</CardDescription>
                      </div>
                      <Button onClick={openAddEmergencyContact}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Emergency Contact
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingEmergencyContacts ? (
                      <div className="text-center py-8">Loading emergency contacts...</div>
                    ) : emergencyContacts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No emergency contacts added yet</p>
                        <Button variant="outline" className="mt-4" onClick={openAddEmergencyContact}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add First Emergency Contact
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {emergencyContacts.map((contact) => (
                          <Card key={contact.emergency_contact_id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div>
                                  <h3 className="font-semibold">{contact.full_name}</h3>
                                  {contact.relationship && (
                                    <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                                  )}
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {contact.phone_number}
                                  </p>
                                  {(contact.subcity || contact.woreda || contact.kebele || contact.house_number) && (
                                    <div className="text-sm text-muted-foreground mt-2">
                                      <p className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {[
                                          contact.subcity,
                                          contact.woreda,
                                          contact.kebele,
                                          contact.house_number
                                        ].filter(Boolean).join(', ')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditEmergencyContact(contact)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteEmergencyContact(contact.emergency_contact_id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Beneficiary Dialog */}
      <Dialog open={beneficiaryDialogOpen} onOpenChange={setBeneficiaryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBeneficiary ? 'Edit Beneficiary' : 'Add Beneficiary'}</DialogTitle>
            <DialogDescription>
              {editingBeneficiary ? 'Update beneficiary information' : 'Add a new beneficiary (Next of Kin)'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="beneficiary_full_name">Full Name *</Label>
              <Input
                id="beneficiary_full_name"
                value={beneficiaryForm.full_name}
                onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beneficiary_relationship">Relationship *</Label>
              <Select
                value={beneficiaryForm.relationship}
                onValueChange={(value) => setBeneficiaryForm({ ...beneficiaryForm, relationship: value })}
              >
                <SelectTrigger id="beneficiary_relationship">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPOUSE">Spouse</SelectItem>
                  <SelectItem value="CHILD">Child</SelectItem>
                  <SelectItem value="PARENT">Parent</SelectItem>
                  <SelectItem value="SIBLING">Sibling</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="beneficiary_phone">Phone Number *</Label>
              <Input
                id="beneficiary_phone"
                value={beneficiaryForm.phone}
                onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, phone: e.target.value })}
                placeholder="+251911234567"
              />
            </div>
            
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Documents</h3>
              
              <div className="space-y-2">
                <Label>Profile Photo <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={beneficiaryProfileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleBeneficiaryFileChange('profile_photo', e)}
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => beneficiaryProfileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {beneficiaryFilePreviews.profile_photo || editingBeneficiary?.profile_photo_url ? 'Replace Photo' : 'Upload Photo'}
                  </Button>
                  {(beneficiaryFilePreviews.profile_photo || editingBeneficiary?.profile_photo_url) && (
                    <div className="relative">
                      <img
                        src={beneficiaryFilePreviews.profile_photo || getImageUrl(editingBeneficiary?.profile_photo_url)}
                        alt="Profile Preview"
                        className="h-20 w-20 rounded-full object-cover border-2"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => {
                          setBeneficiaryFilePreviews(prev => {
                            const newPreviews = { ...prev };
                            delete newPreviews.profile_photo;
                            return newPreviews;
                          });
                          if (beneficiaryProfileRef.current) beneficiaryProfileRef.current.value = '';
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>ID Card - Front <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={beneficiaryIdFrontRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleBeneficiaryFileChange('id_card_front', e)}
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => beneficiaryIdFrontRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {beneficiaryFilePreviews.id_card_front || editingBeneficiary?.id_front_url ? 'Replace ID Front' : 'Upload ID Front'}
                  </Button>
                  {(beneficiaryFilePreviews.id_card_front || editingBeneficiary?.id_front_url) && (
                    <div className="flex items-center gap-2">
                      <img
                        src={beneficiaryFilePreviews.id_card_front || getImageUrl(editingBeneficiary?.id_front_url)}
                        alt="ID Front Preview"
                        className="h-24 w-auto object-contain border rounded-lg"
                        onError={(e) => {
                          // If it's a PDF, show a PDF icon instead
                          const target = e.target as HTMLImageElement;
                          if (target.src.includes('.pdf') || !target.src.includes('http')) {
                            target.style.display = 'none';
                          }
                        }}
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(beneficiaryFilePreviews.id_card_front || getImageUrl(editingBeneficiary?.id_front_url), '_blank')}
                        >
                          <ImageIcon className="h-4 w-4 mr-1" />
                          View Full
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBeneficiaryFilePreviews(prev => {
                              const newPreviews = { ...prev };
                              delete newPreviews.id_card_front;
                              return newPreviews;
                            });
                            if (beneficiaryIdFrontRef.current) beneficiaryIdFrontRef.current.value = '';
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                {!editingBeneficiary && !beneficiaryFilePreviews.id_card_front && (
                  <p className="text-xs text-muted-foreground">Required for new beneficiaries</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>ID Card - Back <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={beneficiaryIdBackRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleBeneficiaryFileChange('id_card_back', e)}
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => beneficiaryIdBackRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {beneficiaryFilePreviews.id_card_back || editingBeneficiary?.id_back_url ? 'Replace ID Back' : 'Upload ID Back'}
                  </Button>
                  {(beneficiaryFilePreviews.id_card_back || editingBeneficiary?.id_back_url) && (
                    <div className="flex items-center gap-2">
                      <img
                        src={beneficiaryFilePreviews.id_card_back || getImageUrl(editingBeneficiary?.id_back_url)}
                        alt="ID Back Preview"
                        className="h-24 w-auto object-contain border rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src.includes('.pdf') || !target.src.includes('http')) {
                            target.style.display = 'none';
                          }
                        }}
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(beneficiaryFilePreviews.id_card_back || getImageUrl(editingBeneficiary?.id_back_url), '_blank')}
                        >
                          <ImageIcon className="h-4 w-4 mr-1" />
                          View Full
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBeneficiaryFilePreviews(prev => {
                              const newPreviews = { ...prev };
                              delete newPreviews.id_card_back;
                              return newPreviews;
                            });
                            if (beneficiaryIdBackRef.current) beneficiaryIdBackRef.current.value = '';
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                {!editingBeneficiary && !beneficiaryFilePreviews.id_card_back && (
                  <p className="text-xs text-muted-foreground">Required for new beneficiaries</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBeneficiaryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBeneficiarySubmit}>
              {editingBeneficiary ? 'Update' : 'Add'} Beneficiary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Dialog */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Account' : 'Create New Account'}</DialogTitle>
            <DialogDescription>
              {editingAccount ? 'Update account details' : 'Create a new account for this member'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="account_product_code">Account Product *</Label>
              <Select
                value={accountForm.product_code}
                onValueChange={(value) => setAccountForm({ ...accountForm, product_code: value as Account['product_code'] })}
              >
                <SelectTrigger id="account_product_code">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {activeAccountProducts.map((product) => (
                    <SelectItem key={product.product_code} value={product.product_code}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_currency">Currency *</Label>
              <Select
                value={accountForm.currency}
                onValueChange={(value) => setAccountForm({ ...accountForm, currency: value })}
              >
                <SelectTrigger id="account_currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETB">ETB - Ethiopian Birr</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedAccountProduct && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
                <p className="font-medium text-foreground">{selectedAccountProduct.name}</p>
                <div className="flex flex-wrap gap-3 text-muted-foreground">
                  <span>Kind: {selectedAccountProduct.product_kind}</span>
                  <span>Min Deposit: ETB {selectedAccountProduct.min_deposit.toLocaleString()}</span>
                  <span>Min Balance: ETB {selectedAccountProduct.min_balance.toLocaleString()}</span>
                </div>
                {selectedAccountProduct.withdrawal_policy && (
                  <p className="text-muted-foreground">{selectedAccountProduct.withdrawal_policy}</p>
                )}
              </div>
            )}
            {selectedAccountProduct?.guardian_required && (
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Guardian Name *</Label>
                  <Input
                    placeholder="Full name"
                    value={accountForm.guardian_name}
                    onChange={(e) => setAccountForm({ ...accountForm, guardian_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Relationship</Label>
                  <Input
                    placeholder="e.g., Parent"
                    value={accountForm.guardian_relationship}
                    onChange={(e) => setAccountForm({ ...accountForm, guardian_relationship: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    placeholder="+251..."
                    value={accountForm.guardian_phone}
                    onChange={(e) => setAccountForm({ ...accountForm, guardian_phone: e.target.value })}
                  />
                </div>
              </div>
            )}
            {selectedAccountProduct?.commodity_required && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Commodity Type *</Label>
                    <Input
                      placeholder={selectedAccountProduct.default_commodity_type || "e.g., Grain"}
                      value={accountForm.commodity_type}
                      onChange={(e) => setAccountForm({ ...accountForm, commodity_type: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 50"
                      value={accountForm.commodity_quantity}
                      onChange={(e) => setAccountForm({ ...accountForm, commodity_quantity: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Unit</Label>
                    <Input
                      placeholder="e.g., Kg, Quintal"
                      value={accountForm.commodity_unit}
                      onChange={(e) => setAccountForm({ ...accountForm, commodity_unit: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Estimated Value (ETB)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 2500"
                      value={accountForm.estimated_value}
                      onChange={(e) => setAccountForm({ ...accountForm, estimated_value: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
            {(selectedAccountProduct?.target_required || selectedAccountProduct?.product_kind === "MICRO") && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Target Amount (ETB) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 5000"
                    value={accountForm.target_amount}
                    onChange={(e) => setAccountForm({ ...accountForm, target_amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Target Date</Label>
                  <Input
                    type="date"
                    value={accountForm.target_date}
                    onChange={(e) => setAccountForm({ ...accountForm, target_date: e.target.value })}
                  />
                </div>
              </div>
            )}
            <div>
              <Label>Additional Notes</Label>
              <Textarea
                placeholder="Operational notes, guardian clarifications, etc."
                value={accountForm.additional_notes}
                onChange={(e) => setAccountForm({ ...accountForm, additional_notes: e.target.value })}
              />
            </div>
            {editingAccount && (
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Balance:</span>
                  <CurrencyDisplay amount={editingAccount.balance} className="font-semibold" />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lien Amount:</span>
                  <CurrencyDisplay amount={editingAccount.lien_amount} className="font-semibold" />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <StatusBadge status={editingAccount.status} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAccountSubmit}>
              {editingAccount ? 'Update' : 'Create'} Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Contact Dialog */}
      <Dialog open={emergencyContactDialogOpen} onOpenChange={setEmergencyContactDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEmergencyContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}</DialogTitle>
            <DialogDescription>
              {editingEmergencyContact ? 'Update emergency contact information' : 'Add a new emergency contact'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_full_name">Full Name *</Label>
              <Input
                id="emergency_full_name"
                value={emergencyContactForm.full_name}
                onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_phone">Phone Number *</Label>
              <Input
                id="emergency_phone"
                value={emergencyContactForm.phone_number}
                onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, phone_number: e.target.value })}
                placeholder="+251911234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_relationship">Relationship</Label>
              <Input
                id="emergency_relationship"
                value={emergencyContactForm.relationship}
                onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, relationship: e.target.value })}
                placeholder="e.g., Spouse, Parent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_subcity">Sub-City</Label>
                <Input
                  id="emergency_subcity"
                  value={emergencyContactForm.subcity}
                  onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, subcity: e.target.value })}
                  placeholder="Subcity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_woreda">Woreda</Label>
                <Input
                  id="emergency_woreda"
                  value={emergencyContactForm.woreda}
                  onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, woreda: e.target.value })}
                  placeholder="Woreda"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_kebele">Kebele</Label>
                <Input
                  id="emergency_kebele"
                  value={emergencyContactForm.kebele}
                  onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, kebele: e.target.value })}
                  placeholder="Kebele"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_house_number">House Number</Label>
                <Input
                  id="emergency_house_number"
                  value={emergencyContactForm.house_number}
                  onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, house_number: e.target.value })}
                  placeholder="House number"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmergencyContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEmergencyContactSubmit}>
              {editingEmergencyContact ? 'Update' : 'Add'} Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Member Loans Tab Component
const MemberLoansTab = ({ memberId }: { memberId: string }) => {
  const navigate = useNavigate();
  
  const { data: loansData, isLoading } = useQuery({
    queryKey: ['member-loans-all', memberId],
    queryFn: async () => {
      const res = await api.get<{ data: LoanApplication[] }>(`/loans?member_id=${memberId}&limit=100`);
      return res.data.data;
    },
    enabled: !!memberId
  });

  const loans = loansData || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Applications</CardTitle>
        <CardDescription>All loan applications for this member</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading loans...</div>
        ) : loans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No loan applications found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {loans.map((loan) => (
              <Card key={loan.loan_id} className="bg-card hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>{loan.workflow_status}</Badge>
                        <span className="text-sm font-medium">{loan.product_code}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Applied Amount</p>
                          <CurrencyDisplay amount={loan.applied_amount} className="font-semibold" />
                        </div>
                        {loan.approved_amount && (
                          <div>
                            <p className="text-muted-foreground">Approved Amount</p>
                            <CurrencyDisplay amount={loan.approved_amount} className="font-semibold" />
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">Term</p>
                          <p className="font-medium">{loan.term_months} months</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Interest</p>
                          <p className="font-medium">{loan.interest_rate}% ({loan.interest_type})</p>
                        </div>
                      </div>
                      {loan.outstanding_balance !== undefined && loan.outstanding_balance !== null && (
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Outstanding: </span>
                          <CurrencyDisplay amount={loan.outstanding_balance} className="font-semibold text-orange-700" />
                        </div>
                      )}
                      {loan.next_payment_date && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Next payment: {new Date(loan.next_payment_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/loans/${loan.loan_id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberDetail;
