'use client';

import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for loading to complete
    if (loading) {
      return;
    }

    // If not authenticated, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // Check billing status - redirect to payment if not active
    // Only check if we have userData (might be null initially)
    if (userData) {
      const billingStatus = userData.billing?.status || userData.paymentStatus;
      // Allow a small delay to prevent race conditions after payment
      const checkBilling = setTimeout(() => {
        if (billingStatus !== 'active' && billingStatus !== 'paid') {
          router.push('/payment');
        }
      }, 500); // Small delay to allow userData to update after payment

      return () => clearTimeout(checkBilling);
    }
    // If userData is null but user exists, wait a bit for it to load
    // Don't redirect immediately as userData might still be loading
  }, [user, userData, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

