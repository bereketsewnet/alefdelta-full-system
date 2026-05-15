import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import "@/lib/i18n";

// Pages
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import RequestReset from "./pages/auth/RequestReset";
import SelfRegister from "./pages/auth/SelfRegister";
import PartnerRegistration from "./pages/PartnerRegistration";
import LoanRequest from "./pages/LoanRequest";
import Dashboard from "./pages/client/Dashboard";
import Accounts from "./pages/client/Accounts";
import Transactions from "./pages/client/Transactions";
import Loans from "./pages/client/Loans";
import LoanDetail from "./pages/client/LoanDetail";
import Requests from "./pages/client/Requests";
import Profile from "./pages/client/Profile";
import Notifications from "./pages/client/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: (failureCount, error: any) => {
        // Don't retry on 401 errors
        if (error?.message === 'Unauthorized' || error?.silent) {
          return false;
        }
        return failureCount < 1;
      },
      onError: (error: any) => {
        // Suppress console errors for 401 Unauthorized
        if (error?.message === 'Unauthorized' || error?.silent) {
          return; // Don't log to console
        }
        // Log other errors normally
        console.error('Query error:', error);
      },
    },
    mutations: {
      onError: (error: any) => {
        // Suppress console errors for 401 Unauthorized
        if (error?.message === 'Unauthorized' || error?.silent) {
          return; // Don't log to console
        }
        // Log other errors normally
        console.error('Mutation error:', error);
      },
    },
  },
});

// Component to initialize auth on app load
const AuthInitializer = () => {
  const { initializeAuth } = useAuth();
  
  useEffect(() => {
    // Initialize auth state on app load
    initializeAuth();
  }, [initializeAuth]);
  
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthInitializer />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          
          {/* Auth Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/request-reset" element={<RequestReset />} />
          <Route path="/auth/register" element={<SelfRegister />} />
          <Route path="/partner-registration" element={<PartnerRegistration />} />
          <Route path="/loan-request" element={<LoanRequest />} />
          
          {/* Member Routes */}
          <Route path="/client/dashboard" element={<Dashboard />} />
          <Route path="/client/accounts" element={<Accounts />} />
          <Route path="/client/accounts/:accountId/transactions" element={<Transactions />} />
          <Route path="/client/loans" element={<Loans />} />
          <Route path="/client/loans/:loanId" element={<LoanDetail />} />
          <Route path="/client/requests" element={<Requests />} />
          <Route path="/client/profile" element={<Profile />} />
          <Route path="/client/notifications" element={<Notifications />} />
          
          {/* Deep Link Entry Point for Telegram Bot */}
          <Route path="/miniapp" element={<Index />} />
          
          {/* Redirects */}
          <Route path="/dashboard" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
