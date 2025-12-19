'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getApiUrl } from '@/lib/utils';

function PaymentSuccessContent() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Wait for auth to load before checking
    if (loading) {
      return;
    }

    // If not authenticated, redirect to login
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('No session ID found');
      setIsVerifying(false);
      return;
    }

    // Verify payment and update user status
    const verifyPayment = async () => {
      try {
        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify payment with Stripe first
        let paymentVerified = false;
        let sessionData: any = null;
        try {
          const verifyResponse = await fetch(`/surepoint-frontend/api/stripe/verify-session?session_id=${sessionId}`);
          sessionData = await verifyResponse.json();
          paymentVerified = sessionData.paid === true;
        } catch (err) {
          console.error('Error verifying session:', err);
        }

        // Check billing status (might be updated by webhook)
        const billingStatus = userData?.billing?.status || userData?.paymentStatus;
        
        // If payment is verified but billing not updated, manually update it
        if (paymentVerified && billingStatus !== 'active' && billingStatus !== 'paid') {
          console.log('💳 Payment verified but billing not updated, manually updating...');
          try {
            const updateResponse = await fetch('/surepoint-frontend/api/stripe/update-billing-after-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId: sessionId,
                userId: user?.uid,
              }),
            });

            if (updateResponse.ok) {
              const updateResult = await updateResponse.json();
              console.log('✅ Manually updated billing status:', updateResult);
              console.log('🔄 Refreshing user data...');
              await refreshUserData();
              // Wait a moment for the context to update
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Verify the update worked
              const updatedUserData = await fetch(getApiUrl(`/api/debug/user-billing?userId=${user?.uid}`));
              if (updatedUserData.ok) {
                const debugData = await updatedUserData.json();
                console.log('📊 Current billing status in DB:', debugData.data);
              }
            } else {
              let errorData;
              try {
                errorData = await updateResponse.json();
              } catch {
                errorData = { error: `HTTP ${updateResponse.status}: ${updateResponse.statusText}` };
              }
              console.error('❌ Failed to manually update billing:', errorData);
              console.error('Response status:', updateResponse.status);
              // Don't fail the flow - webhook might still process it
            }
          } catch (updateErr) {
            console.error('❌ Error manually updating billing:', updateErr);
          }
        }
        
        if (paymentVerified || billingStatus === 'active' || billingStatus === 'paid') {
          // Payment is verified, refresh user data and redirect
          setIsVerifying(false);
          
          // Refresh user data to get latest billing status
          try {
            await refreshUserData();
            // Wait a moment for the context to update
            await new Promise(resolve => setTimeout(resolve, 500));

            // Mark onboarding flag on user
            if (user?.uid) {
              try {
                await updateDoc(doc(db, 'users', user.uid), {
                  isOnboarding: false,
                });
                await refreshUserData();
              } catch (err) {
                console.error('Error updating onboarding flag:', err);
              }
            }
          } catch (err) {
            console.error('Error refreshing user data:', err);
          }
          
          // Redirect to onboarding
          router.push('/onboarding/company');
        } else {
          // Poll for payment status update
          let attempts = 0;
          const maxAttempts = 15; // Increased attempts

          const checkStatus = setInterval(async () => {
            attempts++;
            try {
              // Verify with Stripe
              const verifyResponse = await fetch(`/surepoint-frontend/api/stripe/verify-session?session_id=${sessionId}`);
              const verifyData = await verifyResponse.json();

              if (verifyData.paid) {
                clearInterval(checkStatus);
                setIsVerifying(false);
                
                // Refresh user data to get latest billing status
                try {
                  await refreshUserData();
                  // Wait a moment for the context to update
                  await new Promise(resolve => setTimeout(resolve, 500));

                  // Mark onboarding flag on user
                  if (user?.uid) {
                    try {
                      await updateDoc(doc(db, 'users', user.uid), {
                        isOnboarding: false,
                      });
                      await refreshUserData();
                    } catch (err) {
                      console.error('Error updating onboarding flag:', err);
                    }
                  }
                } catch (err) {
                  console.error('Error refreshing user data:', err);
                }
                
                // Redirect to onboarding
                router.push('/onboarding/company');
              } else if (attempts >= maxAttempts) {
                clearInterval(checkStatus);
                setError('Payment verification is taking longer than expected. Your payment may still be processing. Please refresh the page in a moment.');
                setIsVerifying(false);
              }
            } catch (err) {
              console.error('Error verifying payment:', err);
              if (attempts >= maxAttempts) {
                clearInterval(checkStatus);
                setError('Unable to verify payment. Please check your dashboard or contact support.');
                setIsVerifying(false);
              }
            }
          }, 2000);
        }
      } catch (err: any) {
        console.error('Payment verification error:', err);
        setError('Failed to verify payment. Please contact support.');
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, user, userData, loading, router, refreshUserData]);

  // Show loading while auth is loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Loading...
              </h2>
              <p className="text-gray-600">
                Please wait
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Verifying Payment...
              </h2>
              <p className="text-gray-600">
                Please wait while we confirm your payment
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-600 mb-4">{error}</div>
              <Button onClick={() => router.push('/payment')}>
                Back to Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Your payment has been processed successfully. Let&apos;s finish setting up your account.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to onboarding...
            </p>
            <Button
              onClick={async () => {
                // Refresh user data before redirecting
                try {
                  await refreshUserData();
                  await new Promise(resolve => setTimeout(resolve, 300));
                } catch (err) {
                  console.error('Error refreshing user data:', err);
                }
                router.push('/onboarding/company');
              }}
              className="w-full"
            >
              Continue Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Loading...
              </h2>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

