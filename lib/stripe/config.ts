import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors when env vars are not set
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

// Export for backward compatibility (lazy getter via proxy)
// This allows the module to load without throwing during build
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripe();
    const value = instance[prop as keyof Stripe];
    // If it's a function or object, bind it properly
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Subscription plans
export const PLANS = {
  basic: {
    name: 'Basic Plan',
    price: 29.99,
    priceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic', // Set this in .env
    features: [
      'Up to 100 orders/month',
      'Basic dashboard',
      'Email support',
    ],
  },
  pro: {
    name: 'Pro Plan',
    price: 99.99,
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro', // Set this in .env
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
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise', // Set this in .env
    features: [
      'Everything in Pro',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
};

