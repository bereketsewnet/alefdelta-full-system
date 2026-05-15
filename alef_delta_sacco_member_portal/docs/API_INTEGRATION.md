# ALEF-DELTA SACCO - API Integration Specification

Complete API documentation for backend integration. This document describes all endpoints the frontend expects, request/response formats, and business rules.

---

## Table of Contents
1. [Base Configuration](#base-configuration)
2. [Authentication](#authentication)
3. [Member Profile](#member-profile)
4. [Accounts](#accounts)
5. [Transactions](#transactions)
6. [Loans](#loans)
7. [Requests](#requests)
8. [Notifications](#notifications)
9. [File Uploads](#file-uploads)
10. [Error Handling](#error-handling)
11. [Business Rules](#business-rules)

---

## Base Configuration

### Base URL
```
Production: https://api.alef-delta.com/api
Development: http://localhost:3000/api
```

### Headers

All authenticated requests must include:
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Response Format

All responses follow this structure:

**Success:**
```json
{
  "data": { ... },
  "message": "Success"
}
```

**Error:**
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

---

## Authentication

### POST /api/auth/login

Login with phone number and password.

**Request:**
```json
{
  "phone": "+251911234567",
  "password": "password123",
  "remember_me": true
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "member": {
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
}
```

**Error Responses:**
- `401` - Invalid phone number or password
- `403` - Account suspended/inactive
- `429` - Too many login attempts

---

### POST /api/auth/request-otp

Request password reset OTP via email.

**Request:**
```json
{
  "email": "abebe.tadesse@email.com"
}
```

**Response (200):**
```json
{
  "otp_req_id": "otp-uuid-12345",
  "message": "OTP sent to email",
  "expires_at": "2024-12-04T10:15:00Z"
}
```

**UI Behavior:**
- Show success message: "Check your email for the reset code"
- Store `otp_req_id` for verification step
- Show countdown timer (5 minutes)

---

### POST /api/auth/verify-otp

Verify OTP and reset password.

**Request:**
```json
{
  "otp_req_id": "otp-uuid-12345",
  "otp": "123456",
  "new_password": "newSecurePassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful"
}
```

---

### POST /api/auth/change-password

Change password (authenticated).

**Request:**
```json
{
  "current_password": "oldPassword123",
  "new_password": "newSecurePassword456"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400` - Current password incorrect
- `400` - New password doesn't meet requirements

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one number

---

### POST /api/auth/refresh

Refresh access token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "new-access-token...",
  "refreshToken": "new-refresh-token..."
}
```

---

## Member Profile

### GET /api/client/me

Get current member profile and summary.

**Response (200):**
```json
{
  "member": {
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
    "profile_photo": "https://storage.example.com/photos/member-1.jpg",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-12-01T14:30:00Z"
  }
}
```

---

### GET /api/client/kpi

Get dashboard KPI summary.

**Response (200):**
```json
{
  "total_savings": 180000.00,
  "loan_outstanding": 32100.00,
  "next_payment_amount": 4200.00,
  "next_payment_date": "2025-01-03",
  "savings_change_percent": 8.5,
  "total_accounts": 3,
  "active_loans": 1,
  "savings_history": [
    { "month": "Jul", "amount": 140000 },
    { "month": "Aug", "amount": 148000 },
    { "month": "Sep", "amount": 155000 },
    { "month": "Oct", "amount": 162000 },
    { "month": "Nov", "amount": 172000 },
    { "month": "Dec", "amount": 180000 }
  ]
}
```

**UI Usage:**
- `total_savings` → Main KPI card
- `loan_outstanding` → Secondary KPI
- `next_payment_amount` + `next_payment_date` → Payment reminder card
- `savings_change_percent` → Trend indicator (↑ 8.5%)
- `savings_history` → Sparkline chart data

---

## Accounts

### GET /api/client/accounts

Get all member accounts.

**Response (200):**
```json
{
  "data": [
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
    }
  ]
}
```

**Account Types:**
| Type | Description |
|------|-------------|
| `COMPULSORY` | Mandatory monthly savings |
| `VOLUNTARY` | Optional additional savings |
| `FIXED` | Fixed-term deposit |
| `SHARE_CAPITAL` | Membership shares |

---

## Transactions

### GET /api/client/accounts/:accountId/transactions

Get account transactions with pagination and filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `start` | string | Start date (YYYY-MM-DD) |
| `end` | string | End date (YYYY-MM-DD) |
| `type` | string | Filter by transaction type |

**Example Request:**
```
GET /api/client/accounts/1/transactions?page=1&limit=20&start=2024-11-01&end=2024-12-31
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "1",
      "transaction_id": "TXN-2024-120101",
      "account_id": "1",
      "type": "DEPOSIT",
      "amount": 5000.00,
      "balance_after": 45000.00,
      "reference": "Monthly contribution",
      "description": null,
      "receipt_url": "https://storage.example.com/receipts/txn-1.pdf",
      "performed_by": "Teller: Marta G.",
      "created_at": "2024-12-01T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "totalCount": 100,
    "hasMore": true
  }
}
```

**Transaction Types:**
| Type | Description |
|------|-------------|
| `DEPOSIT` | Money added to account |
| `WITHDRAWAL` | Money withdrawn (staff only) |
| `INTEREST` | Interest credited |
| `TRANSFER` | Between accounts |
| `LOAN_DISBURSEMENT` | Loan amount credited |
| `LOAN_REPAYMENT` | Loan payment deducted |
| `FEE` | Service fees |
| `PENALTY` | Penalty charges |

---

### GET /api/client/accounts/:accountId/transactions/export

Export transactions as CSV.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `start` | string | Start date (required) |
| `end` | string | End date (required) |
| `format` | string | `csv` or `pdf` |

**Response:**
Returns file download with appropriate Content-Type header.

---

## Loans

### GET /api/client/loans

Get all member loans.

**Response (200):**
```json
{
  "data": [
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
      "purpose": "Business expansion",
      "next_payment_date": "2025-01-03",
      "days_overdue": 0,
      "disbursed_at": "2024-09-03T10:00:00Z",
      "created_at": "2024-08-25T14:00:00Z"
    }
  ]
}
```

**Loan Status:**
| Status | Description | UI Treatment |
|--------|-------------|--------------|
| `PENDING` | Application submitted | Yellow badge |
| `UNDER_REVIEW` | Being reviewed | Blue badge |
| `APPROVED` | Approved, awaiting disbursement | Green badge |
| `REJECTED` | Application rejected | Red badge |
| `DISBURSED` | Active loan | Primary badge |
| `FULLY_PAID` | Completed | Gray badge |

---

### GET /api/client/loans/:loanId

Get loan detail with repayment schedule.

**Response (200):**
```json
{
  "loan": {
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
  "schedule": [
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
      "status": "OVERDUE"
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
  ],
  "penalty_calculation": {
    "days_overdue": 1,
    "penalty_rate": 0.5,
    "penalty_amount": 21.00,
    "message": "Penalty of ETB 21.00 applies (0.5% per day)"
  }
}
```

**Schedule Status:**
| Status | Description | UI Treatment |
|--------|-------------|--------------|
| `PENDING` | Future payment | Default style |
| `PAID` | Completed payment | Green checkmark |
| `OVERDUE` | Past due | Red highlight |
| `PARTIAL` | Partially paid | Yellow indicator |

---

## Requests

### GET /api/client/requests

Get member's submitted requests.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `type` | string | Filter by type |

**Response (200):**
```json
{
  "data": [
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
}
```

---

### POST /api/client/requests

Create a new request.

**Request Types:**

#### Deposit Request
```json
{
  "type": "DEPOSIT",
  "account_id": "1",
  "amount": 5000,
  "description": "Monthly contribution deposit"
}
```

#### Repayment Request
```json
{
  "type": "REPAYMENT",
  "loan_id": "1",
  "amount": 4200,
  "description": "December loan repayment"
}
```

#### Profile Update Request
```json
{
  "type": "PROFILE_UPDATE",
  "changes": {
    "address": "New address here",
    "email": "new.email@example.com"
  },
  "description": "Update contact information"
}
```

#### Document Upload Request
```json
{
  "type": "DOCUMENT_UPLOAD",
  "document_type": "NATIONAL_ID",
  "file_url": "https://storage.example.com/uploads/doc-123.pdf",
  "description": "Updated national ID"
}
```

**Response (201):**
```json
{
  "id": "3",
  "request_id": "REQ-2024-003",
  "type": "DEPOSIT",
  "status": "PENDING",
  "amount": 5000,
  "description": "Monthly contribution deposit",
  "created_at": "2024-12-04T10:00:00Z"
}
```

**Validation Rules:**
- `DEPOSIT`: amount > 0, account must be active
- `REPAYMENT`: amount > 0, amount <= outstanding_balance
- `PROFILE_UPDATE`: at least one change field required
- `DOCUMENT_UPLOAD`: file_url required

---

## Notifications

### GET /api/client/notifications

Get member notifications.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `unread_only` | boolean | Filter unread only |
| `limit` | number | Items to return |

**Response (200):**
```json
{
  "data": [
    {
      "id": "1",
      "title": "Deposit Processed",
      "message": "Your deposit of ETB 5,000 has been processed to your Compulsory Savings account.",
      "type": "SUCCESS",
      "read": false,
      "resource_type": "transaction",
      "resource_id": "1",
      "created_at": "2024-12-01T09:00:00Z"
    }
  ],
  "unread_count": 2
}
```

---

### PUT /api/client/notifications/:id/read

Mark notification as read.

**Response (200):**
```json
{
  "message": "Notification marked as read"
}
```

---

### PUT /api/client/notifications/read-all

Mark all notifications as read.

**Response (200):**
```json
{
  "message": "All notifications marked as read"
}
```

---

## File Uploads

### POST /api/uploads

Upload a file (profile photo, document, receipt).

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (binary)
- Field: `type` (string: `profile_photo` | `document` | `receipt`)

**Response (200):**
```json
{
  "url": "https://storage.example.com/uploads/file-uuid-123.jpg",
  "filename": "original-name.jpg",
  "size": 245678,
  "mime_type": "image/jpeg"
}
```

**File Limits:**
- Max size: 5MB
- Allowed types: jpg, jpeg, png, pdf
- Images will be resized to max 1200px

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (invalid/expired token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Not Found |
| `422` | Unprocessable Entity (business rule violation) |
| `429` | Too Many Requests |
| `500` | Internal Server Error |

### Error Response Format

```json
{
  "error": {
    "message": "Human readable error message",
    "code": "ERROR_CODE",
    "details": {
      "field": "specific field error"
    }
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Wrong phone/password |
| `TOKEN_EXPIRED` | JWT expired, refresh needed |
| `ACCOUNT_SUSPENDED` | Member account suspended |
| `INSUFFICIENT_BALANCE` | Not enough funds |
| `AMOUNT_EXCEEDS_LIMIT` | Amount too high |
| `DUPLICATE_REQUEST` | Request already exists |
| `VALIDATION_ERROR` | Field validation failed |

---

## Business Rules

### Critical Rules (Must be enforced by backend)

1. **Available Balance Calculation:**
   ```
   available_balance = balance - lien_amount
   ```

2. **Members Cannot Withdraw:**
   - No withdrawal endpoints exposed to members
   - All withdrawals are staff-initiated

3. **Request Approval Flow:**
   - ALL write actions create a `PENDING` request
   - UI does NOT update data optimistically
   - Only `APPROVED` requests affect actual data
   - Staff (Teller/Manager/Admin) must process requests

4. **Deposit Validation:**
   - `amount > 0`
   - `amount >= minimum_deposit` (from system config)
   - Account must be `ACTIVE`

5. **Repayment Validation:**
   - `amount > 0`
   - `amount <= outstanding_balance`
   - Show penalty if loan is overdue

6. **Password Requirements:**
   - Minimum 8 characters
   - At least 1 uppercase letter
   - At least 1 number

7. **Profile Updates:**
   - Sensitive fields require approval
   - Editable without approval: (none currently)
   - Require approval: address, email, phone, national_id

### Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/auth/login` | 5 requests/minute |
| `/auth/request-otp` | 3 requests/hour |
| `/client/requests` POST | 10 requests/hour |
| All other endpoints | 100 requests/minute |

---

## Webhook Events (Backend → Frontend)

For real-time updates (WebSocket or polling):

```json
{
  "event": "request.approved",
  "data": {
    "request_id": "REQ-2024-001",
    "type": "DEPOSIT",
    "status": "APPROVED"
  },
  "timestamp": "2024-12-04T10:30:00Z"
}
```

**Event Types:**
- `request.approved`
- `request.rejected`
- `loan.payment_reminder`
- `loan.overdue`
- `notification.new`

---

## Deep Link Format

For Telegram bot integration:

```
https://app.alef-delta.com/miniapp?chat_id=<telegram_chat_id>&member_id=<member_id>
```

Backend must validate:
1. `chat_id` matches registered Telegram account
2. `member_id` belongs to authenticated member
3. Issue JWT token after validation

---

## Testing Credentials

For development/testing:

```
Phone: +251911234567
Password: password123
```

This account has:
- 3 savings accounts
- 1 active loan
- Sample transactions
- Sample requests
