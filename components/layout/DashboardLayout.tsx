'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Wait for loading to complete
    if (loading) {
      return;
    }

    // If not authenticated, redirect to login
    if (!user) {
      router.push('/auth/login');
      setIsRedirecting(true);
      return;
    }

    // Check payment status first, then onboarding completion
    if (userData) {
      // Check if user is a team member (added by admin)
      const isTeamMember = (userData as any)?.isTeamMember === true || (userData as any)?.ownerId;
      
      // Skip billing checks for admin, COO roles, and team members
      const userRole = userData.role?.toLowerCase();
      const isAdminOrCOO = userRole === 'admin' || userRole === 'coo';
      
      if (!isAdminOrCOO && !isTeamMember) {
        const billingStatus = userData.billing?.status || userData.paymentStatus;
        
        // If payment is not active, redirect to payment page first
        if (billingStatus !== 'active' && billingStatus !== 'paid') {
          setIsRedirecting(true);
          router.push('/payment');
          return;
        }
      }
      
      // Team members skip onboarding - they inherit owner's company setup
      if (!isTeamMember) {
        // After payment is confirmed, check onboarding completion - Company and Integrations are mandatory
        const onboardingInfo = (userData as any)?.onboardingInfo || {};
        const companyInfo = onboardingInfo?.companyInfo || {};
        const integrationsInfo = onboardingInfo?.integrationsInfo || {};
        
        // Check if mandatory onboarding steps are completed
        const hasCompanyInfo = companyInfo.businessName && 
                              companyInfo.businessType && 
                              companyInfo.registeredAddress && 
                              companyInfo.warehouseAddress &&
                              companyInfo.timezone &&
                              companyInfo.supportEmail;
        
        const hasIntegrationsInfo = integrationsInfo.shopifyLink || integrationsInfo.shipstationLink;
        
        // If mandatory steps are not completed, redirect to onboarding
        if (!hasCompanyInfo || !hasIntegrationsInfo) {
          setIsRedirecting(true);
          // Determine which step to redirect to
          if (!hasCompanyInfo) {
            router.push('/onboarding/company');
          } else if (!hasIntegrationsInfo) {
            router.push('/onboarding/integrations');
          }
          return;
        }
      }
    }
    // If userData is null but user exists, wait a bit for it to load
    // Don't redirect immediately as userData might still be loading
  }, [user, userData, loading, router]);

  if (loading || isRedirecting) {
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

