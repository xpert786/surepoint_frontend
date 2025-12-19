import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';

export const dynamic = 'force-dynamic';

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
      return_url: `${request.nextUrl.origin}/surepoint-frontend/dashboard`,
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

