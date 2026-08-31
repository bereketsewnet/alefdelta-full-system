import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";

const demoAccounts = [
  { label: "Admin", username: "admin" },
  { label: "Teller", username: "teller" },
  { label: "Credit Officer", username: "credit.officer" },
  { label: "Manager", username: "manager" },
  { label: "Board Member", username: "e2e_board1" },
  { label: "Auditor", username: "e2e_auditor" },
] as const;

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Hide by default; can be enabled via env if needed (rebuild frontend after changing env).
  const showForgotPasswordLink =
    String(import.meta.env.VITE_SHOW_STAFF_FORGOT_PASSWORD || "").toLowerCase() === "true";

  const selectDemoAccount = (username: string) => {
    setIdentifier(username);
    setPassword("Demo1234");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!identifier.trim()) {
      toast({
        title: "Validation Error",
        description: "Username or email is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!password || password.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      // Clear any existing session to prevent sending invalid tokens
      localStorage.removeItem("user_session");
      localStorage.removeItem("user");

      // 1. Login to get tokens
      const loginPayload = {
        identifier: identifier.trim(),
        password: password, // Don't trim password - spaces might be intentional
        actor: 'STAFF' as const // Defaulting to STAFF for internal portal
      };
      
      const loginResponse = await api.post('/auth/login', loginPayload);

      // Check if response has the expected structure
      if (!loginResponse.data || !loginResponse.data.accessToken) {
        throw new Error('Invalid response from server');
      }

      const { accessToken, refreshToken } = loginResponse.data;

      // Store tokens
      const sessionData = {
        token: accessToken,
        refreshToken
      };
      localStorage.setItem("user_session", JSON.stringify(sessionData));

      // 2. Fetch user profile
      // We need to set the header manually for this immediate request since interceptor reads from localStorage which we just set
      const meResponse = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!meResponse.data) {
        throw new Error('Failed to fetch user profile');
      }

      const user = meResponse.data;
        localStorage.setItem("user", JSON.stringify(user));

        toast({
          title: "Login Successful",
        description: `Welcome back, ${user.full_name || user.username}!`,
        });

        navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      console.error("Error response:", error.response?.data);
      
      // Extract detailed error message
      let errorMessage = "Invalid credentials. Please try again.";
      if (error.response?.data) {
        const data = error.response.data;
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (Array.isArray(data.details)) {
          errorMessage = data.details.map((d: any) => d.message || d).join(", ");
        }
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md space-y-6">
         {/* Logo/Header */}
         <div className="text-center space-y-2 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="/icon_logo.svg" 
              alt="ALEF-DELTA SACCO" 
              className="h-20 w-20 rounded-xl shadow-md"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">ALEF-DELTA SACCO</h1>
          <p className="text-muted-foreground">Internal Staff Portal</p>
        </div>

        {/* Login Card */}
        <Card className="border-2 shadow-xl animate-scale-in">
          <CardHeader>
            <CardTitle>Staff Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Username or Email</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="username or email@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                  {showForgotPasswordLink && (
                    <Link 
                      to="/forgot-password" 
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-pulse mr-2">●</div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg border shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-semibold">Demo Accounts</p>
                  <p className="text-[11px] text-muted-foreground">Click an account to fill the username and password.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => selectDemoAccount(account.username)}
                    className="rounded-md border bg-background px-3 py-2 text-left transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Use ${account.label} demo account`}
                  >
                    <span className="block text-xs font-medium">{account.label}</span>
                    <span className="block truncate font-mono text-[11px] text-muted-foreground">{account.username}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          © 2024 ALEF-DELTA SACCO. Arada Branch, Addis Ababa
        </p>
      </div>
    </div>
  );
};

export default Login;
