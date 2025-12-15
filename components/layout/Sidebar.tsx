'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  Users,
  TrendingUp,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BillingPortalButton } from '@/components/billing/BillingPortalButton';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/dashboard/orders', icon: Package },
  { name: 'KPIs', href: '/dashboard/kpis', icon: BarChart3 },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
];

const cooNavigation = [
  { name: 'COO Insights', href: '/dashboard/coo', icon: TrendingUp },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { userData, logOut } = useAuth();
  const isCOO = userData?.role === 'coo' || userData?.role === 'admin';

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold">Surepoint</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
        
        {isCOO && (
          <>
            <div className="my-4 border-t border-gray-800"></div>
            {cooNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="border-t border-gray-800 p-4 space-y-3">
        <div className="flex items-center space-x-3 px-3">
          <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-sm font-medium">
              {userData?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userData?.name || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{userData?.email}</p>
          </div>
        </div>
        
        {/* Billing Portal Button */}
        {userData?.billing?.status === 'active' && (
          <div className="px-3">
            <BillingPortalButton />
          </div>
        )}
        
        <button
          onClick={logOut}
          className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

