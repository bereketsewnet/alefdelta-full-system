import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModernHeader } from "@/components/shared/ModernHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, AlertCircle, Clock, UserX, Percent } from "lucide-react";
import type { User } from "@/types";

interface SystemConfig {
  config_key: string;
  config_value: string;
  description: string;
  updated_at: string;
}

const SystemSettings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [configs, setConfigs] = useState<Record<string, string>>({});

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Only admins can access this page
      if (parsedUser.role !== 'ADMIN') {
        toast({
          title: "Access Denied",
          description: "Only administrators can access system settings",
          variant: "destructive"
        });
        navigate("/dashboard");
      }
    }
  }, [navigate, toast]);

  // Fetch system configuration
  const { data: configData, isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: async () => {
      const res = await api.get<{ data: SystemConfig[] }>('/system/config');
      const configMap: Record<string, string> = {};
      res.data.data.forEach((config) => {
        configMap[config.config_key] = config.config_value;
      });
      setConfigs(configMap);
      return res.data.data;
    },
    enabled: !!user
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return api.put(`/system/config/${key}`, { config_value: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      toast({ 
        title: "Success", 
        description: "System setting updated successfully" 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update system setting",
        variant: "destructive"
      });
    }
  });

  const handleUpdate = (key: string, value: string) => {
    updateMutation.mutate({ key, value });
  };

  const handleSwitchChange = (key: string, checked: boolean) => {
    const value = checked ? 'true' : 'false';
    setConfigs({ ...configs, [key]: value });
    handleUpdate(key, value);
  };

  const handleInputChange = (key: string, value: string) => {
    setConfigs({ ...configs, [key]: value });
  };

  const handleSaveNumeric = (key: string) => {
    const value = configs[key];
    if (!value || isNaN(Number(value))) {
      toast({
        title: "Invalid Value",
        description: "Please enter a valid number",
        variant: "destructive"
      });
      return;
    }
    handleUpdate(key, value);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="System Settings"
        subtitle="Configure system-wide settings and automation rules"
        icon={Settings}
        onBack={() => navigate("/dashboard")}
      />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {isLoading ? (
          <div className="text-center py-8">Loading system settings...</div>
        ) : (
          <div className="grid gap-6">
            
            {/* Member Inactivity Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserX className="h-5 w-5" />
                  <div>
                    <CardTitle>Member Lifecycle Management</CardTitle>
                    <CardDescription>
                      Automatic member status updates based on inactivity periods
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Inactivity Checking</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically check and update member status daily at 3:00 AM
                    </p>
                  </div>
                  <Switch
                    checked={configs['inactivity_check_enabled'] === 'true'}
                    onCheckedChange={(checked) => handleSwitchChange('inactivity_check_enabled', checked)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="inactive-days" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Inactive Period (Days)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Days before member becomes INACTIVE
                    </p>
                    <div className="flex gap-2">
                      <Input
                        id="inactive-days"
                        type="number"
                        value={configs['member_inactive_days'] || '90'}
                        onChange={(e) => handleInputChange('member_inactive_days', e.target.value)}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveNumeric('member_inactive_days')}
                        disabled={updateMutation.isPending}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Default: 90 days (≈ 3 months)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="terminated-days" className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Terminated Period (Days)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Days before member becomes TERMINATED
                    </p>
                    <div className="flex gap-2">
                      <Input
                        id="terminated-days"
                        type="number"
                        value={configs['member_terminated_days'] || '365'}
                        onChange={(e) => handleInputChange('member_terminated_days', e.target.value)}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveNumeric('member_terminated_days')}
                        disabled={updateMutation.isPending}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Default: 365 days (≈ 1 year)
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">Member Status Permissions</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>ACTIVE:</strong> Full access (deposit, withdraw, loan payment, new loans)</p>
                    <p><strong>INACTIVE:</strong> Limited access (deposit ✓, loan payment ✓, withdraw ✗, new loans ✗)</p>
                    <p><strong>TERMINATED:</strong> No access (all transactions blocked, manager reactivation required)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Penalty Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  <div>
                    <CardTitle>Loan Penalty Settings</CardTitle>
                    <CardDescription>
                      Default penalty rate for overdue loan payments
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="penalty-rate">Default Penalty Rate (%)</Label>
                  <p className="text-sm text-muted-foreground">
                    Applied to overdue loan payments daily
                  </p>
                  <div className="flex gap-2 max-w-xs">
                    <Input
                      id="penalty-rate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={configs['penalty_rate_default'] || '15.0'}
                      onChange={(e) => handleInputChange('penalty_rate_default', e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveNumeric('penalty_rate_default')}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Default: 15.0% (Individual loan products can override this)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Share Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  <div>
                    <CardTitle>Share Settings</CardTitle>
                    <CardDescription>
                      Share price and minimum share requirement (used for member lien calculation)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="share-price">Share Price (ETB)</Label>
                  <p className="text-sm text-muted-foreground">
                    Used to compute lien amount: shares × share price
                  </p>
                  <div className="flex gap-2 max-w-xs">
                    <Input
                      id="share-price"
                      type="number"
                      step="1"
                      min="0"
                      value={configs['share_price'] || '300'}
                      onChange={(e) => handleInputChange('share_price', e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveNumeric('share_price')}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Default: 300 ETB
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-shares-required">Minimum Shares Required</Label>
                  <p className="text-sm text-muted-foreground">
                    If member requested fewer shares, this minimum will be used for lien calculation
                  </p>
                  <div className="flex gap-2 max-w-xs">
                    <Input
                      id="min-shares-required"
                      type="number"
                      step="1"
                      min="0"
                      value={configs['min_shares_required'] || '5'}
                      onChange={(e) => handleInputChange('min_shares_required', e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveNumeric('min_shares_required')}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Default: 5 shares
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Automation Schedule Info */}
            <Card>
              <CardHeader>
                <CardTitle>Automated Jobs Schedule</CardTitle>
                <CardDescription>All times in Africa/Addis_Ababa timezone</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Loan Penalty Processing</p>
                      <p className="text-sm text-muted-foreground">Checks overdue loans and applies penalties</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">Daily at 1:00 AM</p>
                      <p className="text-xs text-muted-foreground">Every day</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Savings Interest Posting</p>
                      <p className="text-sm text-muted-foreground">Credits monthly interest to savings accounts</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">Monthly at 2:00 AM</p>
                      <p className="text-xs text-muted-foreground">1st of each month</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Member Inactivity Check</p>
                      <p className="text-sm text-muted-foreground">Updates member status based on activity</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">Daily at 3:00 AM</p>
                      <p className="text-xs text-muted-foreground">Every day</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manual Triggers */}
            <Card>
              <CardHeader>
                <CardTitle>Manual Job Triggers</CardTitle>
                <CardDescription>Run automated jobs manually for testing or immediate processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/eod')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Go to End of Day Processing
                </Button>
              </CardContent>
            </Card>

          </div>
        )}
      </main>
    </div>
  );
};

export default SystemSettings;

