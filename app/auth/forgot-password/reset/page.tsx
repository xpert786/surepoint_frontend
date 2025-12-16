'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import deliveryMan from '../../../../public/assets/delivery-man.png';
import logo from '../../../../public/assets/logo.png';

export default function CreateNewPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement password reset logic here
      // This would typically use Firebase's confirmPasswordReset with the OTP code
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to login page after successful password reset
      router.push('/auth/login');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-white">
      <div className="w-full h-full flex flex-col lg:flex-row">
        {/* Left Panel - Form */}
        <div 
          className="w-full lg:w-[40%] xl:w-[45%] bg-white flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 h-full overflow-y-auto"
          style={{ paddingLeft: '80px', paddingRight: '80px' }}
        >
          {/* Logo */}
          <div className="mb-8">
            <Image src={logo} alt="Surepoint" width={200} height={80} className="-ml-2" />
          </div>

          {/* Welcome Message */}
          <div className="mb-1">
            <p className="text-[#020F3F] text-sm font-medium">Hello !!!</p>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-[#020F3F] mb-6">
            Create New Password
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-xs font-medium text-gray-500 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 bg-[#E8F4F8] border border-[#C0DBEA] rounded-lg text-sm text-[#020F3F] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#020F3F] hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 3m3.29 3.29L3 3" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-500 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 bg-[#E8F4F8] border border-[#C0DBEA] rounded-lg text-sm text-[#020F3F] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#020F3F] hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 3m3.29 3.29L3 3" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-xs font-medium bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-40 bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wider shadow-md"
            >
              {isLoading ? 'Submitting...' : (
                <>
                  SUBMIT
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="w-full max-w-md text-center space-y-2 mt-6">
            <p className="text-xs text-gray-500">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-orange-400 hover:text-orange-500 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Right Panel - Illustration */}
        <div className="hidden lg:flex lg:w-[40%] xl:w-[55%] items-center justify-center relative overflow-hidden h-screen">
          <div className="w-full h-full relative">
            {/* Background div */}
            <div className="absolute flex items-center justify-end w-full h-full bg-[#C0DBEA] left-80">
            </div>
            {/* Image above the div */}
            <div className="relative w-full h-full flex items-center justify-end p-2 lg:p-4 z-10">
              <Image 
                src={deliveryMan} 
                className="w-full h-full object-contain" 
                alt="Delivery Man with packages and delivery van" 
                width={494} 
                height={1024}
                priority
                quality={95}
                style={{
                  objectFit: 'contain',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


