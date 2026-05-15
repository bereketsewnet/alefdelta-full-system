import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import MemberDetail from "./pages/MemberDetail";
import NewMember from "./pages/NewMember";
import EditMember from "./pages/EditMember";
import Loans from "./pages/Loans";
import LoanDetail from "./pages/LoanDetail";
import NewLoanApplication from "./pages/NewLoanApplication";
import LoanPayment from "./pages/LoanPayment";
import NewTransaction from "./pages/NewTransaction";
import AdminConfig from "./pages/AdminConfig";
import SystemSettings from "./pages/SystemSettings";
import UserManagement from "./pages/UserManagement";
import AdminMemberManagement from "./pages/AdminMemberManagement";
import AccountProductManagement from "./pages/AccountProductManagement";
import EndOfDay from "./pages/EndOfDay";
import Reports from "./pages/Reports";
import ManagerApprovals from "./pages/ManagerApprovals";
import DepositApprovals from "./pages/DepositApprovals";
import MemberRegistrationApprovals from "./pages/MemberRegistrationApprovals";
import LoanRepaymentApprovals from "./pages/LoanRepaymentApprovals";
import PartnerApprovals from "./pages/PartnerApprovals";
import LoanRequestApprovals from "./pages/LoanRequestApprovals";
import MemberActivation from "./pages/MemberActivation";
import AccountManagement from "./pages/AccountManagement";
import CollateralManagement from "./pages/CollateralManagement";
import GuarantorManagement from "./pages/GuarantorManagement";
import Transactions from "./pages/Transactions";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/new" element={<NewMember />} />
          <Route path="/members/:id" element={<MemberDetail />} />
          <Route path="/members/:id/edit" element={<EditMember />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/loans/new" element={<NewLoanApplication />} />
          <Route path="/loans/:id" element={<LoanDetail />} />
          <Route path="/loans/payment" element={<LoanPayment />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transactions/new" element={<NewTransaction />} />
          <Route path="/admin/config" element={<AdminConfig />} />
          <Route path="/admin/system-settings" element={<SystemSettings />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/members" element={<AdminMemberManagement />} />
          <Route path="/admin/account-products" element={<AccountProductManagement />} />
          <Route path="/admin/eod" element={<EndOfDay />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/manager/approvals" element={<ManagerApprovals />} />
          <Route path="/manager/deposit-approvals" element={<DepositApprovals />} />
          <Route path="/manager/loan-repayment-approvals" element={<LoanRepaymentApprovals />} />
          <Route path="/manager/member-registration-approvals" element={<MemberRegistrationApprovals />} />
          <Route path="/manager/partner-approvals" element={<PartnerApprovals />} />
          <Route path="/manager/loan-request-approvals" element={<LoanRequestApprovals />} />
          <Route path="/manager/activation" element={<MemberActivation />} />
          <Route path="/manager/accounts" element={<AccountManagement />} />
          <Route path="/collateral" element={<CollateralManagement />} />
          <Route path="/guarantors" element={<GuarantorManagement />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
