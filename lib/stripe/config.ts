import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors when env vars are not set
let stripeInstance: Stripe | null = null;

// Check if we're in build mode (Vercel sets NEXT_PHASE during build)
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    // During build time, if env var is missing, return a proxy that fails gracefully
    // This allows the build to complete without errors
    if (!secretKey) {
      if (isBuildTime) {
        // Return a proxy that will throw a helpful error when actually used at runtime
        // This proxy handles all Stripe API calls (checkout.sessions, billingPortal.sessions, etc.)
        const createErrorProxy = (): any => {
          return new Proxy({} as any, {
            get() {
              return createErrorProxy();
            },
            apply() {
              throw new Error(
                'STRIPE_SECRET_KEY is not set in environment variables. ' +
                'Please add STRIPE_SECRET_KEY to your Vercel project settings under Environment Variables.'
              );
            },
          });
        };
        return createErrorProxy() as Stripe;
      }
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

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

