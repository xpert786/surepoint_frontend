'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resetPassword } from '@/lib/firebase/auth';
import deliveryMan from '../../../public/assets/delivery-man.png';
import logo from '../../../public/assets/logo.png';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      await resetPassword(email);
      // Show popup instead of redirecting
      setShowPopup(true);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'An error occurred. Please try again.';
      
      // For security, always show success popup even if user doesn't exist
      // But log the actual error for debugging
      console.error('Password reset error:', err);
      setShowPopup(true);
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
            Forget Password
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-500 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="login@gmail.com"
                className="w-full px-4 py-3 bg-[#BFDCE5] border-none rounded-lg text-sm text-[#020F3F] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Success Message */}
            {message && (
              <div className="text-green-600 text-xs font-medium bg-green-50 p-3 rounded-lg border border-green-200">
                {message}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-xs font-medium bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-40 bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wider shadow-md"
            >
              {isLoading ? 'Sending...' : (
                <>
                  VERIFY EMAIL 
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="w-full max-w-md mt-8 mb-6">
            <div className="relative">
              <div className="relative flex justify-center text-xs">
                <span className="px-2 text-gray-500 font-medium">or continue with</span>
              </div>
            </div>
          </div>


          {/* Footer Links */}
          <div className="w-full max-w-md text-center space-y-2">
            <p className="text-xs text-gray-500">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-orange-400 hover:text-orange-500 font-medium">
                Sign in
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              Don't have an account yet?{' '}
              <Link href="/auth/login" className="text-orange-400 hover:text-orange-500 font-medium">
                Sign up for free
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

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 backdrop-blur-[3px] bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl relative">
            {/* Close Button */}
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Email Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-[#020F3F] text-center mb-3">
              Check Your Email
            </h2>

            {/* Message */}
            <p className="text-sm text-gray-600 text-center mb-6">
              We've sent a password reset link to <span className="font-semibold text-[#020F3F]">{email}</span>. 
              Please check your email and click on the link to reset your password.
            </p>

            {/* Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> If you don't see the email, please check your spam folder. 
                The link will expire in 1 hour.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPopup(false);
                  setEmail('');
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPopup(false);
                  router.push('/auth/login');
                }}
                className="flex-1 bg-orange-400 hover:bg-orange-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

