'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
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
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import logo from '../../public/assets/logo.png';
import { canAccessSection, getUserRole } from '@/lib/auth/roles';

const allNavigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'dashboard' },
  { name: 'Orders', href: '/dashboard/orders', icon: List, section: 'orders' },
  { name: 'Clients', href: '/dashboard/clients', icon: Users, section: 'clients' },
  { name: "Analytics & KPI's", href: '/dashboard/kpis', icon: BarChart3, section: 'kpis' },
  { name: 'Users & Roles', href: '/dashboard/users', icon: Users, section: 'users' },
  { name: 'Logs & Audits', href: '/dashboard/logs', icon: FileText, section: 'logs' },
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings, 
    section: 'settings',
    hasDropdown: true,
    subItems: [
      { name: 'Account Settings', href: '/dashboard/settings?tab=account' },
      { name: 'Integration', href: '/dashboard/settings?tab=integration' },
      { name: 'Billing', href: '/dashboard/settings?tab=billing', section: 'billing' },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userData, logOut } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  // Check if Settings is active
  const isSettingsActive = pathname.startsWith('/dashboard/settings');
  
  // Auto-expand Settings when on settings page
  useEffect(() => {
    if (isSettingsActive && !expandedItems.includes('Settings')) {
      setExpandedItems(prev => [...prev, 'Settings']);
    }
  }, [isSettingsActive, expandedItems]);
  
  // Filter navigation items based on user role and permissions
  const navigation = allNavigationItems.filter((item) => {
    // Use role-based access control
    if (item.section) {
      return canAccessSection(userData, item.section);
    }
    // Legacy roles check (for backward compatibility)
    if ('roles' in item && Array.isArray(item.roles) && userData?.role) {
      const userRoleLower = userData.role.toLowerCase();
      return item.roles.some((role: string) => role.toLowerCase() === userRoleLower);
    }
    // If no restriction, show to everyone
    return true;
  });

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const getSubItemActive = (href: string) => {
    if (href.includes('tab=')) {
      const tab = href.split('tab=')[1];
      const currentTab = searchParams.get('tab') || 'account';
      return tab === currentTab && pathname.startsWith('/dashboard/settings');
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="flex h-screen w-64 flex-col  text-white">
      <div className="flex h-16 items-center justify-center border-b border-orange-600 px-4">
        <Image src={logo} alt="Surepoint Logo" width={150} height={60} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto bg-[#E79138]">
        {navigation.map((item) => {
          // For Dashboard, only match exactly. For other routes, match the path and sub-paths
          const isActive = item.href === '/dashboard' 
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');
          
          const isExpanded = item.hasDropdown && (expandedItems.includes(item.name) || isActive);
          
          return (
            <div key={item.name}>
              {item.hasDropdown ? (
                <button
                  onClick={() => {
                    toggleExpanded(item.name);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer',
                    isActive
                      ? 'bg-white text-[#020F3F]'
                      : 'text-white hover:bg-orange-200'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <Link
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
                </Link>
              )}
              
              {/* Submenu items */}
              {item.hasDropdown && item.subItems && isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.subItems
                    .filter((subItem) => {
                      // Filter subItems based on role-based access control
                      if (subItem.section) {
                        return canAccessSection(userData, subItem.section);
                      }
                      // Legacy roles check
                      if ('roles' in subItem && Array.isArray(subItem.roles) && userData?.role) {
                        const userRoleLower = userData.role.toLowerCase();
                        return subItem.roles.some((role: string) => role.toLowerCase() === userRoleLower);
                      }
                      return true;
                    })
                    .map((subItem) => {
                      const isSubActive = getSubItemActive(subItem.href);
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={cn(
                            'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isSubActive
                              ? 'bg-white/20 text-white'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          )}
                        >
                          {subItem.name}
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>
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

