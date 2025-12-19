import { NextRequest, NextResponse } from 'next/server';
import { updateUserBilling } from '@/lib/firebase/billing-update';

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || 'your-secret-key-change-in-production';

/**
 * Internal API route to update user billing status
 * Called by webhook with secret token for security
 * 
 * Uses Firebase Admin SDK which bypasses security rules.
 * This is necessary because webhooks don't have authenticated user context.
 * 
 * Setup: Set FIREBASE_SERVICE_ACCOUNT environment variable with service account JSON
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${INTERNAL_SECRET}`;
    
    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, updates } = body;

    if (!userId || !updates) {
      return NextResponse.json(
        { error: 'userId and updates are required' },
        { status: 400 }
      );
    }

    // Use shared function to update billing
    const result = await updateUserBilling(userId, updates);

    return NextResponse.json({ 
      success: true,
      message: 'User billing updated successfully',
      billingStatus: result.billingStatus,
      paymentStatus: result.paymentStatus,
    });
  } catch (error: any) {
    console.error('Error updating user billing:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update user billing',
        code: error.code,
      },
      { status: 500 }
    );
  }
}

