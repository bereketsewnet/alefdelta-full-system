# ALEF-DELTA SACCO - Role Responsibilities and Recommendations

## Document Purpose
This document outlines the current roles in the system, proposed new roles (Accountant and Accountant Head), and recommendations for additional roles. This will be implemented after all current fixes and system updates are completed.

---

## Current Roles in the System

### 1. MEMBER
- **Type**: End User
- **Description**: Regular SACCO members who use the member portal
- **Access**: Member portal only
- **Permissions**: View own accounts, loans, transactions, make deposit/repayment requests

### 2. ADMIN
- **Type**: Staff
- **Description**: Full system administrator with complete access
- **Access**: Staff portal with all permissions
- **Key Permissions**:
  - All system operations
  - User management
  - System configuration
  - Loan approval/rejection
  - Transaction processing
  - All reports
  - End-of-day processing
  - Interest processing
  - Penalty processing

### 3. MANAGER
- **Type**: Staff
- **Description**: Operational manager with broad administrative access
- **Access**: Staff portal with management permissions
- **Key Permissions**:
  - Loan approval/rejection
  - Member activation/suspension
  - Transaction processing
  - Deposit/repayment request approvals
  - View all reports
  - Penalty processing
  - Member management (create/edit)
  - Cannot: System configuration, user management, EOD processing

### 4. TELLER
- **Type**: Staff
- **Description**: Front-line staff handling cash transactions and member services
- **Access**: Staff portal with transaction permissions
- **Key Permissions**:
  - Process deposits
  - Process withdrawals
  - Approve deposit requests
  - Approve loan repayment requests
  - Member registration (create/edit)
  - View member accounts
  - View loans (read-only)
  - View transactions
  - View basic reports
  - Cannot: Loan approval, system configuration, user management

### 5. CREDIT_OFFICER
- **Type**: Staff
- **Description**: Specialized role for loan processing and credit management
- **Access**: Staff portal with loan-focused permissions
- **Key Permissions**:
  - Create loan applications
  - View all loans
  - Add guarantors
  - Add collateral
  - View loan schedules
  - Check loan eligibility
  - View overdue loans
  - View loan repayment history
  - View member credit information
  - Cannot: Approve/reject loans (only Manager/Admin), process transactions, system configuration

### 6. AUDITOR
- **Type**: Staff
- **Description**: Read-only access for auditing and compliance
- **Access**: Staff portal with read-only permissions
- **Key Permissions**:
  - View all transactions (read-only)
  - View all reports
  - View member information
  - View loan information
  - View account information
  - Generate audit reports
  - Cannot: Any write operations, approvals, or system changes

---

## Proposed New Roles

### 1. ACCOUNTANT

#### Purpose
Financial record keeping, transaction reconciliation, and financial reporting. Similar to Teller but focused on financial accuracy and reporting rather than customer-facing operations.

#### Responsibilities

##### Financial Transactions and Records
- ✅ View all transactions (deposits, withdrawals, loan repayments)
- ✅ View transaction reports and summaries
- ✅ View daily, monthly, and annual financial reports
- ✅ View cash flow reports
- ✅ View member account statements
- ✅ View loan repayment history

##### Deposit and Withdrawal Approvals
- ✅ Approve deposit requests (similar to Teller)
- ✅ Approve loan repayment requests (similar to Teller)
- ✅ View pending deposit requests
- ✅ View pending loan repayment requests

##### Financial Reconciliation
- ✅ Reconcile daily transactions
- ✅ Verify transaction receipts and documentation
- ✅ Match receipts with transactions
- ✅ Flag discrepancies for review

##### Reporting and Analysis
- ✅ Generate financial reports
- ✅ View transaction reports
- ✅ View monthly statements
- ✅ View regulatory reports
- ✅ Export financial data for accounting software

##### Member Account Management
- ✅ View member accounts and balances
- ✅ View account transaction history
- ✅ View account interest calculations
- ✅ View account status (active, frozen, etc.)

##### Loan Financial Tracking
- ✅ View loan repayment schedules
- ✅ View loan payment history
- ✅ View outstanding loan balances
- ✅ View loan interest calculations
- ✅ View penalty applications

##### Read-Only Access
- ✅ View members (cannot create/edit/delete)
- ✅ View loans (cannot approve/reject)
- ✅ View loan applications
- ✅ View collateral and guarantor information

#### Permissions Summary
**Can Do:**
- View transactions
- Approve deposit requests
- Approve loan repayment requests
- View all reports (financial, transaction, regulatory)
- View member accounts and balances
- View loan financial data
- Export financial data

**Cannot Do:**
- Create/edit/delete members
- Approve/reject loans
- Process withdrawals directly (only approve requests)
- System configuration
- User management
- Process interest calculations
- Process penalties

