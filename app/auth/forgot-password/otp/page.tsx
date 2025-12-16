'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import deliveryMan from '../../../../public/assets/delivery-man.png';
import logo from '../../../../public/assets/logo.png';

export default function OTPVerificationPage() {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last character
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('').slice(0, 4);
      setOtp([...newOtp, ...Array(4 - newOtp.length).fill('')].slice(0, 4));
      // Focus the next empty input or the last one
      const nextIndex = Math.min(newOtp.length, 3);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length !== 4) {
      setError('Please enter all 4 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    // TODO: Implement OTP verification logic here
    // For now, simulate API call
    try {
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // If successful, redirect to reset password page
      router.push('/auth/forgot-password/reset');
    } catch (err) {
      setError('Invalid OTP. Please try again.');
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
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
            OTP Verification
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
            {/* OTP Input Fields */}
            <div className="flex gap-3 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el: HTMLInputElement | null) => {
                    if (el) {
                      inputRefs.current[index] = el;
                    }
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-14 h-14 text-center text-xl font-semibold bg-[#E8F4F8] border border-[#C0DBEA] rounded-lg text-[#020F3F] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-xs font-medium bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isLoading || otp.join('').length !== 4}
              className="w-40 bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wider shadow-md"
            >
              {isLoading ? 'Verifying...' : (
                <>
                  VERIFY OTP
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Resend OTP Link */}
          <div className="w-full max-w-md mt-6 text-center">
            <p className="text-xs text-gray-500">
              Didn't receive the code?{' '}
              <button
                type="button"
                className="text-orange-400 hover:text-orange-500 font-medium"
                onClick={() => {
                  // TODO: Implement resend OTP logic
                  console.log('Resend OTP');
                }}
              >
                Resend OTP
              </button>
            </p>
          </div>

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

