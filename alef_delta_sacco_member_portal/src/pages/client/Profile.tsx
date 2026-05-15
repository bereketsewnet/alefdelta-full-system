// Profile Page
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, MapPin, Lock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { BottomNav } from '@/components/BottomNav';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { member: authMember, logout } = useAuth();
  
  // Fetch full profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.client.getProfile();
      return response.member;
    },
  });
  
  // Use profile data if available, fallback to auth member
  const member = profileData || authMember;
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.auth.changePassword(passwordForm.current, passwordForm.new);
      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });
      setShowPasswordDialog(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const profileFields = [
    { icon: Phone, label: t('profile.fields.phone'), value: member?.phone_primary || member?.phone || '-' },
    { icon: Mail, label: t('profile.fields.email'), value: member?.email || '-' },
    { icon: MapPin, label: t('profile.fields.address'), value: member?.address || '-' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-4 p-4 max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{t('profile.title')}</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-3xl mx-auto space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-32 shimmer rounded-2xl" />
            <div className="h-64 shimmer rounded-xl" />
            <div className="h-32 shimmer rounded-xl" />
          </div>
        ) : (
          <>
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-primary-hover rounded-2xl p-6 text-primary-foreground relative overflow-hidden"
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                {member?.first_name?.[0]}{member?.last_name?.[0]}
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-bold">
                {member?.first_name} {member?.middle_name} {member?.last_name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono">
                  {member?.membership_no || member?.member_id}
                </code>
                <StatusBadge status={member?.status || 'ACTIVE'} size="sm" />
              </div>
            </div>
          </div>
          
          {/* Decorative */}
          <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        </motion.div>

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border/50 overflow-hidden"
        >
          <div className="p-4 border-b border-border/50">
            <h3 className="font-semibold">{t('profile.personal_info')}</h3>
          </div>
          <div className="divide-y divide-border/50">
            {profileFields.map((field) => (
              <div key={field.label} className="flex items-center gap-4 p-4">
                <div className="p-2 bg-muted rounded-lg">
                  <field.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  <p className="text-sm font-medium truncate">{field.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Telegram Info */}
        {member?.telegram_chat_id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-xl border border-border/50 p-4"
          >
            <p className="text-xs text-muted-foreground mb-1">{t('profile.fields.telegram_id')}</p>
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{member.telegram_chat_id}</code>
          </motion.div>
        )}

        {/* Security Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border/50"
        >
          <div className="p-4 border-b border-border/50">
            <h3 className="font-semibold">{t('profile.security')}</h3>
          </div>
          <div className="p-4">
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Lock className="h-5 w-5" />
                  {t('profile.change_password')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('profile.change_password')}</DialogTitle>
                  <DialogDescription>
                    Enter your current password and choose a new one.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{t('current_password')}</Label>
                    <Input
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('new_password')}</Label>
                    <Input
                      type="password"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('confirm_password')}</Label>
                    <Input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowPasswordDialog(false)} className="flex-1">
                    {t('cancel')}
                  </Button>
                  <Button onClick={handlePasswordChange} disabled={isChangingPassword} className="flex-1">
                    {isChangingPassword ? 'Saving...' : t('save')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full justify-center gap-2"
          >
            <LogOut className="h-5 w-5" />
            {t('logout')}
          </Button>
        </motion.div>

        {/* Member Since */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          {t('profile.member_since')}: {member?.registered_date || member?.created_at 
            ? new Date(member.registered_date || member.created_at).toLocaleDateString('en-ET', { year: 'numeric', month: 'long' }) 
            : '-'}
        </p>
        </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
