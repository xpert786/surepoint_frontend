import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PLANS } from '@/lib/stripe/config';

export const dynamic = 'force-dynamic';

/**
 * Get the correct base URL from request headers (handles nginx proxy)
 */
function getBaseUrl(request: NextRequest): string {
  // Try to get from environment variable first (for production)
  const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;
  if (envBaseUrl) {
    return envBaseUrl;
  }

  // Get from forwarded headers (nginx proxy)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('host');

  // Use forwarded headers if available (production behind nginx)
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // Fallback to host header
  if (host) {
    const protocol = request.headers.get('x-forwarded-proto') || 
                     (request.url.startsWith('https') ? 'https' : 'http');
    return `${protocol}://${host}`;
  }

  // Last resort: use nextUrl (might be localhost in production)
  return request.nextUrl.origin;
}

/**
 * Create Stripe Checkout Session
 * Frontend calls this → Returns Checkout URL → Redirect user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan = 'basic', userId, stripeCustomerId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Stripe Customer ID should be passed from client
    // If not provided, create checkout without customer (will create one automatically)
    if (!stripeCustomerId) {
      console.warn('No Stripe Customer ID provided, checkout will create customer automatically');
    }

    const selectedPlan = PLANS[plan as keyof typeof PLANS] || PLANS.basic;

    // Create Stripe Checkout Session
    const sessionConfig: any = {
      payment_method_types: ['card'],
      mode: 'payment', // Use 'subscription' for recurring payments
      customer_creation: 'always',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPlan.name,
              description: selectedPlan.features.join(', '),
            },
            unit_amount: Math.round(selectedPlan.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${getBaseUrl(request)}/surepoint-frontend/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl(request)}/surepoint-frontend/payment`,
      metadata: {
        userId: userId, // Firebase user ID
        firebaseUserId: userId, // Backup field
        plan: plan,
      },
      payment_intent_data: {
        metadata: {
          userId: userId, // Also add to payment intent as backup
          firebaseUserId: userId,
          plan: plan,
        },
      },
    };
    
    console.log('📝 Creating checkout session with metadata:', {
      userId,
      plan,
      customer: stripeCustomerId || 'new customer',
    });

    // Add customer if provided, otherwise Stripe will create one
    if (stripeCustomerId) {
      sessionConfig.customer = stripeCustomerId;
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ 
      success: true,
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

