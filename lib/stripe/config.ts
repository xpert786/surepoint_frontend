// Conditional import to avoid evaluating Stripe module during build
// We'll use require() inside the function for runtime initialization
let StripeClass: any = null;
let stripeInstance: any = null;

// Check if we're in build mode (Vercel sets NEXT_PHASE during build)
// Also check for other build indicators
const isBuildTime = 
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV;

// Create a reusable error proxy factory
function createErrorProxy(): any {
  const errorMessage = 
    'STRIPE_SECRET_KEY is not set in environment variables. ' +
    'Please add STRIPE_SECRET_KEY to your Vercel project settings under Environment Variables.';
  
  return new Proxy({} as any, {
    get(_target, prop) {
      // Return another proxy for nested access (e.g., checkout.sessions.create)
      return createErrorProxy();
    },
    apply(_target, _thisArg, _args) {
      throw new Error(errorMessage);
    },
  });
}

function loadStripe() {
  if (!StripeClass) {
    // Use require for conditional loading - only loads at runtime
    // Wrap in try-catch to handle any module loading issues
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const stripeModule = require('stripe');
      StripeClass = stripeModule.default || stripeModule;
    } catch (error) {
      // If stripe module can't be loaded, return null
      // This will be handled in getStripe
      return null;
    }
  }
  return StripeClass;
}

export function getStripe(): any {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  // During build time, if env var is missing, return a proxy that fails gracefully
  // This allows the build to complete without errors
  if (!secretKey && isBuildTime) {
    return createErrorProxy();
  }

  // At runtime, initialize Stripe instance
  if (!stripeInstance) {
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    
    const Stripe = loadStripe();
    if (!Stripe) {
      throw new Error('Failed to load Stripe module. Please ensure stripe package is installed.');
    }
    
    try {
      stripeInstance = new Stripe(secretKey, {
        apiVersion: '2025-10-29.clover',
        typescript: true,
      });
    } catch (error: any) {
      throw new Error(`Failed to initialize Stripe: ${error.message}`);
    }
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

