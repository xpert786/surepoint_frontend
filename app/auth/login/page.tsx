'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import deliveryMan from '../../../public/assets/delivery-man.png';
import Image from 'next/image';
import logo from '../../../public/assets/logo.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signIn, signUp, userData, loading: authLoading, refreshUserData } = useAuth();
  const router = useRouter();
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Handle redirect after login based on billing status
  useEffect(() => {
    if (justLoggedIn && userData && !authLoading) {
      const userRole = userData.role?.toLowerCase();
      const isAdminOrCOO = userRole === 'admin' || userRole === 'coo';
      
      // Skip billing check for admin/COO roles
      if (!isAdminOrCOO) {
        const billingStatus = userData.billing?.status || userData.paymentStatus;
        
        // If payment is not active/paid, redirect to payment page
        if (billingStatus !== 'active' && billingStatus !== 'paid') {
          router.push('/payment');
          setJustLoggedIn(false);
          return;
        }
      }
      
      // If billing is paid or user is admin/COO, redirect to dashboard
      router.push('/dashboard');
      setJustLoggedIn(false);
    }
  }, [userData, justLoggedIn, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Validate passwords match
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        await signUp(email, password, name);
        // After sign up, redirect to payment page first
        router.push('/payment');
      } else {
        await signIn(email, password);
        // Refresh userData after sign in
        await refreshUserData();
        // Set flag to trigger redirect check in useEffect
        setJustLoggedIn(true);
        // The useEffect will handle the redirect based on billing status
      }
    } catch (err: unknown) {
      console.error('Authentication error:', err);

      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'An error occurred';

      setError(errorMessage);

      // Log to console for debugging
      const errCode = (err as { code?: unknown } | null)?.code;
      if (errCode) {
        console.error('Auth error code:', errCode);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden">
      <div className="w-full h-full flex flex-col lg:flex-row">
      {/* Left Panel - Login Form */}
      <div className={`w-full lg:w-[40%] xl:w-[45%] bg-white flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 h-full overflow-y-auto pl-20 ${isSignUp ? 'py-2 sm:py-3' : 'py-3 sm:py-4 md:py-6'}`}
      style={{
        paddingLeft: '100px'
      }}
      >
        {/* Logo */}
            <div className="m-0 p-0">
                <Image src={logo} alt="Surepoint" width={200} height={80} className="" />
            </div>

        {/* Welcome Message */}
        <div className={isSignUp ? 'mb-0.5' : 'mb-1'}>
          <p className="text-[#020F3F] text-xs sm:text-sm font-medium" >Welcome back !!!</p>
        </div>

        {/* Heading */}
        <h1 className={`text-xl sm:text-2xl lg:text-2xl font-bold text-gray-800 cursor-pointer ${isSignUp ? 'mb-2' : 'mb-3 sm:mb-4'}`}>
          {isSignUp ? 'Sign Up' : 'Log In'}
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className={`w-full max-w-md ${isSignUp ? 'space-y-3' : 'space-y-3 sm:space-y-2'}`}>
          {isSignUp && (
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-0.5">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
                className="w-full px-3 py-1.5 bg-[#E8F4F8] border border-[#C0DBEA] rounded-lg text-sm text-[#5B9BD5] placeholder:text-[#5B9BD5]/60 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className={`block text-xs font-medium text-gray-700 ${isSignUp ? 'mb-0.5' : 'mb-1'}`}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="login@gmail.com"
              className={`w-full px-3 bg-[#E8F4F8] border border-[#C0DBEA] rounded-lg text-sm text-[#5B9BD5] placeholder:text-[#5B9BD5]/60 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent ${isSignUp ? 'py-1.5' : 'py-2'}`}
            />
          </div>

          <div>
            <label htmlFor="password" className={`block text-xs font-medium text-gray-700 ${isSignUp ? 'mb-0.5' : 'mb-1'}`}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className={`w-full px-3 bg-[#E8F4F8] border border-[#C0DBEA] rounded-lg text-sm text-[#5B9BD5] placeholder:text-[#5B9BD5]/60 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent pr-10 ${isSignUp ? 'py-1.5' : 'py-2'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 3m3.29 3.29L3 3" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password - Only show on sign up */}
          {isSignUp && (
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-0.5">
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
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 bg-[#E8F4F8] border border-[#C0DBEA] rounded-lg text-sm text-[#5B9BD5] placeholder:text-[#5B9BD5]/60 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 3m3.29 3.29L3 3" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Remember Me & Forgot Password - Hide on sign up */}
          {!isSignUp && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-0">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 text-orange-500 border-gray-300 rounded focus:ring-orange-400"
                />
                <span className="ml-1.5 text-xs text-gray-600">Remember Me</span>
              </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Forgot Password?
            </Link>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              <div className="font-medium">Error</div>
              <div className="mt-0.5">{error}</div>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer ${isSignUp ? 'py-2' : 'py-2.5'}`}
          >
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <>
                <span>{isSignUp ? 'SIGN UP' : 'LOGIN'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Social Login Separator - Hide on sign up */}
        {!isSignUp && (
          <div className="w-full max-w-md mt-3 sm:mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="flex justify-center gap-4 mt-3">
              <button
                type="button"
                className="w-9 h-9 rounded-full border-2 border-[#1e3a5f] bg-white flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                aria-label="Sign in with Google"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>
             </div>
          </div>
        )}

        {/* Sign Up Link */}
        <div className={`w-full max-w-md text-center ${isSignUp ? 'mt-2' : 'mt-3 sm:mt-4'}`}>
          <p className="text-xs text-gray-600">
            {isSignUp ? 'Already have an account? ' : "Don't have an account yet? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setConfirmPassword('');
              }}
              className="text-orange-500 font-medium hover:text-orange-600 cursor-pointer"
            >
              {isSignUp ? 'Sign in' : 'Sign up for free'}
            </button>
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

