'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Building2, Users, Link2, CheckSquare } from 'lucide-react';
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper';

type CompanyProfile = {
  businessName: string;
  businessType: string;
  registeredAddress: string;
  warehouseAddress: string;
  timezone: string;
  supportEmail: string;
  supportPhone: string;
};

const DEFAULT_PROFILE: CompanyProfile = {
  businessName: '',
  businessType: '',
  registeredAddress: '',
  warehouseAddress: '',
  timezone: '',
  supportEmail: '',
  supportPhone: '',
};

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const { user, userData, loading, refreshUserData } = useAuth();

  const [profile, setProfile] = useState<CompanyProfile>(DEFAULT_PROFILE);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyProfile, string>>>({});
  const [saveError, setSaveError] = useState<string>('');

  // Prefill from userData if available
  const initialProfile = useMemo(() => {
    const data: any = userData as any;
    return {
      businessName: data?.onboardingInfo?.companyInfo?.businessName || '',
      businessType: data?.onboardingInfo?.companyInfo?.businessType || '',
      registeredAddress: data?.onboardingInfo?.companyInfo?.registeredAddress || '',
      warehouseAddress: data?.onboardingInfo?.companyInfo?.warehouseAddress || '',
      timezone: data?.onboardingInfo?.companyInfo?.timezone || '',
      supportEmail: data?.onboardingInfo?.companyInfo?.supportEmail || data?.email || '',
      supportPhone: data?.onboardingInfo?.companyInfo?.supportPhone || '',
    };
  }, [userData]);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  const handleChange = (field: keyof CompanyProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setSaveError('');
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Allow various phone formats: +1 (555) 123-4567, 555-123-4567, etc.
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phone === '' || phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyProfile, string>> = {};

    if (!profile.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!profile.businessType) {
      newErrors.businessType = 'Business type is required';
    }

    if (!profile.registeredAddress.trim()) {
      newErrors.registeredAddress = 'Registered address is required';
    }

    if (!profile.warehouseAddress.trim()) {
      newErrors.warehouseAddress = 'Warehouse address is required';
    }

    if (!profile.timezone) {
      newErrors.timezone = 'Timezone is required';
    }

    if (!profile.supportEmail.trim()) {
      newErrors.supportEmail = 'Support email is required';
    } else if (!validateEmail(profile.supportEmail)) {
      newErrors.supportEmail = 'Please enter a valid email address';
    }

    if (profile.supportPhone && !validatePhone(profile.supportPhone)) {
      newErrors.supportPhone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSave = async (goToNextStep: boolean) => {
    if (!user) return;
    
    // Validate form before saving
    if (!validateForm()) {
      setSaveError('Please fix the errors before continuing');
      return;
    }

    setSaving(true);
    setSaveError('');
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc: any = userData as any;
      
      // Get existing onboardingInfo or create new structure
      const existingOnboardingInfo = userDoc?.onboardingInfo || {};
      
      await updateDoc(userRef, {
        onboardingInfo: {
          ...existingOnboardingInfo,
          companyInfo: {
            businessName: profile.businessName.trim(),
            businessType: profile.businessType,
            registeredAddress: profile.registeredAddress.trim(),
            warehouseAddress: profile.warehouseAddress.trim(),
            timezone: profile.timezone,
            supportEmail: profile.supportEmail.trim().toLowerCase(),
            supportPhone: profile.supportPhone.trim(),
          },
        },
        // Update user profile with company name
        companyName: profile.businessName.trim(),
        updatedAt: serverTimestamp(),
      });
      
      await refreshUserData();
      
      if (goToNextStep) {
        router.push('/onboarding/team');
      }
    } catch (err: any) {
      console.error('Error saving company info:', err);
      setSaveError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#dcecf6] via-[#ddeef8] to-[#f5ede2] flex items-center justify-center py-12">
      <div className="w-full px-[123px]">
        {/* Stepper */}
        <OnboardingStepper activeStep="company" completedSteps={[]} />

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-[#020F3F]">Company & Warehouse Information</h2>
          </div>

          <div className="p-6 space-y-5">
            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-700">{saveError}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Legal Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profile.businessName}
                onChange={(e) => handleChange('businessName', e.target.value)}
                className={`w-full rounded-md border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.businessName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Acme Warehouse Inc."
              />
              {errors.businessName && (
                <p className="text-xs text-red-600">{errors.businessName}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Business Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={profile.businessType}
                  onChange={(e) => handleChange('businessType', e.target.value)}
                  className={`w-full rounded-md border px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none cursor-pointer pr-10 ${
                    errors.businessType ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select type</option>
                  <option value="D2C">D2C (Direct to Consumer)</option>
                  <option value="B2B">B2B</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Marketplace">Marketplace</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Registered Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={profile.registeredAddress}
                onChange={(e) => handleChange('registeredAddress', e.target.value)}
                rows={3}
                className={`w-full rounded-md border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${
                  errors.registeredAddress ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="123, main street Johu Apartment, USA"
              />
              {errors.registeredAddress && (
                <p className="text-xs text-red-600">{errors.registeredAddress}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Warehouse Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={profile.warehouseAddress}
                onChange={(e) => handleChange('warehouseAddress', e.target.value)}
                rows={3}
                className={`w-full rounded-md border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${
                  errors.warehouseAddress ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="123, main street Johu Apartment, USA"
              />
              {errors.warehouseAddress && (
                <p className="text-xs text-red-600">{errors.warehouseAddress}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Default Timezone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={profile.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    className={`w-full rounded-md border px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none cursor-pointer pr-10 ${
                      errors.timezone ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select timezone</option>
                    <option value="Eastern Time">Eastern Time</option>
                    <option value="Central Time">Central Time</option>
                    <option value="Pacific Time">Pacific Time</option>
                    <option value="GMT">GMT</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.timezone && (
                  <p className="text-xs text-red-600">{errors.timezone}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Support Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={profile.supportEmail}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  className={`w-full rounded-md border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.supportEmail ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="support@company.com"
                />
                {errors.supportEmail && (
                  <p className="text-xs text-red-600">{errors.supportEmail}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Support Phone</label>
              <input
                type="tel"
                value={profile.supportPhone}
                onChange={(e) => handleChange('supportPhone', e.target.value)}
                className={`w-full rounded-md border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.supportPhone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="+1 (555) 123-23563"
              />
              {errors.supportPhone && (
                <p className="text-xs text-red-600">{errors.supportPhone}</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 px-6 py-5 flex items-center justify-between bg-gray-50">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ← BACK
            </button>
            <div className="flex items-center gap-4">
            <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="flex items-center gap-2 rounded-full bg-[#E79138] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {saving ? 'Saving...' : 'SAVE & CONTINUE'} →
              </button>
              <button
                type="button"
                className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                onClick={() => router.push('/dashboard')}
              >
                SKIP
              </button>
            
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


