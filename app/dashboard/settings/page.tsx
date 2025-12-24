'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Copy, Check, X, DollarSign, Calendar, FileText, CreditCard, Trash2, Download, Plus } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Link from 'next/link';
import { canAccessSection, getRolePermissions } from '@/lib/auth/roles';

type SettingsTab = 'account' | 'integration' | 'billing';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userData, refreshUserData } = useAuth();
  
  // Check if user can access Settings
  useEffect(() => {
    if (userData && !canAccessSection(userData, 'settings')) {
      router.push('/dashboard');
    }
  }, [userData, router]);
  
  // Get permissions
  const permissions = getRolePermissions(userData);
  
  // Get active tab from URL, default to 'account'
  const activeTab = (searchParams.get('tab') as SettingsTab) || 'account';
  
  // Redirect to account settings if no tab is specified
  useEffect(() => {
    if (!searchParams.get('tab')) {
      router.replace('/dashboard/settings?tab=account');
    }
  }, [searchParams, router]);
  
  // Personal Profile State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Change Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Company Information State
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [country, setCountry] = useState('');
  
  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    newOrders: true,
    fulfillmentAlerts: true,
    systemUpdates: false,
    teamActions: false,
  });
  
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  
  // Integration modal state
  const [openModal, setOpenModal] = useState<'shopify' | 'shipstation' | null>(null);
  const [copied, setCopied] = useState<'shopify' | 'shipstation' | null>(null);

  // Load user data
  useEffect(() => {
    if (userData) {
      const data = userData as any;
      setFullName(data.name || data.displayName || '');
      setEmail(data.email || '');
      
      // Load company info from onboarding
      const companyInfo = data?.onboardingInfo?.companyInfo || {};
      setCompanyName(companyInfo.businessName || '');
      setIndustry(companyInfo.businessType || '');
      setTimezone(companyInfo.timezone || '');
      setCountry('United States'); // Default or from company info
      
      // Load notification preferences (if stored)
      if (data.notificationPreferences) {
        setNotifications(data.notificationPreferences);
      }
    }
  }, [userData]);

  const handleTabChange = (tab: SettingsTab) => {
    router.push(`/dashboard/settings?tab=${tab}`);
  };

  const handleSavePersonalProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: fullName,
        displayName: fullName,
        updatedAt: serverTimestamp(),
      });
      
      setSaveSuccess('Personal profile updated successfully!');
      await refreshUserData();
    } catch (error: any) {
      setSaveError(error.message || 'Failed to update personal profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!user) return;
    
    if (!newPassword || newPassword.length < 6) {
      setSaveError('Password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setSaveError('Passwords do not match');
      return;
    }
    
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    
    try {
      // Import Firebase Auth
      const { updatePassword } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase/config');
      
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setSaveSuccess('Password changed successfully!');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      setSaveError(error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompanyInfo = async () => {
    if (!user) return;
    
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const onboardingInfo = (userData as any)?.onboardingInfo || {};
      
      await updateDoc(userRef, {
        'onboardingInfo.companyInfo.businessName': companyName,
        'onboardingInfo.companyInfo.businessType': industry,
        'onboardingInfo.companyInfo.timezone': timezone,
        updatedAt: serverTimestamp(),
      });
      
      setSaveSuccess('Company information updated successfully!');
      await refreshUserData();
    } catch (error: any) {
      setSaveError(error.message || 'Failed to update company information');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;
    
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        notificationPreferences: notifications,
        updatedAt: serverTimestamp(),
      });
      
      setSaveSuccess('Notification preferences saved successfully!');
      await refreshUserData();
    } catch (error: any) {
      setSaveError(error.message || 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyWebhook = async (webhookUrl: string, type: 'shopify' | 'shipstation') => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your account and preferences</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('account')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'account'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Account Settings
            </button>
            <button
              onClick={() => handleTabChange('integration')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'integration'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Integration
            </button>
            {permissions.canManageBilling && (
              <button
                onClick={() => handleTabChange('billing')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'billing'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Billing
              </button>
            )}
          </nav>
        </div>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-sm text-green-700">{saveSuccess}</p>
          </div>
        )}
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-700">{saveError}</p>
          </div>
        )}

        {/* Account Settings Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            {/* Personal Profile */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Personal Profile</h2>
                <p className="mt-1 text-sm text-gray-600">Update your personal information</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Alex Johnson"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-500 bg-gray-50 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value="**********"
                      disabled
                      className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-500 bg-gray-50 cursor-not-allowed pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Use the section below to change your password</p>
                </div>
                
                <button
                  onClick={handleSavePersonalProfile}
                  disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'SAVE PROFILE'}
                </button>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Change password</h2>
                <p className="mt-1 text-sm text-gray-600">Upgrade your password for enhanced safety</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-10"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-10"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleSavePassword}
                  disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'SAVE PASSWORD'}
                </button>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Company Information</h2>
                <p className="mt-1 text-sm text-gray-600">Manage your company details</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Acme Inc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="E-Commerce"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="United States"
                  />
                </div>
                
                <button
                  onClick={handleSaveCompanyInfo}
                  disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'SAVE CHANGES'}
                </button>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
                <p className="mt-1 text-sm text-gray-600">Choose how you receive alerts</p>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.newOrders}
                    onChange={(e) => setNotifications({ ...notifications, newOrders: e.target.checked })}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">New Orders</div>
                    <div className="text-sm text-gray-600">Get notified when new orders arrive.</div>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.fulfillmentAlerts}
                    onChange={(e) => setNotifications({ ...notifications, fulfillmentAlerts: e.target.checked })}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Fulfillment Alerts</div>
                    <div className="text-sm text-gray-600">Alerts for unfulfilled or delayed orders.</div>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.systemUpdates}
                    onChange={(e) => setNotifications({ ...notifications, systemUpdates: e.target.checked })}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">System Updates</div>
                    <div className="text-sm text-gray-600">Important system maintenance notices.</div>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.teamActions}
                    onChange={(e) => setNotifications({ ...notifications, teamActions: e.target.checked })}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Team Actions</div>
                    <div className="text-sm text-gray-600">Notifications of team member activities.</div>
                  </div>
                </label>
                
                <button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'SAVE PREFERENCES'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Integration Tab */}
        {activeTab === 'integration' && (() => {
          const integrationsInfo = (userData as any)?.onboardingInfo?.integrationsInfo || {};
          const isShopifyConnected = !!integrationsInfo.shopifyLink;
          const isShipStationConnected = !!integrationsInfo.shipstationLink;
          const billingStatus = (userData as any)?.billing?.status || (userData as any)?.paymentStatus;
          const isStripeConnected = billingStatus === 'active' || billingStatus === 'paid' || !!(userData as any)?.billing?.stripeCustomerId;
          
          // Check if user is COO (case-insensitive)
          const userRole = userData?.role?.toLowerCase();
          const isCOO = userRole === 'coo';

          const shopifyWebhookUrl = integrationsInfo.shopifyLink || '';
          const shipstationWebhookUrl = integrationsInfo.shipstationLink || '';

          return (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#020F3F]">Integration</h2>
                <p className="mt-1 text-sm text-gray-600">Upgrade your password for enhanced safety</p>
              </div>

              {/* Shopify Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-[#020F3F]">Shopify</h3>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium w-fit ${
                      isShopifyConnected 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {isShopifyConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (isShopifyConnected) {
                        setOpenModal('shopify');
                      } else {
                        router.push('/onboarding/integrations');
                      }
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-md transition-colors"
                  >
                    MANAGE
                  </button>
                </div>
              </div>

              {/* Ship Station Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-[#020F3F]">Ship Station</h3>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium w-fit ${
                      isShipStationConnected 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {isShipStationConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (isShipStationConnected) {
                        setOpenModal('shipstation');
                      } else {
                        router.push('/onboarding/integrations');
                      }
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-md transition-colors"
                  >
                    MANAGE
                  </button>
                </div>
              </div>

              {/* Stripe Card - Only show if user is not COO */}
              {!isCOO && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h3 className="text-lg font-semibold text-[#020F3F]">Stripe</h3>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium w-fit ${
                        isStripeConnected 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {isStripeConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    {isStripeConnected ? (
                      <button
                        onClick={() => router.push('/payment')}
                        className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-2.5 rounded-md border-2 border-gray-300 transition-colors"
                      >
                        CONNECTED
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push('/payment')}
                        className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-2.5 rounded-md border-2 border-gray-300 transition-colors"
                      >
                        CONNECT
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Webhook URL Modal */}
              {openModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setOpenModal(null)}>
                  <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-[#020F3F]">
                        {openModal === 'shopify' ? 'Shopify' : 'Ship Station'} Webhook URL
                      </h3>
                      <button
                        onClick={() => setOpenModal(null)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Webhook URL Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Webhook URL
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={openModal === 'shopify' ? shopifyWebhookUrl : shipstationWebhookUrl}
                            readOnly
                            className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => handleCopyWebhook(openModal === 'shopify' ? shopifyWebhookUrl : shipstationWebhookUrl, openModal)}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2.5 rounded-md transition-colors flex items-center space-x-2"
                          >
                            {copied === openModal ? (
                              <>
                                <Check className="h-5 w-5" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-5 w-5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Instructions and Video - Two Column Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Instructions Column */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-3 text-sm">Setup Instructions</h4>
                          <ol className="space-y-2 text-xs text-blue-800 list-decimal list-inside">
                            <li>Copy the webhook URL above</li>
                            <li>Go to your {openModal === 'shopify' ? 'Shopify' : 'Ship Station'} admin panel</li>
                            <li>Navigate to Settings → Webhooks</li>
                            <li>Click "Create webhook" or "Add webhook"</li>
                            <li>Paste the copied URL in the webhook URL field</li>
                            <li>Select the events you want to listen to:
                              <ul className="list-disc list-inside ml-4 mt-1">
                                {openModal === 'shopify' ? (
                                  <>
                                    <li>Order creation</li>
                                    <li>Order updates</li>
                                    <li>Order fulfillment</li>
                                  </>
                                ) : (
                                  <>
                                    <li>Order shipped</li>
                                    <li>Tracking updates</li>
                                    <li>Order status changes</li>
                                  </>
                                )}
                              </ul>
                            </li>
                            <li>Save the webhook</li>
                            <li>Test the connection by creating a test order</li>
                          </ol>
                        </div>

                        {/* Video Column */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3 text-sm">Video Tutorial</h4>
                          <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                            <div className="text-center p-4">
                              <div className="w-16 h-16 mx-auto mb-3 bg-orange-500 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                              </div>
                              <p className="text-xs text-gray-600 font-medium">Video Tutorial</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {openModal === 'shopify' ? 'Shopify' : 'Ship Station'} Webhook Setup
                              </p>
                              <p className="text-xs text-gray-400 mt-2">Coming Soon</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-3 text-center">
                            Watch this video to learn how to set up your webhook integration step by step.
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3 pt-2">
                        <button
                          onClick={() => setOpenModal(null)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-2.5 rounded-md transition-colors text-sm"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => {
                            handleCopyWebhook(openModal === 'shopify' ? shopifyWebhookUrl : shipstationWebhookUrl, openModal);
                          }}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-md transition-colors flex items-center space-x-2 text-sm"
                        >
                          {copied === openModal ? (
                            <>
                              <Check className="h-5 w-5" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-5 w-5" />
                              <span>Copy URL</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Billing Tab */}
        {activeTab === 'billing' && permissions.canManageBilling && (() => {
          const billingData = (userData as any)?.billing || {};
          const planName = billingData.plan || userData?.subscriptionTier || 'basic';
          const planPrice = planName === 'basic' ? 29.99 : planName === 'pro' ? 99.99 : 299.99;
          const planDisplayName = planName === 'basic' ? 'Basic Plan' : planName === 'pro' ? 'Pro Plan' : 'Professional';
          
          // Calculate next billing date (30 days from payment date or current date)
          const paymentDate = billingData.paymentDate ? new Date(billingData.paymentDate) : new Date();
          const nextBillingDate = new Date(paymentDate);
          nextBillingDate.setDate(nextBillingDate.getDate() + 30);
          
          // Mock data for invoices and payment methods
          const invoices = [
            { id: 'INV-2025-001', description: `${planDisplayName} - January 2025`, amount: planPrice, status: 'paid', date: '2025-01-01' },
            { id: 'INV-2025-002', description: `${planDisplayName} - February 2025`, amount: planPrice, status: 'pending', date: '2025-02-01' },
            { id: 'INV-2025-003', description: `${planDisplayName} - March 2025`, amount: planPrice, status: 'paid', date: '2025-03-01' },
          ];
          
          const paymentMethods = [
            { id: '1', type: 'Visa', last4: '4242', expiry: '12/26', isDefault: true, status: 'Order Created' },
            { id: '2', type: 'Mastercard', last4: '5555', expiry: '12/26', isDefault: false },
          ];

          const handleUpgradePlan = () => {
            router.push('/payment');
          };

          const handleAddPaymentMethod = async () => {
            // Open Stripe billing portal or redirect to payment page
            const stripeCustomerId = (userData as any)?.stripeCustomerId || billingData.stripeCustomerId;
            if (stripeCustomerId && user) {
              try {
                const { getApiUrl } = await import('@/lib/utils');
                const response = await fetch(getApiUrl('/api/stripe/billing-portal'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user.uid, stripeCustomerId }),
                });
                const data = await response.json();
                if (data.url) {
                  window.location.href = data.url;
                } else {
                  router.push('/payment');
                }
              } catch (err) {
                console.error('Failed to open billing portal:', err);
                router.push('/payment');
              }
            } else {
              router.push('/payment');
            }
          };

          const handleDeletePaymentMethod = (id: string) => {
            // TODO: Implement payment method deletion via Stripe API
            console.log('Delete payment method:', id);
          };

          const handleDownloadInvoice = (invoiceId: string) => {
            // TODO: Implement invoice download
            console.log('Download invoice:', invoiceId);
          };

          return (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
                  <p className="mt-2 text-sm text-gray-600">Manage your subscription and payment methods</p>
                </div>
                <button
                  onClick={handleUpgradePlan}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-md transition-colors"
                >
                  UPGRADE PLAN
                </button>
              </div>

              {/* Subscription Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Plan Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-bold text-gray-900">{planDisplayName}</p>
                      <p className="text-sm text-gray-600 mt-1">Orders Today</p>
                      <p className="text-sm font-semibold text-gray-900 mt-2">${planPrice.toFixed(2)}/month</p>
                    </div>
                  </div>
                </div>

                {/* Next Billing Date Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-bold text-gray-900">
                        {nextBillingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Next Billing Date</p>
                      <p className="text-sm font-semibold text-orange-600 mt-2">Auto-renewal enabled</p>
                    </div>
                  </div>
                </div>

                {/* Total Invoices Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
                      <p className="text-sm text-gray-600 mt-1">Total Invoices</p>
                      <p className="text-sm font-semibold text-green-600 mt-2">All time</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Payment Methods</h2>
                    <p className="mt-1 text-sm text-gray-600">Manage your payment methods</p>
                  </div>
                  <button
                    onClick={handleAddPaymentMethod}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>ADD PAYMENT METHOD</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <CreditCard className="h-6 w-6 text-gray-400" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{method.type} .... {method.last4}</span>
                            {method.status && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                {method.status}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Expires {method.expiry}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {!method.isDefault && (
                          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                            SET AS DEFAULT
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice History Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Invoice History</h2>
                  <p className="mt-1 text-sm text-gray-600">View and download your invoices</p>
                </div>

                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-gray-900">{invoice.id}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              invoice.status === 'paid' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{invoice.description}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm font-semibold text-gray-900">${invoice.amount.toFixed(2)}</span>
                            <span className="text-sm text-gray-500">{invoice.date}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </DashboardLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    }>
      <SettingsContent />
    </Suspense>
  );
}

