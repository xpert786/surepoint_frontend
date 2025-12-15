'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
// Client-side plans (matches server-side config)
const PLANS = {
  basic: {
    name: 'Basic Plan',
    price: 29.99,
    features: [
      'Up to 100 orders/month',
      'Basic dashboard',
      'Email support',
    ],
  },
  pro: {
    name: 'Pro Plan',
    price: 99.99,
    features: [
      'Unlimited orders',
      'Advanced analytics',
      'Priority support',
      'API access',
    ],
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: 299.99,
    features: [
      'Everything in Pro',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
};
import { Check, CreditCard, Loader2 } from 'lucide-react';

export default function PaymentPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<keyof typeof PLANS>('basic');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    // If billing is already active, redirect to dashboard
    if (!loading && userData) {
      const billingStatus = userData.billing?.status || userData.paymentStatus;
      if (billingStatus === 'active' || billingStatus === 'paid') {
        router.push('/dashboard');
      }
    }
  }, [user, userData, loading, router]);

  const handleCheckout = async () => {
    if (!user || !user.uid) {
      setError('You must be logged in to make a payment');
      return;
    }

    const userId = user.uid;
    const stripeCustomerId = userData?.stripeCustomerId;
    
    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          userId,
          stripeCustomerId, // Pass from client to avoid server-side Firestore access
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600">
            Select a plan to access the Surepoint dashboard
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {Object.entries(PLANS).map(([key, plan]) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${
                selectedPlan === key
                  ? 'ring-2 ring-blue-600 shadow-lg'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedPlan(key as keyof typeof PLANS)}
            >
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={selectedPlan === key ? 'primary' : 'outline'}
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(key as keyof typeof PLANS);
                  }}
                >
                  {selectedPlan === key ? 'Selected' : 'Select Plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
              <CardDescription>
                You'll be redirected to Stripe's secure checkout page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Test Mode:</strong> Use Stripe test card numbers:
                  </p>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>• Success: <code className="bg-blue-100 px-2 py-1 rounded">4242 4242 4242 4242</code></li>
                    <li>• Any future expiry date (e.g., 12/34)</li>
                    <li>• Any 3-digit CVC</li>
                    <li>• Any ZIP code</li>
                  </ul>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  isLoading={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? 'Processing...' : `Continue to Payment - $${PLANS[selectedPlan].price}/month`}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By continuing, you agree to our terms of service and privacy policy.
                  Your payment is secure and encrypted.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

