import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';

/**
 * Create Stripe Customer when user signs up
 * This should be called after user creation in Firebase Auth
 * Returns the customer ID - client should save it to Firestore
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, name } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      );
    }

    // Create Stripe Customer
    const customer = await stripe.customers.create({
      email,
      name: name || email,
      metadata: {
        firebaseUserId: userId,
      },
    });

    // Return customer ID - client will save it to Firestore
    return NextResponse.json({
      success: true,
      customerId: customer.id,
    });
  } catch (error: any) {
    console.error('Error creating Stripe customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Stripe customer' },
      { status: 500 }
    );
  }
}

