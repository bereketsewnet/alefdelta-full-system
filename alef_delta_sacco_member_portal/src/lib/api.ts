// ALEF-DELTA SACCO API Client - Real Backend Integration
import type {
    Member,
    Account,
    Transaction,
    Loan,
    LoanScheduleItem,
    Request,
    Notification,
    KPISummary,
    AuthResponse,
  } from '@/types';
  
  // Get API base URL from environment variable
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://sacco-api.alefdelta.com/api';
  
  // Helper to get auth token (check both localStorage and sessionStorage)
  const getToken = () => {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  };
  
  // Helper to map product codes to account types
  function mapProductCodeToAccountType(productCode: string): Account['account_type'] {
    if (!productCode) return 'VOLUNTARY';
    
    const code = productCode.toUpperCase();
    
    if (code.includes('COMPULSORY') || code === 'SAV_COMPULSORY' || code === 'COMPULSORY') {
      return 'COMPULSORY';
    }
    if (code.includes('VOLUNTARY') || code === 'SAV_VOLUNTARY' || code === 'VOLUNTARY') {
      return 'VOLUNTARY';
    }
    if (code.includes('FIXED') || code === 'SAV_FIXED' || code === 'FIXED') {
      return 'FIXED';
    }
    if (code.includes('SHARE') || code.includes('CAPITAL') || code === 'SHR_CAP' || code === 'SHARE_CAPITAL') {
      return 'SHARE_CAPITAL';
    }
    
    // Default to voluntary for unknown types (ensures it's always a valid AccountType)
    return 'VOLUNTARY';
  }
  
  // Helper to map backend workflow status to frontend loan status
  function mapLoanStatus(workflowStatus: string): Loan['status'] {
    const statusMap: Record<string, Loan['status']> = {
      'PENDING': 'PENDING',
      'UNDER_REVIEW': 'UNDER_REVIEW',
      'APPROVED': 'APPROVED',
      'REJECTED': 'REJECTED',
      'DISBURSED': 'DISBURSED',
      'FULLY_PAID': 'FULLY_PAID',
    };
    
    return statusMap[workflowStatus] || 'PENDING';
  }
  
  // Helper to clear auth and redirect to login
  function clearAuthAndRedirect() {
    // Clear all auth data from both localStorage and sessionStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    localStorage.removeItem('auth-storage'); // Zustand persist key
    
    // Redirect to login page (only if not already on auth pages)
    const currentPath = window.location.pathname;
    if (currentPath !== '/auth/login' && 
        !currentPath.startsWith('/auth/') && 
        currentPath !== '/' &&
        currentPath !== '/partner-registration' &&
        currentPath !== '/loan-request') {
      // Use a small delay to allow any ongoing operations to complete
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 100);
    }
  }

  // Base fetch with auth
  async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = getToken();
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options?.headers,
        },
      });
    
      if (!response.ok) {
        // Handle 401 Unauthorized - clear credentials and redirect
        if (response.status === 401) {
          clearAuthAndRedirect();
          // Return a rejected promise with a silent error
          const silentError = new Error('Unauthorized');
          (silentError as any).silent = true; // Mark as silent to suppress console
          return Promise.reject(silentError);
        }
        
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || error.error?.message || 'Request failed');
      }
    
      return response.json();
    } catch (error: any) {
      // If it's a network error and we have a token, it might be auth-related
      if (error.name === 'TypeError' && token) {
        // Network error - could be CORS or connection issue, don't clear auth
        throw error;
      }
      throw error;
    }
  }
  
  // ============= MOCK DATA =============
  
  export const mockMember: Member = {
    id: '1',
    member_id: 'MEM-2024-001',
    first_name: 'Abebe',
    middle_name: 'Kebede',
    last_name: 'Tadesse',
    phone: '+251911234567',
    email: 'abebe.tadesse@email.com',
    gender: 'MALE',
    date_of_birth: '1985-03-15',
    national_id: 'ETH-1234567890',
    address: 'Addis Ababa, Bole Sub-city, Woreda 03',
    status: 'ACTIVE',
    telegram_chat_id: '123456789',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-12-01T14:30:00Z',
  };
  
  export const mockAccounts: Account[] = [
    {
      id: '1',
      account_number: 'SAV-2024-001-01',
      account_type: 'COMPULSORY',
      balance: 45000.00,
      lien_amount: 4500.00,
      available_balance: 40500.00,
      status: 'ACTIVE',
      interest_rate: 5.0,
      last_transaction_date: '2024-12-01T09:00:00Z',
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      account_number: 'SAV-2024-001-02',
      account_type: 'VOLUNTARY',
      balance: 125000.00,
      lien_amount: 0,
      available_balance: 125000.00,
      status: 'ACTIVE',
      interest_rate: 7.0,
      last_transaction_date: '2024-11-28T15:30:00Z',
      created_at: '2024-02-01T10:00:00Z',
    },
    {
      id: '3',
      account_number: 'SAV-2024-001-03',
      account_type: 'SHARE_CAPITAL',
      balance: 10000.00,
      lien_amount: 0,
      available_balance: 10000.00,
      status: 'ACTIVE',
      interest_rate: 0,
      created_at: '2024-01-15T10:00:00Z',
    },
  ];
  
  export const mockTransactions: Transaction[] = [
    {
      id: '1',
      transaction_id: 'TXN-2024-120101',
      account_id: '1',
      type: 'DEPOSIT',
      amount: 5000.00,
      balance_after: 45000.00,
      reference: 'Monthly contribution',
      performed_by: 'Teller: Marta G.',
      created_at: '2024-12-01T09:00:00Z',
    },
    {
      id: '2',
      transaction_id: 'TXN-2024-112801',
      account_id: '2',
      type: 'DEPOSIT',
      amount: 25000.00,
      balance_after: 125000.00,
      reference: 'Business savings',
      performed_by: 'Teller: Dawit K.',
      created_at: '2024-11-28T15:30:00Z',
    },
    {
      id: '3',
      transaction_id: 'TXN-2024-112501',
      account_id: '1',
      type: 'INTEREST',
      amount: 187.50,
      balance_after: 40000.00,
      reference: 'November 2024 Interest',
      performed_by: 'System',
      created_at: '2024-11-25T00:00:00Z',
    },
    {
      id: '4',
      transaction_id: 'TXN-2024-111501',
      account_id: '1',
      type: 'DEPOSIT',
      amount: 5000.00,
      balance_after: 39812.50,
      reference: 'Monthly contribution',
      performed_by: 'Teller: Marta G.',
      created_at: '2024-11-15T10:30:00Z',
    },
    {
      id: '5',
      transaction_id: 'TXN-2024-110101',
      account_id: '1',
      type: 'DEPOSIT',
      amount: 5000.00,
      balance_after: 34812.50,
      reference: 'Monthly contribution',
      performed_by: 'Teller: Marta G.',
      created_at: '2024-11-01T09:15:00Z',
    },
  ];
  
  export const mockLoans: Loan[] = [
    {
      id: '1',
      loan_id: 'LOAN-2024-001',
      product_name: 'Business Loan',
      applied_amount: 50000,
      approved_amount: 45000,
      interest_rate: 12,
      interest_type: 'DECLINING',
      term_months: 12,
      repayment_frequency: 'MONTHLY',
      monthly_installment: 4012.50,
      outstanding_balance: 32100.00,
      total_paid: 16090.00,
      total_interest: 2700.00,
      total_penalty: 0,
      status: 'APPROVED',
      purpose: 'Business expansion - purchasing new equipment',
      next_payment_date: '2025-01-03',
      days_overdue: 0,
      disbursed_at: '2024-09-03T10:00:00Z',
      created_at: '2024-08-25T14:00:00Z',
    },
    {
      id: '2',
      loan_id: 'LOAN-2024-002',
      product_name: 'Emergency Loan',
      applied_amount: 15000,
      approved_amount: 15000,
      interest_rate: 10,
      interest_type: 'FLAT',
      term_months: 6,
      repayment_frequency: 'MONTHLY',
      monthly_installment: 2750.00,
      outstanding_balance: 0,
      total_paid: 16500.00,
      total_interest: 1500.00,
      total_penalty: 0,
      status: 'FULLY_PAID',
      purpose: 'Medical emergency',
      days_overdue: 0,
      disbursed_at: '2024-03-15T10:00:00Z',
      created_at: '2024-03-10T09:00:00Z',
    },
  ];
  
  export const mockLoanSchedule: LoanScheduleItem[] = [
    { period: 1, due_date: '2024-10-03', principal: 3750.00, interest: 450.00, total_payment: 4200.00, balance_after: 41250.00, status: 'PAID' },
    { period: 2, due_date: '2024-11-03', principal: 3787.50, interest: 412.50, total_payment: 4200.00, balance_after: 37462.50, status: 'PAID' },
    { period: 3, due_date: '2024-12-03', principal: 3825.38, interest: 374.63, total_payment: 4200.00, balance_after: 33637.12, status: 'PAID' },
    { period: 4, due_date: '2025-01-03', principal: 3863.63, interest: 336.37, total_payment: 4200.00, balance_after: 29773.49, status: 'PENDING' },
    { period: 5, due_date: '2025-02-03', principal: 3902.27, interest: 297.73, total_payment: 4200.00, balance_after: 25871.22, status: 'PENDING' },
    { period: 6, due_date: '2025-03-03', principal: 3941.29, interest: 258.71, total_payment: 4200.00, balance_after: 21929.93, status: 'PENDING' },
    { period: 7, due_date: '2025-04-03', principal: 3980.71, interest: 219.30, total_payment: 4200.00, balance_after: 17949.23, status: 'PENDING' },
    { period: 8, due_date: '2025-05-03', principal: 4020.51, interest: 179.49, total_payment: 4200.00, balance_after: 13928.71, status: 'PENDING' },
    { period: 9, due_date: '2025-06-03', principal: 4060.72, interest: 139.29, total_payment: 4200.00, balance_after: 9867.99, status: 'PENDING' },
    { period: 10, due_date: '2025-07-03', principal: 4101.33, interest: 98.68, total_payment: 4200.00, balance_after: 5766.66, status: 'PENDING' },
    { period: 11, due_date: '2025-08-03', principal: 4142.34, interest: 57.67, total_payment: 4200.00, balance_after: 1624.32, status: 'PENDING' },
    { period: 12, due_date: '2025-09-03', principal: 1624.32, interest: 16.24, total_payment: 1640.56, balance_after: 0, status: 'PENDING' },
  ];
  
  export const mockRequests: Request[] = [
    {
      id: '1',
      request_id: 'REQ-2024-001',
      type: 'DEPOSIT',
      status: 'APPROVED',
      amount: 5000,
      description: 'Monthly contribution deposit',
      staff_notes: 'Verified and processed.',
      processed_by: 'Teller: Marta G.',
      created_at: '2024-12-01T08:30:00Z',
      processed_at: '2024-12-01T09:00:00Z',
    },
    {
      id: '2',
      request_id: 'REQ-2024-002',
      type: 'REPAYMENT',
      status: 'PENDING',
      amount: 4200,
      description: 'December loan repayment',
      created_at: '2024-12-02T10:00:00Z',
    },
  ];
  
  export const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Deposit Processed',
      message: 'Your deposit of ETB 5,000 has been processed to your Compulsory Savings account.',
      type: 'SUCCESS',
      read: false,
      resource_type: 'transaction',
      resource_id: '1',
      created_at: '2024-12-01T09:00:00Z',
    },
    {
      id: '2',
      title: 'Loan Payment Reminder',
      message: 'Your next loan payment of ETB 4,200 is due on January 3, 2025.',
      type: 'INFO',
      read: false,
      resource_type: 'loan',
      resource_id: '1',
      created_at: '2024-12-01T06:00:00Z',
    },
    {
      id: '3',
      title: 'Interest Posted',
      message: 'Monthly interest of ETB 187.50 has been credited to your Compulsory Savings account.',
      type: 'SUCCESS',
      read: true,
      resource_type: 'transaction',
      resource_id: '3',
      created_at: '2024-11-25T00:00:00Z',
    },
  ];
  
  export const mockKPISummary: KPISummary = {
    total_savings: 180000.00,
    loan_outstanding: 32100.00,
    next_payment_amount: 4200.00,
    next_payment_date: '2025-01-03',
    savings_change_percent: 8.5,
    total_accounts: 3,
    active_loans: 1,
  };
  
  // Chart data for sparklines
  export const mockSavingsHistory = [
    { month: 'Jul', amount: 140000 },
    { month: 'Aug', amount: 148000 },
    { month: 'Sep', amount: 155000 },
    { month: 'Oct', amount: 162000 },
    { month: 'Nov', amount: 172000 },
    { month: 'Dec', amount: 180000 },
  ];
  
  // ============= API ENDPOINTS (Real Backend Integration) =============
  
  export const api = {
    auth: {
      /**
       * Login with phone number and password
       * POST /api/auth/login
       */
      login: async (phone: string, password: string): Promise<AuthResponse> => {
        const response = await apiFetch<{
          accessToken: string;
          refreshToken: string;
          member: any;
        }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ 
            actor: 'MEMBER',  // Backend expects 'actor' not 'subject_type'
            identifier: phone, 
            password
          }),
        });
        
        // Backend returns 'member' object directly
        return {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          member: response.member as Member,
        };
      },
      
      /**
       * Request password reset OTP
       * POST /api/auth/request-otp
       */
      requestOtp: async (email: string): Promise<{ otp_req_id: string }> => {
        return apiFetch('/auth/request-otp', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
      },
      
      /**
       * Verify OTP and reset password
       * POST /api/auth/verify-otp
       */
      verifyOtp: async (otp_req_id: string, otp: string, new_password: string): Promise<void> => {
        await apiFetch('/auth/verify-otp', {
          method: 'POST',
          body: JSON.stringify({ otp_req_id, otp, new_password }),
        });
      },
      
      /**
       * Change password (authenticated)
       * POST /api/auth/change-password
       */
      changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        await apiFetch('/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ 
            current_password: currentPassword, 
            new_password: newPassword 
          }),
        });
      },
      
      /**
       * Refresh access token
       * POST /api/auth/refresh
       */
      refresh: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
        return apiFetch('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      },
    },
    
    client: {
      /**
       * Get current member profile
       * GET /api/client/me
       */
      getMe: async (): Promise<Member> => {
        const response = await apiFetch<{ member: Member }>('/client/me');
        return response.member;
      },
      
      /**
       * Get full member profile with summary
       * GET /api/client/me
       */
      getProfile: async (): Promise<{ member: Member; summary: any }> => {
        const response = await apiFetch<{ member: Member; summary: any }>('/client/me');
        return response;
      },
      
      /**
       * Get dashboard KPI summary
       * Note: This needs to be calculated from accounts and loans
       */
      getKPISummary: async (): Promise<KPISummary> => {
        // Get accounts and loans to calculate KPIs
        const [accounts, loans] = await Promise.all([
          api.client.getAccounts(),
          api.client.getLoans(),
        ]);
        
        // Calculate total savings
        const total_savings = accounts.reduce((sum, acc) => sum + acc.balance, 0);
        
        // Find active loans - use workflow_status from backend
        const activeLoans = loans.filter(l => {
          const status = (l as any).workflow_status || l.status;
          const isFullyPaid = (l as any).is_fully_paid || false;
          return (status === 'APPROVED' || status === 'DISBURSED') && !isFullyPaid;
        });
        
        // Calculate loan outstanding - sum of all outstanding balances
        const loan_outstanding = activeLoans.reduce((sum, loan) => {
          const balance = loan.outstanding_balance !== null && loan.outstanding_balance !== undefined
            ? Number(loan.outstanding_balance)
            : (loan.approved_amount ? Number(loan.approved_amount) : 0);
          return sum + balance;
        }, 0);
        
        // Get next payment info - find the earliest next payment date from all active loans
        const loansWithNextPayment = activeLoans
          .filter(l => l.next_payment_date && (!l.is_fully_paid || l.is_fully_paid === false))
          .sort((a, b) => {
            const dateA = a.next_payment_date ? new Date(a.next_payment_date).getTime() : Infinity;
            const dateB = b.next_payment_date ? new Date(b.next_payment_date).getTime() : Infinity;
            return dateA - dateB;
          });
        const nextLoan = loansWithNextPayment[0];
        
        return {
          total_savings,
          loan_outstanding,
          next_payment_amount: nextLoan?.monthly_installment || 0,
          next_payment_date: nextLoan?.next_payment_date || null,
          savings_change_percent: 0, // TODO: Calculate from historical data
          total_accounts: accounts.length,
          active_loans: activeLoans.length,
        };
      },
      
      /**
       * Get member accounts
       * GET /api/client/accounts
       */
      getAccounts: async (): Promise<Account[]> => {
        const response = await apiFetch<{ data: any[] }>('/client/accounts');
        
        // Transform backend response to match frontend types
        return response.data.map((account: any) => ({
          id: account.account_id,  // Backend uses account_id, frontend expects id
          account_number: account.product_code || account.account_id,  // Use product_code as account number
          account_type: mapProductCodeToAccountType(account.product_code),
          balance: Number(account.balance || 0),
          lien_amount: Number(account.lien_amount || 0),
          available_balance: Number(account.available_balance || 0),
          status: account.status as Account['status'],
          interest_rate: 0,  // TODO: Get from product configuration
          last_transaction_date: account.updated_at,
          created_at: account.created_at,
        }));
      },
      
      /**
       * Get all member transactions (across all accounts)
       * GET /api/client/transactions
       */
      getTransactions: async (
        page = 1,
        limit = 20
      ): Promise<{ data: Transaction[]; hasMore: boolean }> => {
        const offset = (page - 1) * limit;
        const response = await apiFetch<{ data: any[] }>(
          `/client/transactions?limit=${limit}&offset=${offset}`
        );
        
        // Transform backend response to match frontend Transaction type
        const transactions: Transaction[] = response.data.map((txn: any) => {
          // Construct full URL for receipt if it exists
          let receiptUrl = null;
          if (txn.receipt_photo_url || txn.receipt_url) {
            const receiptPath = txn.receipt_photo_url || txn.receipt_url;
            // If it's already a full URL, use it; otherwise construct from API base
            if (receiptPath.startsWith('http://') || receiptPath.startsWith('https://')) {
              receiptUrl = receiptPath;
            } else {
              // Extract API base URL (remove /api suffix) and construct full URL
              const apiUrl = new URL(API_BASE);
              const baseUrl = `${apiUrl.protocol}//${apiUrl.host}`;
              const normalizedPath = receiptPath.startsWith('/') ? receiptPath : `/${receiptPath}`;
              receiptUrl = `${baseUrl}${normalizedPath}`;
            }
          }
          
          // Determine transaction type - handle loan repayments
          let transactionType: Transaction['type'] = 'DEPOSIT';
          if (txn.source_type === 'LOAN_REPAYMENT' || txn.txn_type === 'LOAN_REPAYMENT') {
            transactionType = 'LOAN_REPAYMENT' as Transaction['type'];
          } else {
            transactionType = (txn.txn_type || txn.type || 'DEPOSIT') as Transaction['type'];
          }
          
          // Build description for loan repayments
          let description = txn.reference || '';
          if (txn.source_type === 'LOAN_REPAYMENT' || txn.txn_type === 'LOAN_REPAYMENT') {
            const loanCode = txn.product_code || '';
            const paymentMethod = txn.payment_method || 'CASH';
            description = `Loan Repayment${loanCode ? ` - ${loanCode}` : ''} (${paymentMethod})${txn.reference ? ` - Ref: ${txn.reference}` : ''}`;
          }
          
          return {
            id: txn.txn_id || txn.id,
            transaction_id: txn.txn_id || txn.transaction_id,
            account_id: txn.account_id,
            type: transactionType,
            amount: Number(txn.amount || 0),
            balance_after: Number(txn.balance_after || 0),
            reference: txn.reference || '',
            description: description,
            receipt_url: receiptUrl || undefined,
            performed_by: txn.performed_by_username 
              ? `${txn.performed_by_username}${txn.performed_by_role ? ` (${txn.performed_by_role.toLowerCase()})` : ''}`
              : txn.performed_by || 'System',
            created_at: txn.created_at,
            loan_id: txn.loan_id || undefined, // Include loan_id for loan repayments
          };
        });
        
        return {
          data: transactions,
          hasMore: response.data.length === limit,
        };
      },
      
      /**
       * Get account transactions
       * GET /api/client/accounts/:accountId/transactions
       */
      getAccountTransactions: async (
        accountId: string, 
        page = 1,
        limit = 20
      ): Promise<{ data: Transaction[]; hasMore: boolean }> => {
        const offset = (page - 1) * limit;
        const response = await apiFetch<{ data: any[] }>(
          `/client/accounts/${accountId}/transactions?limit=${limit}&offset=${offset}`
        );
        
        // Transform backend response to match frontend Transaction type
        const transactions: Transaction[] = response.data.map((txn: any) => {
          // Construct full URL for receipt if it exists
          let receiptUrl = null;
          if (txn.receipt_photo_url || txn.receipt_url) {
            const receiptPath = txn.receipt_photo_url || txn.receipt_url;
            // If it's already a full URL, use it; otherwise construct from API base
            if (receiptPath.startsWith('http://') || receiptPath.startsWith('https://')) {
              receiptUrl = receiptPath;
            } else {
              // Extract API base URL (remove /api suffix) and construct full URL
              // API_BASE is like: https://sacco-api.alefdelta.com/api
              // We need: https://sacco-api.alefdelta.com/uploads/...
              const apiUrl = new URL(API_BASE);
              const baseUrl = `${apiUrl.protocol}//${apiUrl.host}`; // https://sacco-api.alefdelta.com
              // Ensure receipt path starts with /
              const normalizedPath = receiptPath.startsWith('/') ? receiptPath : `/${receiptPath}`;
              receiptUrl = `${baseUrl}${normalizedPath}`;
            }
          }
          
          return {
            id: txn.txn_id || txn.id,
            transaction_id: txn.txn_id || txn.transaction_id,
            account_id: txn.account_id,
            type: (txn.txn_type || txn.type || 'DEPOSIT') as Transaction['type'],
            amount: Number(txn.amount || 0),
            balance_after: Number(txn.balance_after || 0),
            reference: txn.reference || '',
            description: txn.reference || '',
            receipt_url: receiptUrl || undefined,
            performed_by: txn.performed_by_username 
              ? `${txn.performed_by_username}${txn.performed_by_role ? ` (${txn.performed_by_role.toLowerCase()})` : ''}`
              : txn.performed_by || 'System',
            created_at: txn.created_at,
          };
        });
        
        return {
          data: transactions,
          hasMore: response.data.length === limit,
        };
      },
      
      /**
       * Get member loans
       * GET /api/client/loans
       */
      getLoans: async (): Promise<Loan[]> => {
        const response = await apiFetch<{ data: any[] }>('/client/loans');
        
        // Transform backend response to match frontend types
        return response.data.map((loan: any) => ({
          id: loan.loan_id,
          loan_id: loan.loan_id,
          product_name: loan.product_code || 'Loan',
          applied_amount: Number(loan.applied_amount || 0),
          approved_amount: Number(loan.approved_amount || 0),
          interest_rate: Number(loan.interest_rate || 0),
          interest_type: (loan.interest_type || 'DECLINING') as Loan['interest_type'],
          term_months: Number(loan.term_months || 0),
          repayment_frequency: 'MONTHLY' as Loan['repayment_frequency'],
          monthly_installment: Number(loan.monthly_installment || 0),
          outstanding_balance: Number(loan.outstanding_balance !== null && loan.outstanding_balance !== undefined 
            ? loan.outstanding_balance 
            : (loan.approved_amount || 0)),
          total_paid: Number(loan.total_paid || 0),
          total_interest: 0,
          total_penalty: Number(loan.total_penalty || 0),
          status: mapLoanStatus(loan.workflow_status),
          workflow_status: loan.workflow_status, // Keep original for filtering
          is_fully_paid: loan.is_fully_paid || false,
          purpose: loan.purpose || '',
          next_payment_date: loan.next_payment_date,
          days_overdue: 0,
          disbursed_at: loan.disbursement_date,
          created_at: loan.created_at,
        }));
      },
      
      /**
       * Get loan detail with schedule
       * GET /api/client/loans/:loanId/schedule
       */
      getLoanDetail: async (loanId: string): Promise<Loan & { schedule: LoanScheduleItem[] }> => {
        const response = await apiFetch<{ loan: Loan; schedule: any[] }>(
          `/client/loans/${loanId}/schedule`
        );
        
        // Map schedule items to match frontend types
        const schedule: LoanScheduleItem[] = (response.schedule || []).map((item: any) => ({
          period: item.period || 0,
          due_date: item.due_date || '',
          principal: Number(item.principal_component || item.principal || 0),
          interest: Number(item.interest_component || item.interest || 0),
          installment: Number(item.installment || 0),
          balance: Number(item.balance || 0),
          status: item.status || 'PENDING',
        }));
        
        // Ensure loan has all required numeric fields
        const loan = response.loan || {};
        return {
          ...loan,
          outstanding_balance: Number(loan.outstanding_balance !== null && loan.outstanding_balance !== undefined 
            ? loan.outstanding_balance 
            : (loan.approved_amount || 0)),
          monthly_installment: Number(loan.monthly_installment || 0),
          total_paid: Number(loan.total_paid || 0),
          total_interest: Number(loan.total_interest || 0),
          total_penalty: Number(loan.total_penalty || 0),
          schedule: schedule,
        };
      },
      
      /**
       * Get member requests
       * Note: This endpoint may not exist yet in backend
       * Falling back to empty array for now
       */
      getRequests: async (): Promise<Request[]> => {
        try {
          const response = await apiFetch<{ data: Request[] }>('/client/requests');
          return response.data;
        } catch (error) {
          // Silently fail - endpoint not implemented yet
          return [];
        }
      },
      
      /**
       * Create deposit request
       * POST /api/client/deposit-requests
       */
      createDepositRequest: async (payload: {
        account_id: string;
        amount: number;
        reference_number?: string;
        description?: string;
        receipt?: File;
      }): Promise<any> => {
        const formData = new FormData();
        formData.append('account_id', payload.account_id);
        formData.append('amount', payload.amount.toString());
        if (payload.reference_number) {
          formData.append('reference_number', payload.reference_number);
        }
        if (payload.description) {
          formData.append('description', payload.description);
        }
        if (payload.receipt) {
          formData.append('receipt', payload.receipt);
        }
        
        const token = getToken();
        const response = await fetch(`${API_BASE}/client/deposit-requests`, {
          method: 'POST',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: formData,
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            clearAuthAndRedirect();
            const silentError = new Error('Unauthorized');
            (silentError as any).silent = true;
            throw silentError;
          }
          const error = await response.json().catch(() => ({ message: 'Request failed' }));
          throw new Error(error.message || error.error?.message || 'Request failed');
        }
        
        return response.json();
      },
      
      /**
       * Get deposit requests
       * GET /api/client/deposit-requests
       */
      getDepositRequests: async (): Promise<any[]> => {
        const response = await apiFetch<{ data: any[] }>('/deposit-requests');
        return response.data;
      },
      
      /**
       * Create loan repayment request
       * POST /api/loan-repayment-requests
       */
      createLoanRepaymentRequest: async (payload: {
        loan_id: string;
        amount: number;
        payment_method?: string;
        bank_receipt_no: string;
        notes?: string;
        bank_receipt: File;
      }): Promise<any> => {
        const formData = new FormData();
        formData.append('loan_id', payload.loan_id);
        formData.append('amount', payload.amount.toString());
        if (payload.payment_method) {
          formData.append('payment_method', payload.payment_method);
        }
        formData.append('bank_receipt_no', payload.bank_receipt_no);
        if (payload.notes) {
          formData.append('notes', payload.notes);
        }
        formData.append('bank_receipt', payload.bank_receipt);
        
        const token = getToken();
        const response = await fetch(`${API_BASE}/loan-repayment-requests`, {
          method: 'POST',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: formData,
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            clearAuthAndRedirect();
            const silentError = new Error('Unauthorized');
            (silentError as any).silent = true;
            throw silentError;
          }
          const error = await response.json().catch(() => ({ message: 'Request failed' }));
          throw new Error(error.message || error.error?.message || 'Request failed');
        }
        
        return response.json();
      },
      
      /**
       * Get loan repayment requests
       * GET /api/loan-repayment-requests
       */
      getLoanRepaymentRequests: async (): Promise<any[]> => {
        const response = await apiFetch<{ data: any[] }>('/loan-repayment-requests');
        return response.data;
      },
      
      /**
       * Get loan requests
       * GET /api/loan-requests
       */
      getLoanRequests: async (): Promise<any[]> => {
        const response = await apiFetch<{ data: any[] }>('/loan-requests');
        return response.data;
      },
      
      /**
       * Get notifications
       * GET /api/client/notifications
       */
      getNotifications: async (filters?: { is_read?: boolean; limit?: number; offset?: number }): Promise<Notification[]> => {
        const params = new URLSearchParams();
        if (filters?.is_read !== undefined) {
          params.append('is_read', filters.is_read.toString());
        }
        if (filters?.limit) {
          params.append('limit', filters.limit.toString());
        }
        if (filters?.offset) {
          params.append('offset', filters.offset.toString());
        }
        const queryString = params.toString();
        const response = await apiFetch<{ data: Notification[] }>(
          `/client/notifications${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
      },
      
      /**
       * Get unread notification count
       * GET /api/client/notifications/unread-count
       */
      getUnreadNotificationCount: async (): Promise<number> => {
        const response = await apiFetch<{ count: number }>('/client/notifications/unread-count');
        return response.count;
      },
      
      /**
       * Mark notification as read
       * PUT /api/client/notifications/:notificationId/read
       */
      markNotificationAsRead: async (notificationId: string): Promise<void> => {
        await apiFetch(`/client/notifications/${notificationId}/read`, {
          method: 'PUT',
        });
      },
      
      /**
       * Mark all notifications as read
       * PUT /api/client/notifications/read-all
       */
      markAllNotificationsAsRead: async (): Promise<void> => {
        await apiFetch('/client/notifications/read-all', {
          method: 'PUT',
        });
      },
      
      /**
       * Delete notification
       * DELETE /api/client/notifications/:notificationId
       */
      deleteNotification: async (notificationId: string): Promise<void> => {
        await apiFetch(`/client/notifications/${notificationId}`, {
          method: 'DELETE',
        });
      },
      
      /**
       * Create a new request
       * Note: This endpoint may not exist yet in backend
       */
      createRequest: async (data: { 
        type: string; 
        amount?: number; 
        description: string;
        account_id?: string;
        loan_id?: string;
      }): Promise<Request> => {
        try {
          return await apiFetch<Request>('/client/requests', {
            method: 'POST',
            body: JSON.stringify(data),
          });
        } catch (error) {
          console.warn('Create request endpoint not available:', error);
          throw new Error('Request creation is not available yet. Please contact staff directly.');
        }
      },
      
      // NOTE: notifications helpers already exist earlier in this object (getNotifications/markNotificationAsRead/etc.)
    },
    
    uploads: {
      /**
       * Upload a file
       * POST /api/uploads
       */
      upload: async (file: File, type?: string): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        if (type) formData.append('type', type);
        
        const token = getToken();
        const response = await fetch(`${API_BASE}/uploads`, {
          method: 'POST',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: formData,
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            clearAuthAndRedirect();
            const silentError = new Error('Unauthorized');
            (silentError as any).silent = true;
            throw silentError;
          }
          const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
          throw new Error(errorData.message || `Upload failed: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
      },
    },
    
    /**
     * Public API methods (no authentication required)
     */
    public: {
      /**
       * Create a member registration request (self-registration)
       * POST /api/member-registration-requests
       */
      createRegistrationRequest: async (data: any): Promise<any> => {
        const response = await fetch(`${API_BASE}/member-registration-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Registration request failed' }));
          
          // Extract detailed validation errors
          if (error.details && Array.isArray(error.details)) {
            const validationErrors = error.details.map((detail: any) => {
              const field = detail.path?.join('.') || detail.context?.label || 'field';
              return `${field}: ${detail.message}`;
            }).join(', ');
            throw new Error(`Validation failed: ${validationErrors}`);
          }
          
          throw new Error(error.message || `Registration request failed: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
      },
      
      /**
       * Create a partner request (partnership or sponsorship)
       * POST /api/partner-requests
       */
      createPartnerRequest: async (data: any): Promise<any> => {
        const response = await fetch(`${API_BASE}/partner-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Partner request failed' }));
          
          // Extract detailed validation errors
          if (error.details && Array.isArray(error.details)) {
            const validationErrors = error.details.map((detail: any) => {
              const field = detail.path?.join('.') || detail.context?.label || 'field';
              return `${field}: ${detail.message}`;
            }).join(', ');
            throw new Error(`Validation failed: ${validationErrors}`);
          }
          
          throw new Error(error.message || `Partner request failed: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
      },
      
      /**
       * Create a loan request (public endpoint, can be called without auth)
       * POST /api/loan-requests
       */
      createLoanRequest: async (data: any): Promise<any> => {
        const token = getToken();
        const response = await fetch(`${API_BASE}/loan-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Loan request failed' }));
          
          // Extract detailed validation errors
          if (error.details && Array.isArray(error.details)) {
            const validationErrors = error.details.map((detail: any) => {
              const field = detail.path?.join('.') || detail.context?.label || 'field';
              return `${field}: ${detail.message}`;
            }).join(', ');
            throw new Error(`Validation failed: ${validationErrors}`);
          }
          
          throw new Error(error.message || `Loan request failed: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
      },
    },
  };
  
  export default api;
  