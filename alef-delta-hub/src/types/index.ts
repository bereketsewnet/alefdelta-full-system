// Core Types based on ALEF-DELTA SACCO Spec

export type UserRole = "TELLER" | "CREDIT_OFFICER" | "MANAGER" | "ADMIN";

export type MemberType = "GOV_EMP" | "TRADER" | "NGO" | "FARMER" | "SELF";

export type MemberStatus = "PENDING" | "ACTIVE" | "DORMANT" | "SUSPENDED";

export type Gender = "M" | "F";

export type MaritalStatus = "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";

export type ProductCode = string;

export type AccountStatus = "ACTIVE" | "FROZEN" | "CLOSED";

export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "LOAN_DISBURSE"
  | "LOAN_REPAY"
  | "INTEREST"
  | "PENALTY"
  | "FEE";

export type LoanStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "REVIEW"
  | "APPROVED"
  | "DISBURSED"
  | "REJECTED"
  | "CLOSED"
  | "DEFAULT";

export type CollateralType = "VEHICLE" | "HOUSE" | "SALARY" | "SAVINGS";

export type InterestType = "FLAT" | "DECLINING";

// Member
export interface Member {
  member_id: string;
  membership_no: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  phone_primary: string;
  telegram_chat_id?: string;
  email?: string;
  gender: Gender;
  marital_status: MaritalStatus;
  age?: number;
  family_size_female?: number;
  family_size_male?: number;
  educational_level?: "PRIMARY" | "SECONDARY" | "DIPLOMA" | "DEGREE" | "MASTERS" | "PHD" | "NONE";
  occupation?: string;
  work_experience_years?: number;
  address_subcity: string;
  address_woreda: string;
  address_kebele?: string;
  address_area_name?: string;
  address_house_no: string;
  national_id_number?: string;
  shares_requested?: number;
  terms_accepted?: boolean;
  terms_accepted_at?: string;
  member_type: MemberType;
  monthly_income: number;
  tin_number?: string;
  status: MemberStatus;
  registered_date: string;
  profile_photo_url?: string;
  id_card_url?: string;
  id_card_front_url?: string;
  id_card_back_url?: string;
}

// Emergency Contact
export interface EmergencyContact {
  emergency_contact_id: string;
  member_id: string;
  full_name: string;
  subcity?: string;
  woreda?: string;
  kebele?: string;
  house_number?: string;
  phone_number: string;
  relationship?: string;
  created_at?: string;
  updated_at?: string;
}

// Member Document
export interface MemberDocument {
  document_id: string;
  member_id: string;
  document_type: "KEBELE_ID" | "DRIVER_LICENSE" | "PASSPORT" | "WORKER_ID" | "REGISTRATION_RECEIPT";
  document_number?: string;
  front_photo_url?: string;
  back_photo_url?: string;
  is_verified?: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Beneficiary
export interface Beneficiary {
  beneficiary_id: string;
  member_id: string;
  full_name: string;
  relationship: string;
  phone: string;
  profile_photo_url?: string;
  id_front_url?: string;
  id_back_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Account
export interface Account {
  account_id: string;
  member_id: string;
  product_code: ProductCode;
  balance: number;
  lien_amount: number;
  currency: string;
  status: AccountStatus;
  version: number;
  created_at: string;
  metadata?: AccountMetadata | null;
  available_balance?: number;
}

export interface AccountGuardianMetadata {
  name?: string | null;
  relationship?: string | null;
  phone?: string | null;
}

export interface AccountInKindMetadata {
  type?: string | null;
  quantity?: number | null;
  unit?: string | null;
  estimated_value?: number | null;
}

export interface AccountMicroMetadata {
  target_amount?: number | null;
  target_date?: string | null;
}

export interface AccountMetadata {
  guardian?: AccountGuardianMetadata;
  in_kind?: AccountInKindMetadata;
  micro?: AccountMicroMetadata;
  notes?: string | null;
  [key: string]: unknown;
}

// Transaction
export interface Transaction {
  txn_id: string;
  account_id: string;
  txn_type: TransactionType;
  amount: number;
  balance_after: number;
  reference: string;
  receipt_photo_url?: string;
  performed_by: string;
  created_at: string;
  idempotency_key: string;
  product_code?: string;
  performed_by_username?: string;
}

// Loan Product
export interface LoanProduct {
  code: string;
  name: string;
  interest_rate: number;
  interest_type: InterestType;
  min_term_months: number;
  max_term_months: number;
  penalty_rate: number;
  category?: string | null;
}

// Account Product
export interface AccountProduct {
  product_code: string;
  name: string;
  description?: string | null;
  category?: string | null;
  product_kind: "STANDARD" | "CHILDREN" | "IN_KIND" | "MICRO";
  is_active: boolean;
  guardian_required: boolean;
  commodity_required: boolean;
  target_required: boolean;
  default_commodity_type?: string | null;
  min_balance: number;
  min_deposit: number;
  interest_rate: number;
  withdrawal_policy?: string | null;
  metadata_schema?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Loan Application
export interface LoanApplication {
  loan_id: string;
  member_id: string;
  product_code: string;
  applied_amount: number;
  approved_amount: number;
  term_months: number;
  interest_rate: number;
  purpose_description: string;
  repayment_frequency: string;
  workflow_status: LoanStatus;
  disbursement_date?: string;
  next_payment_date?: string;
  created_at: string;
  updated_at: string;
}

// Guarantor
export interface Guarantor {
  id: string;
  guarantor_id: string;
  loan_id: string;
  full_name: string;
  phone: string;
  relationship?: string | null;
  address?: string | null;
  guaranteed_amount: number;
  duty_value?: number | null;
  id_front_url?: string | null;
  id_back_url?: string | null;
  profile_photo_url?: string | null;
}

// Collateral
export interface Collateral {
  id: string;
  loan_id: string;
  type: CollateralType;
  description: string;
  estimated_value: number;
  document_url?: string;
}

// User (Staff)
export interface User {
  user_id: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  status: "ACTIVE" | "DISABLED";
  branch?: string;
  active?: boolean;
  created_at?: string;
}

// Dashboard KPIs
export interface DashboardKPI {
  total_savings: number;
  total_loans_outstanding: number;
  loan_portfolio_trend?: number;
  loan_portfolio_trend_positive?: boolean;
  monthly_deposits: number;
  delinquency_rate: number;
  active_members: number;
  pending_approvals: number;
}

// Chart Data
export interface ChartDataPoint {
  name: string;
  value: number;
  label?: string;
}

// Eligibility Check Result
export interface EligibilityCheck {
  passed: boolean;
  membership_duration_check: boolean;
  active_status_check: boolean;
  savings_check: boolean;
  message?: string;
}

// Affordability Check Result
export interface AffordabilityCheck {
  passed: boolean;
  monthly_installment: number;
  max_installment: number;
  monthly_income: number;
  message?: string;
}
