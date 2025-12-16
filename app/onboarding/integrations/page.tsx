'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ShoppingBag, Package, FileText, Play, Copy, Check } from 'lucide-react';
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper';

type IntegrationData = {
  shopifyEmail: string;
  shopifyLink: string;
  shipstationEmail: string;
  shipstationLink: string;
};

const DEFAULT_INTEGRATIONS: IntegrationData = {
  shopifyEmail: '',
  shopifyLink: '',
  shipstationEmail: '',
  shipstationLink: '',
};


export default function IntegrationsPage() {
  const router = useRouter();
  const { user, userData, loading, refreshUserData } = useAuth();

  const [integrationData, setIntegrationData] = useState<IntegrationData>(DEFAULT_INTEGRATIONS);
  const [saving, setSaving] = useState(false);
  const [shopifyCopied, setShopifyCopied] = useState(false);
  const [shipstationCopied, setShipstationCopied] = useState(false);
  const [errors, setErrors] = useState<{ shopifyEmail?: string; shipstationEmail?: string }>({});
  const [saveError, setSaveError] = useState<string>('');

  // Prefill from userData if available
  const initialIntegrations = useMemo(() => {
    const data: any = userData as any;
    return {
      shopifyEmail: data?.onboardingInfo?.integrationsInfo?.shopifyEmail || '',
      shopifyLink: data?.onboardingInfo?.integrationsInfo?.shopifyLink || '',
      shipstationEmail: data?.onboardingInfo?.integrationsInfo?.shipstationEmail || '',
      shipstationLink: data?.onboardingInfo?.integrationsInfo?.shipstationLink || '',
    };
  }, [userData]);

  useEffect(() => {
    setIntegrationData(initialIntegrations);
  }, [initialIntegrations]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  const handleChange = (field: keyof IntegrationData, value: string) => {
    setIntegrationData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (field === 'shopifyEmail' && errors.shopifyEmail) {
      setErrors((prev) => ({ ...prev, shopifyEmail: undefined }));
    }
    if (field === 'shipstationEmail' && errors.shipstationEmail) {
      setErrors((prev) => ({ ...prev, shipstationEmail: undefined }));
    }
    setSaveError('');
  };

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleCreateLink = async (type: 'shopify' | 'shipstation') => {
    const email = type === 'shopify' ? integrationData.shopifyEmail : integrationData.shipstationEmail;
    
    if (!email.trim()) {
      setErrors((prev) => ({
        ...prev,
        [type === 'shopify' ? 'shopifyEmail' : 'shipstationEmail']: 'Please enter an email address first',
      }));
      return;
    }

    if (!validateEmail(email)) {
      setErrors((prev) => ({
        ...prev,
        [type === 'shopify' ? 'shopifyEmail' : 'shipstationEmail']: 'Please enter a valid email address',
      }));
      return;
    }

    // Clear error
    setErrors((prev) => ({
      ...prev,
      [type === 'shopify' ? 'shopifyEmail' : 'shipstationEmail']: undefined,
    }));

    // Generate a unique link (in production, this would call an API)
    const link = `https://surepoint.app/integrate/${type}/${btoa(email.trim().toLowerCase())}`;
    
    if (type === 'shopify') {
      handleChange('shopifyLink', link);
    } else {
      handleChange('shipstationLink', link);
    }
  };

  const handleCopy = async (link: string, type: 'shopify' | 'shipstation') => {
    if (!link) {
      alert('Please create a link first');
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      if (type === 'shopify') {
        setShopifyCopied(true);
        setTimeout(() => setShopifyCopied(false), 2000);
      } else {
        setShipstationCopied(true);
        setTimeout(() => setShipstationCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSave = async (goToNextStep: boolean) => {
    if (!user) return;
    
    setSaving(true);
    setSaveError('');
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc: any = userData as any;
      
      // Get existing onboardingInfo or create new structure
      const existingOnboardingInfo = userDoc?.onboardingInfo || {};
      
      // Clean integration data before saving
      const cleanedIntegrationData = {
        shopifyEmail: integrationData.shopifyEmail.trim().toLowerCase() || '',
        shopifyLink: integrationData.shopifyLink || '',
        shipstationEmail: integrationData.shipstationEmail.trim().toLowerCase() || '',
        shipstationLink: integrationData.shipstationLink || '',
      };
      
      await updateDoc(userRef, {
        onboardingInfo: {
          ...existingOnboardingInfo,
          integrationsInfo: cleanedIntegrationData,
        },
        updatedAt: serverTimestamp(),
      });
      
      await refreshUserData();
      
      if (goToNextStep) {
        router.push('/onboarding/review');
      }
    } catch (err: any) {
      console.error('Error saving integrations info:', err);
      setSaveError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#dcecf6] via-[#ddeef8] to-[#f5ede2] flex items-center justify-center py-12">
      <div className="w-full px-[123px]">
        {/* Stepper */}
        <OnboardingStepper activeStep="integrations" completedSteps={['company', 'team']} />

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-[#020F3F]">Integrations</h2>
          </div>

          <div className="p-6 space-y-8">
            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-700">{saveError}</p>
              </div>
            )}

            {/* Information Banner */}
            <div className="border-2 border-orange-400 bg-orange-50 rounded-lg px-4 py-3">
              <p className="text-sm text-gray-700">
                We'll use webhooks from Shopify and ShipStation to auto-create orders, update shipments, and calculate KPIs.
              </p>
            </div>

            {/* Shopify Integration */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Shopify</h3>
                  <p className="text-sm text-gray-500">Connect your Shopify store.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={integrationData.shopifyEmail}
                    onChange={(e) => handleChange('shopifyEmail', e.target.value)}
                    className={`w-full rounded-md border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.shopifyEmail ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="your-email@example.com"
                  />
                  {errors.shopifyEmail && (
                    <p className="text-xs text-red-600 mt-1">{errors.shopifyEmail}</p>
                  )}
                </div>
                <div className="flex items-end gap-2 pt-6">
                  <button
                    type="button"
                    onClick={() => handleCreateLink('shopify')}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    CREATE LINK
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(integrationData.shopifyLink, 'shopify')}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    {shopifyCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        COPIED
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        COPY
                      </>
                    )}
                  </button>
                </div>
              </div>

              {integrationData.shopifyLink && (
                <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-2.5">
                  <p className="text-xs text-gray-500 mb-1">Connection Link:</p>
                  <p className="text-sm text-gray-900 break-all">{integrationData.shopifyLink}</p>
                </div>
              )}

              {/* Resource Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Read Document Card */}
                <div className="rounded-lg p-5 bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                    <h4 className="text-xl font-bold text-[#020F3F]">Read Document</h4>
                  </div>
                  <div className="bg-white rounded-xl p-4 space-y-3 aspect-video" style={{ paddingLeft: '50px', paddingTop: '50px' }}>
                    <p className="text-lg font-bold text-gray-900">Implementation Guide.pdf</p>
                    <ul className="text-base text-gray-600 space-y-1 list-disc list-inside">
                      <li>Step-by-step setup checklist</li>
                      <li>Best practice for your team</li>
                      <li>Links to additional resources</li>
                    </ul>
                   
                  </div>
                  <button
                      type="button"
                      className="w-fit rounded-full bg-[#E79138] hover:bg-orange-600 text-white font-bold py-2.5 px-4 text-sm transition-colors uppercase mt-4"
                    >
                      DOWNLOAD PDF
                    </button>
                </div>

                {/* Watch Video Card */}
                <div className="rounded-lg p-5 bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Play className="w-5 h-5 text-orange-600" />
                    </div>
                    <h4 className="text-sm font-bold text-[#020F3F]">Watch Video</h4>
                  </div>
                  <div className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md">
                      <Play className="w-8 h-8 text-gray-800 ml-1" />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-fit rounded-full bg-[#E79138] hover:bg-orange-600 text-white font-bold py-2.5 px-4 text-sm transition-colors uppercase"
                  >
                    PLAY VIDEO
                  </button>
                </div>
              </div>
            </div>

            {/* Ship Station Integration */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ship Station</h3>
                  <p className="text-sm text-gray-500">Connect for shipping labels.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={integrationData.shipstationEmail}
                    onChange={(e) => handleChange('shipstationEmail', e.target.value)}
                    className={`w-full rounded-md border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.shipstationEmail ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="your-email@example.com"
                  />
                  {errors.shipstationEmail && (
                    <p className="text-xs text-red-600 mt-1">{errors.shipstationEmail}</p>
                  )}
                </div>
                <div className="flex items-end gap-2 pt-6">
                  <button
                    type="button"
                    onClick={() => handleCreateLink('shipstation')}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    CREATE LINK
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(integrationData.shipstationLink, 'shipstation')}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    {shipstationCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        COPIED
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        COPY
                      </>
                    )}
                  </button>
                </div>
              </div>

              {integrationData.shipstationLink && (
                <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-2.5">
                  <p className="text-xs text-gray-500 mb-1">Connection Link:</p>
                  <p className="text-sm text-gray-900 break-all">{integrationData.shipstationLink}</p>
                </div>
              )}

              {/* Resource Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Read Document Card */}
                <div className="rounded-lg p-5 bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                    <h4 className="text-xl font-bold text-[#020F3F]">Read Document</h4>
                  </div>
                  <div className="bg-white rounded-xl p-4 space-y-3 aspect-video" style={{ paddingLeft: '50px', paddingTop: '50px' }}>
                    <p className="text-xl font-bold text-gray-900 ">Implementation Guide.pdf</p>
                    <ul className="text-base text-gray-600 space-y-1 list-disc list-inside">
                      <li>Step-by-step setup checklist</li>
                      <li>Best practice for your team</li>
                      <li>Links to additional resources</li>
                    </ul>
                   
                  </div>
                  <button
                      type="button"
                      className="w-fit rounded-full bg-[#E79138] hover:bg-orange-600 text-white font-bold py-2.5 px-4 text-sm transition-colors uppercase mt-4"
                    >
                      DOWNLOAD PDF
                    </button>
                </div>

                {/* Watch Video Card */}
                <div className="rounded-lg p-5 bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Play className="w-5 h-5 text-orange-600" />
                    </div>
                    <h4 className="text-sm font-bold text-[#020F3F]">Watch Video</h4>
                  </div>
                  <div className="bg-gray-800 rounded-lg flex items-center aspect-video justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md">
                      <Play className="w-8 h-8 text-gray-800 ml-1" />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-fit rounded-full bg-[#E79138] hover:bg-orange-600 text-white font-bold py-2.5 px-4 text-sm transition-colors uppercase"
                  >
                    PLAY VIDEO
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 px-6 py-5 flex items-center justify-between bg-gray-50">
            <button
              type="button"
              onClick={() => router.push('/onboarding/team')}
              className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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

