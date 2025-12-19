import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';

export const dynamic = 'force-dynamic';

/**
 * Get the correct base URL from request headers (handles nginx proxy)
 */
function getBaseUrl(request: NextRequest): string {
  // Try to get from environment variable first (for production)
  const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://demosurepoint.unicornaaps.com";
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
 * Create Stripe Billing Portal Session
 * Allows users to manage their subscription, payment methods, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, stripeCustomerId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Stripe Customer ID should be passed from client
    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'Stripe customer ID is required. Please complete a payment first.' },
        { status: 400 }
      );
    }

    // Create billing portal session
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${getBaseUrl(request)}/surepoint-frontend/dashboard`,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Billing portal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}

