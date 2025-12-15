import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
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