---

### 2. ACCOUNTANT_HEAD

#### Purpose
Supervisory role for accounting functions. Oversees financial operations, ensures accuracy, and handles advanced financial tasks.

#### Responsibilities

##### All Accountant Permissions
- ✅ All permissions listed under ACCOUNTANT role

##### Financial Oversight and Approval
- ✅ Approve large transactions (configurable threshold)
- ✅ Review and approve financial reconciliations
- ✅ Approve financial report submissions
- ✅ Review and approve penalty applications
- ✅ Review interest calculations and adjustments

##### Team Management
- ✅ View accountant activity logs
- ✅ Review accountant transactions
- ✅ Approve accountant actions requiring supervisor approval

##### Advanced Financial Operations
- ✅ Process interest calculations (similar to Admin)
- ✅ Review and approve system-generated financial entries
- ✅ Approve account freezes/unfreezes (financial reasons)
- ✅ Review and approve account adjustments

##### Regulatory and Compliance
- ✅ Generate and review regulatory reports
- ✅ Approve regulatory submissions
- ✅ Review compliance with financial regulations
- ✅ Generate audit trail reports

##### System Financial Configuration
- ✅ View system financial configuration
- ✅ Request changes to interest rates (requires Admin approval)
- ✅ View penalty configuration
- ✅ View account product financial settings

##### Advanced Reporting
- ✅ Generate custom financial reports
- ✅ Export data for external accounting systems
- ✅ Generate year-end financial summaries
- ✅ Generate tax-related reports

#### Permissions Summary
**Can Do:**
- All Accountant permissions
- Approve large transactions
- Process interest calculations
- Approve account freezes/unfreezes (financial)
- Generate regulatory reports
- Review accountant activities
- View system financial configuration
- Approve financial reconciliations

**Cannot Do:**
- System administration (non-financial)
- User management (except view accountant activities)
- Loan approval/rejection
- Member creation/deletion
- System configuration changes (non-financial)

---

## Missing Roles Analysis

### Recommended Additional Roles

#### A. COMPLIANCE_OFFICER
**Purpose**: Ensure regulatory compliance and risk management

**Responsibilities:**
- View all transactions and reports (read-only)
- Generate compliance reports
- Review loan applications for compliance
- Monitor member KYC documentation
- Generate regulatory submissions
- View audit logs
- Flag compliance issues
- Review penalty applications for compliance

**Permissions:**
- View-only access to all financial data
- Generate compliance and regulatory reports
- View member documentation
- View loan applications
- View audit logs
- Cannot approve transactions or loans

**Priority**: Medium (optional, but recommended for regulatory compliance)

---

#### B. IT_ADMIN (System Administrator)
**Purpose**: Technical system management (separate from business ADMIN)

**Responsibilities:**
- User account management (create/edit/disable staff users)
- System configuration (technical settings)
- View system logs and errors
- Database backup management
- System health monitoring
- API key management
- View audit logs (technical)

**Permissions:**
- User management (staff only, not members)
- System configuration (technical)
- View system logs
- Cannot access financial transactions
- Cannot approve loans or transactions
- Cannot view sensitive financial reports

**Note**: This is different from ADMIN role - IT Admin is technical-only, while ADMIN has full business access.

**Priority**: Low (optional, only if you want to separate technical admin from business admin)

---

#### C. BRANCH_MANAGER
**Purpose**: Manage operations at a specific branch (if multi-branch system)

**Responsibilities:**
- All Manager permissions (scoped to their branch)
- View branch-specific reports
- Approve branch transactions
- Manage branch staff (Tellers, Accountants)
- View branch member activities
- Generate branch reports

**Permissions:**
- Similar to MANAGER but branch-scoped
- Branch-specific data access
- Cannot access other branches' data

**Priority**: Low (only needed if implementing multi-branch functionality)

---

#### D. LOAN_OFFICER
**Purpose**: Junior role to assist with loan processing and member support

**Responsibilities:**
- Create loan applications
- View loan applications
- Add guarantors and collateral
- View loan schedules
- Check loan eligibility
- Cannot approve loans (only Credit Officer/Manager/Admin can)

**Permissions:**
- Create loan applications
- View loans
- Add guarantors/collateral
- Check eligibility
- View loan schedules
- Cannot approve/reject loans
- Cannot process transactions

**Priority**: Low (optional, only if you need to separate loan creation from loan approval)

---

### Roles NOT Needed (Already Covered)

- ✅ **Cashier** → Covered by TELLER
- ✅ **Finance Manager** → Covered by MANAGER + ACCOUNTANT_HEAD
- ✅ **Data Entry Clerk** → Covered by TELLER (member registration)
- ✅ **Customer Service** → Covered by TELLER
- ✅ **Loan Processor** → Covered by CREDIT_OFFICER
- ✅ **Internal Auditor** → Covered by AUDITOR

