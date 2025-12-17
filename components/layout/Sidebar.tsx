'use client';

import Link from 'next/link';
import Image from 'next/image';
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
  List,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/dashboard/orders', icon: List },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: "Analytics & KPI's", href: '/dashboard/kpis', icon: BarChart3 },
  { name: 'Users & Roles', href: '/dashboard/users', icon: Users },
  { name: 'Logs & Audits', href: '/dashboard/logs', icon: FileText },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, hasDropdown: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { userData, logOut } = useAuth();
  const isCOO = userData?.role === 'coo' || userData?.role === 'admin';

  return (
    <div className="flex h-screen w-64 flex-col  text-white">
      <div className="flex h-16 items-center justify-center border-b border-orange-600 px-4">
        <Image src="/assets/logo.png" alt="Surepoint Logo" width={150} height={60} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto bg-[#E79138]">
        {navigation.map((item) => {
          // For Dashboard, only match exactly. For other routes, match the path and sub-paths
          const isActive = item.href === '/dashboard' 
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white text-[#020F3F]'
                  : 'text-white hover:bg-orange-200'
              )}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </div>
              {item.hasDropdown && <ChevronDown className="h-4 w-4" />}
            </Link>
          );
        })}
      </nav>

      <div className="pb-4 p-4 bg-[#E79138]">
        <button
          onClick={logOut}
          className="flex w-full items-center bg-[#FFFFFFB2] border-2 border-[#FFFFFF] space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-[#FF3D00] hover:bg-orange-200 hove:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

