'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { CreditCard } from 'lucide-react';
import { getApiUrl } from '@/lib/utils';

export function BillingPortalButton() {
  const { user, userData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpenPortal = async () => {
    if (!user || !userData) {
      setError('You must be logged in');
      return;
    }

    const stripeCustomerId = userData.stripeCustomerId;
    if (!stripeCustomerId) {
      setError('No billing account found');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/surepoint-frontend/api/stripe/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          stripeCustomerId, // Pass from client
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      // Redirect to Stripe Billing Portal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Billing portal error:', err);
      setError(err.message || 'Failed to open billing portal');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleOpenPortal}
        disabled={isLoading}
        variant="outline"
        isLoading={isLoading}
      >
        <CreditCard className="h-4 w-4 mr-2" />
        Manage Billing
      </Button>
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}

