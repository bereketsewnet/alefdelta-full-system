// Mobile Bottom Navigation
import { Home, Wallet, CreditCard, FileText, User, Bell } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/client/dashboard' },
  { icon: Wallet, label: 'Accounts', path: '/client/accounts' },
  { icon: CreditCard, label: 'Loans', path: '/client/loans' },
  { icon: FileText, label: 'Requests', path: '/client/requests' },
  { icon: Bell, label: 'Notifications', path: '/client/notifications', showBadge: true },
  { icon: User, label: 'Profile', path: '/client/profile' },
];

export function BottomNav() {
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.client.getUnreadNotificationCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <nav className="mobile-nav md:hidden">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const showBadge = item.showBadge && unreadCount > 0;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors text-muted-foreground relative"
              activeClassName="text-primary bg-primary/10"
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}

export default BottomNav;
