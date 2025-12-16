'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Check, AlertCircle } from 'lucide-react';
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper';


export default function ReviewPage() {
  const router = useRouter();
  const { user, userData, loading, refreshUserData } = useAuth();
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  // Get onboarding data
  const onboardingData = useMemo(() => {
    const data: any = userData as any;
    return {
      companyInfo: data?.onboardingInfo?.companyInfo || {},
      teamInfo: data?.onboardingInfo?.teamInfo || {},
      integrationsInfo: data?.onboardingInfo?.integrationsInfo || {},
    };
  }, [userData]);

  // Check completion status
  const companyCompleted = !!onboardingData.companyInfo?.businessName;
  const teamMembers = onboardingData.teamInfo?.members || [];
  // Team step is completed if company is completed (team is optional)
  const teamCompleted = companyCompleted;
  const integrationsCompleted = !!(onboardingData.integrationsInfo?.shopifyLink || onboardingData.integrationsInfo?.shipstationLink);

  // Determine completed steps for stepper
  const completedSteps: Array<'company' | 'team' | 'integrations' | 'review'> = [];
  if (companyCompleted) completedSteps.push('company');
  if (teamCompleted) completedSteps.push('team');
  if (integrationsCompleted) completedSteps.push('integrations');

  const handleCompleteOnboarding = async () => {
    if (!user) return;
    
    setCompleting(true);
    setError('');
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc: any = userData as any;
      
      // Get existing onboardingInfo
      const existingOnboardingInfo = userDoc?.onboardingInfo || {};
      
      // Mark onboarding as completed
      await updateDoc(userRef, {
        onboardingInfo: {
          ...existingOnboardingInfo,
          completed: true,
          completedAt: serverTimestamp(),
        },
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      });
      
      await refreshUserData();
      
      // Navigate to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      setError(err.message || 'Failed to complete onboarding. Please try again.');
      setCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#dcecf6] via-[#ddeef8] to-[#f5ede2] flex items-center justify-center py-12">
      <div className="w-full px-[123px]">
        {/* Stepper */}
        <OnboardingStepper activeStep="review" completedSteps={completedSteps} />

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-[#020F3F]">Review & Finish</h2>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Company Profile Card */}
            <div className={`rounded-lg p-5 border-2 ${companyCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${companyCompleted ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">Company Profile</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Legal name, addresses, and contact info configured
                  </p>
                </div>
              </div>
            </div>

            {/* Team Card */}
            <div className={`rounded-lg p-5 border-2 ${teamCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${teamCompleted ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">Team</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {teamMembers.length > 0 
                      ? `${teamMembers.length} team member${teamMembers.length !== 1 ? 's' : ''} added`
                      : 'No additional team members - you can add them later'}
                  </p>
                </div>
              </div>
            </div>

            {/* Integrations Card */}
            <div className={`rounded-lg p-5 border-2 ${integrationsCompleted ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${integrationsCompleted ? 'bg-green-500' : 'bg-orange-500'}`}>
                  {integrationsCompleted ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">Integrations</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {integrationsCompleted 
                      ? 'All integrations connected' 
                      : 'Some integrations not connected - you can set these up later'}
                  </p>
                </div>
              </div>
            </div>

            {/* Information Banner */}
            {!integrationsCompleted && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <p className="text-sm text-gray-700">
                  You can continue in <span className="font-bold">Limited Mode</span> and connect integrations later from the Integrations section.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 px-6 py-5 flex items-center justify-between bg-gray-50">
            <button
              type="button"
              onClick={() => router.push('/onboarding/integrations')}
              className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ← BACK
            </button>
            <button
              type="button"
              onClick={handleCompleteOnboarding}
              disabled={completing}
              className="flex items-center gap-2 rounded-full bg-[#E79138] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {completing ? 'Completing...' : 'GO TO DASHBOARD'} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