---

## Implementation Summary

### Current Roles (6)
1. MEMBER
2. ADMIN
3. MANAGER
4. TELLER
5. CREDIT_OFFICER
6. AUDITOR

### Recommended New Roles (Priority Order)

#### High Priority (Must Have)
1. **ACCOUNTANT** - Financial record keeping and reconciliation
2. **ACCOUNTANT_HEAD** - Financial oversight and advanced operations

#### Medium Priority (Recommended)
3. **COMPLIANCE_OFFICER** - Regulatory compliance and risk management

#### Low Priority (Optional - Only if Needed)
4. **IT_ADMIN** - Technical system administration (if separating from business admin)
5. **BRANCH_MANAGER** - Branch-specific management (if multi-branch)
6. **LOAN_OFFICER** - Junior loan processing role (if needed)

---

## Implementation Notes

### Database Changes Required
1. Update `users` table `role` column ENUM to include:
   - `ACCOUNTANT`
   - `ACCOUNTANT_HEAD`
   - `COMPLIANCE_OFFICER` (optional)
   - `IT_ADMIN` (optional)
   - `BRANCH_MANAGER` (optional)
   - `LOAN_OFFICER` (optional)

### Backend Changes Required
1. Update `user.validators.js` to include new roles in validation
2. Update all route files to include appropriate role permissions:
   - `transaction.routes.js` - Add ACCOUNTANT, ACCOUNTANT_HEAD
   - `deposit-request.routes.js` - Add ACCOUNTANT, ACCOUNTANT_HEAD
   - `loan-repayment-request.routes.js` - Add ACCOUNTANT, ACCOUNTANT_HEAD
   - `report.routes.js` - Add ACCOUNTANT, ACCOUNTANT_HEAD
   - `system.routes.js` - Add ACCOUNTANT_HEAD for interest processing
   - `member.routes.js` - Keep read-only for ACCOUNTANT
   - `loan.routes.js` - Keep read-only for ACCOUNTANT
   - And other relevant route files

3. Update middleware/role checks throughout the system

### Frontend Changes Required
1. Update role definitions in staff portal
2. Add role-specific dashboards if needed
3. Update UI to show/hide features based on role
4. Add role badges and indicators

### Testing Required
1. Test all permissions for ACCOUNTANT role
2. Test all permissions for ACCOUNTANT_HEAD role
3. Verify role-based access control works correctly
4. Test that accountants cannot perform unauthorized actions
5. Test that accountant head can supervise accountant activities

---

## Role Permission Matrix

| Feature | MEMBER | TELLER | ACCOUNTANT | ACCOUNTANT_HEAD | CREDIT_OFFICER | MANAGER | ADMIN | AUDITOR |
|---------|--------|--------|------------|-----------------|----------------|---------|-------|---------|
| View Own Account | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Own Loans | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Deposit Request | ✅ | - | - | - | - | - | - | - |
| Create Repayment Request | ✅ | - | - | - | - | - | - | - |
| Process Deposit | - | ✅ | - | - | - | ✅ | ✅ | - |
| Process Withdrawal | - | ✅ | - | - | - | ✅ | ✅ | - |
| Approve Deposit Request | - | ✅ | ✅ | ✅ | - | ✅ | ✅ | - |
| Approve Repayment Request | - | ✅ | ✅ | ✅ | - | ✅ | ✅ | - |
| Create Member | - | ✅ | - | - | - | ✅ | ✅ | - |
| Edit Member | - | ✅ | - | - | - | ✅ | ✅ | - |
| Create Loan | - | - | - | - | ✅ | ✅ | ✅ | - |
| Approve Loan | - | - | - | - | - | ✅ | ✅ | - |
| View All Transactions | - | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View All Reports | - | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Financial Reconciliation | - | - | ✅ | ✅ | - | - | ✅ | - |
| Process Interest | - | - | - | ✅ | - | - | ✅ | - |
| Process Penalties | - | - | - | - | - | ✅ | ✅ | - |
| System Configuration | - | - | - | - | - | - | ✅ | - |
| User Management | - | - | - | - | - | - | ✅ | - |
| EOD Processing | - | - | - | - | - | - | ✅ | - |

---

## Next Steps

1. ✅ Complete all current fixes and system updates
2. ✅ Review and approve this role structure
3. ⏳ Create database migration for new roles
4. ⏳ Update backend validators and routes
5. ⏳ Update frontend role definitions
6. ⏳ Test all role permissions
7. ⏳ Create user accounts for new roles
8. ⏳ Train staff on new roles

---

**Document Created**: 2025-12-12  
**Last Updated**: 2025-12-12  
**Status**: Planning Phase - Awaiting Implementation

