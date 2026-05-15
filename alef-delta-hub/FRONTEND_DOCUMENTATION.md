# ALEF-DELTA SACCO - Frontend Documentation

## Overview
This document provides comprehensive documentation for the ALEF-DELTA SACCO Internal Staff Web Application frontend, built with Vite, React, TypeScript, and Tailwind CSS.

---

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Design System](#design-system)
3. [Application Structure](#application-structure)
4. [Routes & Pages](#routes--pages)
5. [Components](#components)
6. [Data Models](#data-models)
7. [Mock Data](#mock-data)
8. [API Contracts](#api-contracts)
9. [User Roles & Permissions](#user-roles--permissions)
10. [Business Logic](#business-logic)

---

## Technology Stack

### Core Technologies
- **Build Tool**: Vite
- **Framework**: React 18.3.1
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context API
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **UI Components**: shadcn/ui (Radix UI primitives)

### Key Dependencies
```json
{
  "@tanstack/react-query": "^5.83.0",
  "react-router-dom": "^6.30.1",
  "react-hook-form": "^7.61.1",
  "zod": "^3.25.76",
  "recharts": "^2.15.4",
  "lucide-react": "^0.462.0",
  "tailwindcss": "latest",
  "date-fns": "^3.6.0",
  "sonner": "^1.7.4"
}
```

---

## Design System

### Color Palette (HSL)
```css
/* Primary Colors */
--primary: 192 91% 28%;        /* Deep Teal */
--primary-foreground: 0 0% 98%;

/* Accent Colors */
--accent: 36 74% 58%;          /* Warm Gold */
--accent-foreground: 0 0% 13%;

/* Semantic Colors */
--success: 142 71% 45%;        /* Green */
--warning: 38 92% 50%;         /* Amber */
--destructive: 0 84% 60%;      /* Red */

/* Neutral Colors */
--background: 0 0% 100%;
--foreground: 222 47% 11%;
--card: 0 0% 100%;
--muted: 210 40% 96%;
--border: 214 32% 91%;
```

### Typography
- **Font Family**: System stack (Inter fallback)
- **Scale**: 
  - xs: 0.75rem (12px)
  - sm: 0.875rem (14px)
  - base: 1rem (16px)
  - lg: 1.125rem (18px)
  - xl: 1.25rem (20px)
  - 2xl: 1.5rem (24px)
  - 3xl: 1.875rem (30px)

### Spacing Scale
- 1: 0.25rem (4px)
- 2: 0.5rem (8px)
- 4: 1rem (16px)
- 6: 1.5rem (24px)
- 8: 2rem (32px)

---

## Application Structure

```
src/
├── components/
│   ├── dashboard/
│   │   └── KPICard.tsx             # Animated KPI display cards
│   ├── shared/
│   │   ├── DataTable.tsx           # Reusable paginated table
│   │   ├── StatusBadge.tsx         # Status indicator badges
│   │   ├── CurrencyDisplay.tsx     # Formatted currency display
│   │   └── ModernHeader.tsx        # Application header
│   └── ui/                         # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       └── ... (other UI primitives)
├── pages/
│   ├── Login.tsx                   # Authentication
│   ├── Dashboard.tsx               # Role-based dashboards
│   ├── Members.tsx                 # Member list
│   ├── MemberDetail.tsx            # Member profile
│   ├── NewMember.tsx               # Member registration
│   ├── Loans.tsx                   # Loan applications list
│   ├── LoanDetail.tsx              # Loan review & approval
│   ├── NewLoanApplication.tsx      # Loan application form
│   ├── NewTransaction.tsx          # Deposit/Withdrawal wizard
│   ├── AdminConfig.tsx             # Interest rate configuration
│   ├── UserManagement.tsx          # Staff management
│   ├── EndOfDay.tsx                # EOD process
│   ├── Reports.tsx                 # Report generation
│   ├── ManagerApprovals.tsx        # Loan approval queue
│   ├── MemberActivation.tsx        # Member activation
│   ├── CollateralManagement.tsx    # Collateral tracking
│   └── GuarantorManagement.tsx     # Guarantor tracking
├── lib/
│   ├── mockData.ts                 # Development seed data
│   ├── utils.ts                    # General utilities
│   └── utils/
│       └── financial.ts            # Financial calculations
├── types/
│   └── index.ts                    # TypeScript type definitions
└── App.tsx                         # Route configuration
```

---

## Routes & Pages

### Public Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | Login | Staff authentication |

### Protected Routes (All Roles)
| Route | Component | Description | Access |
|-------|-----------|-------------|--------|
| `/dashboard` | Dashboard | Role-specific dashboard | All |
| `/members` | Members | Member directory | All |
| `/members/:id` | MemberDetail | Member profile | All |
| `/loans/:id` | LoanDetail | Loan details | All |

### Teller Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/members/new` | NewMember | Register new member |
| `/transactions/new` | NewTransaction | Deposit/Withdrawal |

### Credit Officer Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/loans/new` | NewLoanApplication | Create loan application |
| `/collateral` | CollateralManagement | Manage collateral |
| `/guarantors` | GuarantorManagement | Manage guarantors |

### Manager Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/manager/approvals` | ManagerApprovals | Approve loans (Level 1) |
| `/manager/activation` | MemberActivation | Activate members |

### Admin Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/config` | AdminConfig | Configure interest rates |
| `/admin/users` | UserManagement | Manage staff |
| `/admin/eod` | EndOfDay | End of day process |
| `/reports` | Reports | Generate reports |

---

## Components

### Core Components

#### KPICard
**Location**: `src/components/dashboard/KPICard.tsx`

**Props**:
```typescript
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "accent";
}
```

**Usage**:
```tsx
<KPICard
  title="Total Savings"
  value={formatCurrency(2850000)}
  icon={Wallet}
  variant="success"
  trend={{ value: 12.3, isPositive: true }}
/>
```

#### DataTable
**Location**: `src/components/shared/DataTable.tsx`

**Props**:
```typescript
interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
}
```

**Usage**:
```tsx
<DataTable
  data={members}
  columns={[
    {
      key: "name",
      header: "Full Name",
      cell: (member) => `${member.first_name} ${member.last_name}`
    }
  ]}
  pageSize={10}
/>
```

#### StatusBadge
**Location**: `src/components/shared/StatusBadge.tsx`

**Props**:
```typescript
interface StatusBadgeProps {
  status: string;
  variant?: "default" | "success" | "warning" | "destructive" | "secondary" | "accent" | "primary";
}
```

#### CurrencyDisplay
**Location**: `src/components/shared/CurrencyDisplay.tsx`

**Props**:
```typescript
interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
}
```

---

## Data Models

### Core Types

#### User (Staff)
```typescript
interface User {
  user_id: string;
  full_name: string;
  email: string;
  role: "TELLER" | "CREDIT_OFFICER" | "MANAGER" | "ADMIN";
  branch?: string;
  active: boolean;
}
```

#### Member
```typescript
interface Member {
  member_id: string;
  membership_no: string;          // Format: AD-YYYY-NNNN
  first_name: string;
  middle_name: string;
  last_name: string;
  phone_primary: string;
  telegram_chat_id?: string;
  email?: string;
  gender: "M" | "F";
  marital_status: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
  address_subcity: string;
  address_woreda: string;
  address_house_no: string;
  member_type: "GOV_EMP" | "TRADER" | "NGO" | "FARMER" | "SELF";
  monthly_income: number;
  tin_number?: string;
  status: "PENDING" | "ACTIVE" | "DORMANT" | "SUSPENDED";
  registered_date: string;        // ISO 8601
  profile_photo_url?: string;
  id_card_url?: string;
}
```

#### Account
```typescript
interface Account {
  account_id: string;
  member_id: string;
  product_code: "SAV_COMPULSORY" | "SAV_VOLUNTARY" | "SAV_FIXED" | "SHR_CAP";
  balance: number;
  lien_amount: number;            // Frozen for loan guarantees
  currency: string;               // Default: "ETB"
  status: "ACTIVE" | "FROZEN" | "CLOSED";
  version: number;                // Optimistic locking
  created_at: string;
}
```

#### Transaction
```typescript
interface Transaction {
  txn_id: string;
  account_id: string;
  txn_type: "DEPOSIT" | "WITHDRAWAL" | "LOAN_DISBURSE" | "LOAN_REPAY" | "INTEREST" | "PENALTY" | "FEE";
  amount: number;
  balance_after: number;
  reference: string;
  performed_by: string;           // User ID
  created_at: string;
  idempotency_key: string;        // UUID for duplicate prevention
}
```

#### LoanProduct
```typescript
interface LoanProduct {
  code: string;                   // e.g., "L-EDU"
  name: string;
  interest_rate: number;          // Annual %
  interest_type: "FLAT" | "DECLINING";
  min_term_months: number;
  max_term_months: number;
  penalty_rate: number;           // % per month
  category: string;
}
```

#### LoanApplication
```typescript
interface LoanApplication {
  loan_id: string;
  member_id: string;
  product_code: string;
  applied_amount: number;
  approved_amount: number;
  term_months: number;
  interest_rate: number;
  purpose_description: string;
  repayment_frequency: string;
  workflow_status: "DRAFT" | "SUBMITTED" | "REVIEW" | "APPROVED" | "DISBURSED" | "REJECTED" | "CLOSED" | "DEFAULT";
  disbursement_date?: string;
  next_payment_date?: string;
  created_at: string;
  updated_at: string;
}
```

#### Guarantor
```typescript
interface Guarantor {
  id: string;
  loan_id: string;
  guarantor_member_id: string;
  guaranteed_amount: number;
  guarantor?: Member;             // Populated via JOIN
}
```

#### Collateral
```typescript
interface Collateral {
  id: string;
  loan_id: string;
  type: "VEHICLE" | "HOUSE" | "SALARY" | "SAVINGS";
  description: string;
  estimated_value: number;
  document_url?: string;
}
```

---

## Mock Data

### Loan Products (8 products)
```typescript
export const LOAN_PRODUCTS: LoanProduct[] = [
  {
    code: "L-EDU",
    name: "Education Loan",
    interest_rate: 12.5,
    interest_type: "FLAT",
    min_term_months: 6,
    max_term_months: 24,
    penalty_rate: 2.0,
    category: "Service"
  },
  // ... 7 more products
];
```

### Mock Users
```typescript
export const MOCK_USERS: User[] = [
  {
    user_id: "u1",
    full_name: "Abebe Kebede",
    email: "abebe.k@alefdelta.et",
    role: "TELLER",
    branch: "Head Office",
    active: true
  },
  // Includes: TELLER, CREDIT_OFFICER, MANAGER, ADMIN
];
```

### Mock Members (20+ members)
- Various member types (GOV_EMP, TRADER, etc.)
- Different statuses (ACTIVE, PENDING, SUSPENDED)
- Complete demographic data

### Mock Accounts
- Multiple account types per member
- Includes lien amounts for guaranteed loans

### Mock Loan Applications
- Various statuses (DRAFT, SUBMITTED, REVIEW, APPROVED)
- Different loan products

---

## API Contracts

### Authentication

#### POST /api/auth/login
**Request**:
```json
{
  "email": "user@alefdelta.et",
  "password": "password123"
}
```

**Response**:
```json
{
  "user": {
    "user_id": "u1",
    "full_name": "Abebe Kebede",
    "email": "abebe.k@alefdelta.et",
    "role": "TELLER",
    "branch": "Head Office",
    "active": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Members

#### GET /api/members
**Query Params**: `?page=1&limit=10&status=ACTIVE&search=name`

**Response**:
```json
{
  "data": [
    {
      "member_id": "M001",
      "membership_no": "AD-2023-0001",
      "first_name": "Almaz",
      "last_name": "Tadesse",
      "phone_primary": "+251911234567",
      "status": "ACTIVE",
      "registered_date": "2023-01-15T00:00:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 10
}
```

#### POST /api/members
**Request**:
```json
{
  "first_name": "John",
  "middle_name": "Middle",
  "last_name": "Doe",
  "phone_primary": "+251911000000",
  "email": "john@example.com",
  "gender": "M",
  "marital_status": "SINGLE",
  "address_subcity": "Bole",
  "address_woreda": "10",
  "address_house_no": "123",
  "member_type": "GOV_EMP",
  "monthly_income": 25000,
  "tin_number": "1234567890"
}
```

**Response**:
```json
{
  "member_id": "M156",
  "membership_no": "AD-2024-0156",
  "status": "PENDING"
}
```

#### GET /api/members/:id
**Response**: Full member object with accounts and beneficiaries

### Accounts

#### GET /api/accounts/:id
**Response**:
```json
{
  "account_id": "ACC-001",
  "member_id": "M001",
  "product_code": "SAV_COMPULSORY",
  "balance": 50000,
  "lien_amount": 10000,
  "available_balance": 40000,
  "currency": "ETB",
  "status": "ACTIVE",
  "version": 5,
  "created_at": "2023-01-15T10:00:00Z"
}
```

### Transactions

#### POST /api/transactions
**Headers**: 
- `Idempotency-Key: <UUID>`
- `Authorization: Bearer <token>`

**Request**:
```json
{
  "account_id": "ACC-001",
  "txn_type": "DEPOSIT",
  "amount": 5000,
  "reference": "Cash deposit",
  "expected_version": 5
}
```

**Response**:
```json
{
  "txn_id": "TXN-20240101-0001",
  "account_id": "ACC-001",
  "txn_type": "DEPOSIT",
  "amount": 5000,
  "balance_after": 55000,
  "performed_by": "u1",
  "created_at": "2024-01-01T14:30:00Z",
  "new_version": 6
}
```

**Error (Optimistic Lock)**:
```json
{
  "error": "VERSION_CONFLICT",
  "message": "Account has been modified. Please reload.",
  "current_version": 6,
  "your_version": 5
}
```

### Loans

#### POST /api/loans
**Request**:
```json
{
  "member_id": "M001",
  "product_code": "L-EDU",
  "applied_amount": 100000,
  "term_months": 12,
  "purpose_description": "University tuition fees",
  "repayment_frequency": "MONTHLY"
}
```

**Response**:
```json
{
  "loan_id": "L-2024-0001",
  "workflow_status": "DRAFT",
  "eligibility": {
    "passed": true,
    "membership_duration_check": true,
    "active_status_check": true,
    "savings_check": true
  },
  "affordability": {
    "passed": true,
    "monthly_installment": 9167,
    "max_installment": 8333,
    "monthly_income": 25000
  }
}
```

#### PATCH /api/loans/:id/approve
**Request**:
```json
{
  "approved_amount": 100000,
  "audit_note": "Approved based on strong credit history",
  "approved_by": "u3"
}
```

**Response**:
```json
{
  "loan_id": "L-2024-0001",
  "workflow_status": "APPROVED",
  "approved_amount": 100000,
  "lien_updates": [
    {
      "guarantor_member_id": "M002",
      "account_id": "ACC-002",
      "lien_amount": 50000
    }
  ]
}
```

### Reports

#### POST /api/reports/generate
**Request**:
```json
{
  "report_type": "transactions",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "format": "pdf",
  "branch": "all"
}
```

**Response**:
```json
{
  "report_url": "https://storage.alefdelta.et/reports/transactions-2024-01.pdf",
  "expires_at": "2024-02-01T00:00:00Z"
}
```

---

## User Roles & Permissions

### Role Capabilities Matrix

| Feature | TELLER | CREDIT_OFFICER | MANAGER | ADMIN |
|---------|--------|----------------|---------|-------|
| Create Member | ✅ | ✅ | ✅ | ✅ |
| View Members | ✅ | ✅ | ✅ | ✅ |
| Activate Member | ❌ | ❌ | ✅ | ✅ |
| Cash Deposit/Withdrawal | ✅ | ❌ | ✅ | ✅ |
| Create Loan Application | ❌ | ✅ | ✅ | ✅ |
| Verify Collateral | ❌ | ✅ | ✅ | ✅ |
| Approve Loan (Level 1) | ❌ | ❌ | ✅ | ✅ |
| Configure Interest Rates | ❌ | ❌ | ❌ | ✅ |
| User Management | ❌ | ❌ | ❌ | ✅ |
| End of Day Process | ❌ | ❌ | ❌ | ✅ |
| Generate Reports | ❌ | ✅ | ✅ | ✅ |

### Dashboard Views

#### Teller Dashboard
- Today's Deposits/Withdrawals
- Cash Drawer Balance
- Pending Receipts
- Quick Actions: Deposit, Withdrawal, Find Member

#### Credit Officer Dashboard
- Pending Reviews Count
- Monthly Applications Processed
- Portfolio Value
- Default Rate
- Loan Applications Queue

#### Manager Dashboard
- Pending Approvals
- Active Members Trend
- Total Savings Trend
- Loan Portfolio Growth
- Monthly Transaction Charts
- Loan Status Distribution (Pie)
- Quick Actions: Loan Approvals, Member Activation, Override Limits

#### Admin Dashboard
- Total Savings
- Loans Outstanding
- Active Members
- Delinquency Rate
- System Controls: Config Rates, User Management, EOD, Reports

---

## Business Logic

### Financial Calculations

#### Available Balance
```typescript
const available_balance = balance - lien_amount;
```

#### Flat Interest Calculation
```typescript
function calculateFlatInterest(
  principal: number,
  annualRate: number,
  termMonths: number
): { totalInterest: number; monthlyPayment: number } {
  const totalInterest = (principal * annualRate * termMonths) / (12 * 100);
  const monthlyPayment = (principal + totalInterest) / termMonths;
  return { totalInterest, monthlyPayment };
}
```

#### Declining Balance Interest
```typescript
function calculateDecliningInterest(
  principal: number,
  annualRate: number,
  termMonths: number
): { totalInterest: number; monthlyPayment: number } {
  const monthlyRate = annualRate / 12 / 100;
  const monthlyPayment = 
    (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  const totalInterest = monthlyPayment * termMonths - principal;
  return { totalInterest, monthlyPayment };
}
```

### Gatekeeper (Eligibility Checks)

```typescript
interface EligibilityCheck {
  passed: boolean;
  membership_duration_check: boolean;  // ≥6 months
  active_status_check: boolean;        // status === "ACTIVE"
  savings_check: boolean;              // compulsory_balance ≥ 10% of loan
  message?: string;
}

function checkEligibility(
  member: Member,
  accounts: Account[],
  loanAmount: number
): EligibilityCheck {
  const membershipMonths = // Calculate from registered_date
  const compulsoryAccount = accounts.find(a => a.product_code === "SAV_COMPULSORY");
  
  const checks = {
    membership_duration_check: membershipMonths >= 6,
    active_status_check: member.status === "ACTIVE",
    savings_check: compulsoryAccount && compulsoryAccount.balance >= loanAmount * 0.1
  };
  
  const passed = Object.values(checks).every(Boolean);
  
  return {
    ...checks,
    passed,
    message: passed ? "Eligible" : "Requirements not met"
  };
}
```

### Affordability Check (1/3 Rule)

```typescript
interface AffordabilityCheck {
  passed: boolean;
  monthly_installment: number;
  max_installment: number;  // 1/3 of monthly_income
  monthly_income: number;
  message?: string;
}

function checkAffordability(
  monthlyIncome: number,
  loanAmount: number,
  termMonths: number,
  annualRate: number,
  interestType: "FLAT" | "DECLINING"
): AffordabilityCheck {
  const calc = interestType === "FLAT" 
    ? calculateFlatInterest(loanAmount, annualRate, termMonths)
    : calculateDecliningInterest(loanAmount, annualRate, termMonths);
    
  const maxInstallment = monthlyIncome / 3;
  const passed = calc.monthlyPayment <= maxInstallment;
  
  return {
    passed,
    monthly_installment: calc.monthlyPayment,
    max_installment: maxInstallment,
    monthly_income: monthlyIncome,
    message: passed ? "Affordable" : "Exceeds 1/3 of monthly income"
  };
}
```

### Idempotency Key Generation

```typescript
function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

### Withdrawal Validation

```typescript
function validateWithdrawal(
  balance: number,
  lienAmount: number,
  withdrawalAmount: number
): { valid: boolean; message: string } {
  const available = balance - lienAmount;
  
  if (withdrawalAmount > available) {
    return {
      valid: false,
      message: `Insufficient available balance. Available: ${formatCurrency(available)}`
    };
  }
  
  return { valid: true, message: "OK" };
}
```

---

## Workflow States

### Member Workflow
```
PENDING → ACTIVE → [DORMANT | SUSPENDED]
```

### Loan Workflow
```
DRAFT → SUBMITTED → REVIEW → [APPROVED | REJECTED]
                              ↓
                           DISBURSED → [CLOSED | DEFAULT]
```

### Transaction Flow
1. **Teller**: Select member → Select account → Enter amount
2. **System**: Check available balance
3. **Teller**: Confirm transaction
4. **System**: Generate idempotency key → POST to API
5. **Backend**: Verify idempotency → Update balance (optimistic lock) → Return new version
6. **Frontend**: Show success toast → Refresh account data

---

## Error Handling

### Optimistic Lock Conflict
```typescript
// When transaction fails due to version mismatch:
toast.error("Account was modified by another user. Please reload.");

// Show modal with:
- Current data from server
- User's attempted action
- Options: Reload | Cancel
```

### Idempotency Duplicate
```typescript
// When idempotency key already exists:
toast.warning("This transaction was already processed.");
// Return existing transaction result
```

---

## State Management Strategy

### Server State (React Query)
- Member lists
- Account data
- Loan applications
- Transactions
- Dashboard KPIs

### Local State (useState/Context)
- Current user session
- Form data (react-hook-form)
- UI state (modals, filters)

---

## Form Validation Examples

### New Member Form (Zod)
```typescript
const memberSchema = z.object({
  first_name: z.string().min(2).max(50),
  phone_primary: z.string().regex(/^\+251[97]\d{8}$/),
  email: z.string().email().optional(),
  monthly_income: z.number().min(0),
  member_type: z.enum(["GOV_EMP", "TRADER", "NGO", "FARMER", "SELF"])
});
```

### Transaction Form
```typescript
const transactionSchema = z.object({
  account_id: z.string().uuid(),
  amount: z.number().min(1),
  txn_type: z.enum(["DEPOSIT", "WITHDRAWAL"])
}).refine((data) => {
  if (data.txn_type === "WITHDRAWAL") {
    return data.amount <= availableBalance;
  }
  return true;
}, {
  message: "Insufficient available balance",
  path: ["amount"]
});
```

---

## Responsive Breakpoints

```typescript
// Desktop: ≥1280px
// Tablet: 768px - 1279px
// Mobile: <768px

// Tailwind classes:
// md:grid-cols-2   → 2 columns on tablet+
// lg:grid-cols-4   → 4 columns on desktop
```

---

## Accessibility Features

- Keyboard navigation in all modals
- ARIA labels on all interactive elements
- Focus management in dialogs
- Screen reader support for status badges
- Color contrast ≥ WCAG AA

---

## Performance Optimizations

- Lazy loading for chart components
- Skeleton loaders for async data
- Pagination on large tables
- Debounced search inputs
- React Query caching (5 minutes default)

---

## Testing Credentials

```typescript
// Teller
Email: abebe.k@alefdelta.et
Password: teller123

// Credit Officer
Email: marta.h@alefdelta.et
Password: officer123

// Manager
Email: dawit.m@alefdelta.et
Password: manager123

// Admin
Email: admin@alefdelta.et
Password: admin123
```

---

## Backend Integration Checklist

### Required API Endpoints
- [ ] POST /api/auth/login
- [ ] GET /api/members
- [ ] POST /api/members
- [ ] GET /api/members/:id
- [ ] PATCH /api/members/:id
- [ ] GET /api/accounts/:id
- [ ] GET /api/accounts/:id/transactions
- [ ] POST /api/transactions (with Idempotency-Key header)
- [ ] GET /api/loans
- [ ] POST /api/loans
- [ ] GET /api/loans/:id
- [ ] PATCH /api/loans/:id/submit
- [ ] PATCH /api/loans/:id/approve
- [ ] PATCH /api/loans/:id/reject
- [ ] POST /api/reports/generate
- [ ] GET /api/dashboard/kpis
- [ ] POST /api/admin/eod/run
- [ ] GET /api/admin/config/loan-products
- [ ] PATCH /api/admin/config/loan-products/:code

### Required Headers
- `Authorization: Bearer <jwt-token>`
- `Idempotency-Key: <uuid>` (for POST transactions)
- `Content-Type: application/json`

### Required Validations
- Optimistic locking (version field)
- Idempotency key uniqueness
- Available balance checks
- Role-based access control
- Input sanitization

---

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_UPLOAD_MAX_SIZE=5242880  # 5MB
```

---

## Deployment Considerations

- Build command: `npm run build`
- Output directory: `dist/`
- Requires Node.js 18+
- Environment-specific API URLs
- CDN for static assets recommended

---

## Future Enhancements (Not in Scope)

- Real-time notifications via WebSocket
- Mobile app (React Native)
- Biometric authentication
- Advanced analytics dashboard
- Bulk operations
- CSV import/export

---

## Contact & Support

For backend integration questions, refer to:
- **API Spec**: `ALEF-DELTA_SACCO_MANAGEMENT_SYSTEM.pdf`
- **This Document**: Complete UI contracts and sample data

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: ALEF-DELTA Development Team
