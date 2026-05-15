# ALEF-DELTA SACCO - Mock Data Reference

This document contains all mock data structures used in the Member Mini-App frontend. Backend developers should use these as reference for API response formats.

---

## Table of Contents
1. [Member](#member)
2. [Accounts](#accounts)
3. [Transactions](#transactions)
4. [Loans](#loans)
5. [Loan Schedule](#loan-schedule)
6. [Requests](#requests)
7. [Notifications](#notifications)
8. [KPI Summary](#kpi-summary)
9. [Chart Data](#chart-data)
10. [Auth Response](#auth-response)

---

## Member

Single member profile object.

```json
{
  "id": "1",
  "member_id": "MEM-2024-001",
  "first_name": "Abebe",
  "middle_name": "Kebede",
  "last_name": "Tadesse",
  "phone": "+251911234567",
  "email": "abebe.tadesse@email.com",
  "gender": "MALE",
  "date_of_birth": "1985-03-15",
  "national_id": "ETH-1234567890",
  "address": "Addis Ababa, Bole Sub-city, Woreda 03",
  "status": "ACTIVE",
  "telegram_chat_id": "123456789",
  "profile_photo": null,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-12-01T14:30:00Z"
}
```

### Member Status Enum
```typescript
type MemberStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'CLOSED';
```

### Gender Enum
```typescript
type Gender = 'MALE' | 'FEMALE';
```

---

## Accounts

Array of member savings accounts.

```json
[
  {
    "id": "1",
    "account_number": "SAV-2024-001-01",
    "account_type": "COMPULSORY",
    "balance": 45000.00,
    "lien_amount": 4500.00,
    "available_balance": 40500.00,
    "status": "ACTIVE",
    "interest_rate": 5.0,
    "last_transaction_date": "2024-12-01T09:00:00Z",
    "created_at": "2024-01-15T10:00:00Z"
  },
  {
    "id": "2",
    "account_number": "SAV-2024-001-02",
    "account_type": "VOLUNTARY",
    "balance": 125000.00,
    "lien_amount": 0,
    "available_balance": 125000.00,
    "status": "ACTIVE",
    "interest_rate": 7.0,
    "last_transaction_date": "2024-11-28T15:30:00Z",
    "created_at": "2024-02-01T10:00:00Z"
  },
  {
    "id": "3",
    "account_number": "SAV-2024-001-03",
    "account_type": "SHARE_CAPITAL",
    "balance": 10000.00,
    "lien_amount": 0,
    "available_balance": 10000.00,
    "status": "ACTIVE",
    "interest_rate": 0,
    "last_transaction_date": null,
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

### Account Type Enum
```typescript
type AccountType = 'COMPULSORY' | 'VOLUNTARY' | 'FIXED' | 'SHARE_CAPITAL';
```

### Account Status Enum
```typescript
type AccountStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';
```

### Business Rules
- `available_balance = balance - lien_amount`
- Members CANNOT withdraw (read-only)
- Deposits require staff approval via request system

---

## Transactions

Array of account transactions.

```json
[
  {
    "id": "1",
    "transaction_id": "TXN-2024-120101",
    "account_id": "1",
    "type": "DEPOSIT",
    "amount": 5000.00,
    "balance_after": 45000.00,
    "reference": "Monthly contribution",
    "description": null,
    "receipt_url": null,
    "performed_by": "Teller: Marta G.",
    "created_at": "2024-12-01T09:00:00Z"
  },
  {
    "id": "2",
    "transaction_id": "TXN-2024-112801",
    "account_id": "2",
    "type": "DEPOSIT",
    "amount": 25000.00,
    "balance_after": 125000.00,
    "reference": "Business savings",
    "performed_by": "Teller: Dawit K.",
    "created_at": "2024-11-28T15:30:00Z"
  },
  {
    "id": "3",
    "transaction_id": "TXN-2024-112501",
    "account_id": "1",
    "type": "INTEREST",
    "amount": 187.50,
    "balance_after": 40000.00,
    "reference": "November 2024 Interest",
    "performed_by": "System",
    "created_at": "2024-11-25T00:00:00Z"
  },
  {
    "id": "4",
    "transaction_id": "TXN-2024-111501",
    "account_id": "1",
    "type": "DEPOSIT",
    "amount": 5000.00,
    "balance_after": 39812.50,
    "reference": "Monthly contribution",
    "performed_by": "Teller: Marta G.",
    "created_at": "2024-11-15T10:30:00Z"
  },
  {
    "id": "5",
    "transaction_id": "TXN-2024-110101",
    "account_id": "1",
    "type": "DEPOSIT",
    "amount": 5000.00,
    "balance_after": 34812.50,
    "reference": "Monthly contribution",
    "performed_by": "Teller: Marta G.",
    "created_at": "2024-11-01T09:15:00Z"
  }
]
```

### Transaction Type Enum
```typescript
type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'INTEREST' | 'TRANSFER' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT' | 'FEE' | 'PENALTY';
```

---

## Loans

Array of member loans.

```json
[
  {
    "id": "1",
    "loan_id": "LOAN-2024-001",
    "product_name": "Business Loan",
    "applied_amount": 50000,
    "approved_amount": 45000,
    "interest_rate": 12,
    "interest_type": "DECLINING",
    "term_months": 12,
    "repayment_frequency": "MONTHLY",
    "monthly_installment": 4012.50,
    "outstanding_balance": 32100.00,
    "total_paid": 16090.00,
    "total_interest": 2700.00,
    "total_penalty": 0,
    "status": "APPROVED",
    "purpose": "Business expansion - purchasing new equipment",
    "next_payment_date": "2025-01-03",
    "days_overdue": 0,
    "disbursed_at": "2024-09-03T10:00:00Z",
    "created_at": "2024-08-25T14:00:00Z"
  },
  {
    "id": "2",
    "loan_id": "LOAN-2024-002",
    "product_name": "Emergency Loan",
    "applied_amount": 15000,
    "approved_amount": 15000,
    "interest_rate": 10,
    "interest_type": "FLAT",
    "term_months": 6,
    "repayment_frequency": "MONTHLY",
    "monthly_installment": 2750.00,
    "outstanding_balance": 0,
    "total_paid": 16500.00,
    "total_interest": 1500.00,
    "total_penalty": 0,
    "status": "FULLY_PAID",
    "purpose": "Medical emergency",
    "next_payment_date": null,
    "days_overdue": 0,
    "disbursed_at": "2024-03-15T10:00:00Z",
    "created_at": "2024-03-10T09:00:00Z"
  }
]
```

### Loan Status Enum
```typescript
type LoanStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'FULLY_PAID';
```

### Interest Type Enum
```typescript
type InterestType = 'FLAT' | 'DECLINING';
```

### Repayment Frequency Enum
```typescript
type RepaymentFrequency = 'MONTHLY' | 'WEEKLY' | 'QUARTERLY';
```

---

## Loan Schedule

Repayment schedule for a single loan.

```json
[
  {
    "period": 1,
    "due_date": "2024-10-03",
    "principal": 3750.00,
    "interest": 450.00,
    "total_payment": 4200.00,
    "balance_after": 41250.00,
    "status": "PAID"
  },
  {
    "period": 2,
    "due_date": "2024-11-03",
    "principal": 3787.50,
    "interest": 412.50,
    "total_payment": 4200.00,
    "balance_after": 37462.50,
    "status": "PAID"
  },
  {
    "period": 3,
    "due_date": "2024-12-03",
    "principal": 3825.38,
    "interest": 374.63,
    "total_payment": 4200.00,
    "balance_after": 33637.12,
    "status": "PAID"
  },
  {
    "period": 4,
    "due_date": "2025-01-03",
    "principal": 3863.63,
    "interest": 336.37,
    "total_payment": 4200.00,
    "balance_after": 29773.49,
    "status": "PENDING"
  }
]
```

### Schedule Status Enum
```typescript
type ScheduleStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
```

---

## Requests

Member-initiated write requests (require staff approval).

```json
[
  {
    "id": "1",
    "request_id": "REQ-2024-001",
    "type": "DEPOSIT",
    "status": "APPROVED",
    "amount": 5000,
    "description": "Monthly contribution deposit",
    "staff_notes": "Verified and processed.",
    "processed_by": "Teller: Marta G.",
    "created_at": "2024-12-01T08:30:00Z",
    "processed_at": "2024-12-01T09:00:00Z"
  },
  {
    "id": "2",
    "request_id": "REQ-2024-002",
    "type": "REPAYMENT",
    "status": "PENDING",
    "amount": 4200,
    "description": "December loan repayment",
    "staff_notes": null,
    "processed_by": null,
    "created_at": "2024-12-02T10:00:00Z",
    "processed_at": null
  }
]
```

### Request Type Enum
```typescript
type RequestType = 'DEPOSIT' | 'REPAYMENT' | 'PROFILE_UPDATE' | 'PASSWORD_RESET' | 'DOCUMENT_UPLOAD';
```

### Request Status Enum
```typescript
type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
```

### Business Rules
- ALL write actions create a request
- UI must NOT apply local changes until approved
- Staff must process all requests

---

## Notifications

System notifications for the member.

```json
[
  {
    "id": "1",
    "title": "Deposit Processed",
    "message": "Your deposit of ETB 5,000 has been processed to your Compulsory Savings account.",
    "type": "SUCCESS",
    "read": false,
    "resource_type": "transaction",
    "resource_id": "1",
    "created_at": "2024-12-01T09:00:00Z"
  },
  {
    "id": "2",
    "title": "Loan Payment Reminder",
    "message": "Your next loan payment of ETB 4,200 is due on January 3, 2025.",
    "type": "INFO",
    "read": false,
    "resource_type": "loan",
    "resource_id": "1",
    "created_at": "2024-12-01T06:00:00Z"
  },
  {
    "id": "3",
    "title": "Interest Posted",
    "message": "Monthly interest of ETB 187.50 has been credited to your Compulsory Savings account.",
    "type": "SUCCESS",
    "read": true,
    "resource_type": "transaction",
    "resource_id": "3",
    "created_at": "2024-11-25T00:00:00Z"
  }
]
```

### Notification Type Enum
```typescript
type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
```

---

## KPI Summary

Dashboard summary metrics.

```json
{
  "total_savings": 180000.00,
  "loan_outstanding": 32100.00,
  "next_payment_amount": 4200.00,
  "next_payment_date": "2025-01-03",
  "savings_change_percent": 8.5,
  "total_accounts": 3,
  "active_loans": 1
}
```

---

## Chart Data

Savings history for sparkline chart (last 6 months).

```json
[
  { "month": "Jul", "amount": 140000 },
  { "month": "Aug", "amount": 148000 },
  { "month": "Sep", "amount": 155000 },
  { "month": "Oct", "amount": 162000 },
  { "month": "Nov", "amount": 172000 },
  { "month": "Dec", "amount": 180000 }
]
```

---

## Auth Response

Login response format.

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "member": {
    "id": "1",
    "member_id": "MEM-2024-001",
    "first_name": "Abebe",
    "...": "..."
  }
}
```

---

## Currency Format

All monetary values are in **Ethiopian Birr (ETB)**.

Display format: `ETB XX,XXX.XX` (e.g., `ETB 45,000.00`)

The frontend uses `toLocaleString()` for formatting.

---

## Date Format

- All dates from API: **ISO 8601** format (`2024-12-01T09:00:00Z`)
- Date only fields: **YYYY-MM-DD** format (`2025-01-03`)
- Display format: `Dec 1, 2024` or `January 3, 2025`

---

## Pagination

For paginated endpoints (e.g., transactions):

**Request:**
```
GET /api/client/accounts/:id/transactions?page=1&limit=20&start=2024-01-01&end=2024-12-31
```

**Response:**
```json
{
  "data": [...],
  "hasMore": true,
  "page": 1,
  "totalPages": 5,
  "totalCount": 100
}
```
