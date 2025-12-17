'use client';

import { Search, Bell, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export function Header() {
  const { userData } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Image 
          src="/assets/logo.png" 
          alt="Surepoint Logo" 
          width={120} 
          height={48} 
          className="object-contain" 
          style={{ width: 'auto', height: 'auto' }}
          priority
        />
      </div>
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search here..."
            className="w-full pl-8 pr-4 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <Bell className="h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-900" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-medium">2</span>
          </span>
        </div>
        
        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300">
          <User className="h-5 w-5 text-gray-600" />
        </div>
      </div>
    </header>
  );
}

