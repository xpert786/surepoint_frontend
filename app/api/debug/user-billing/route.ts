import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

/**
 * Debug endpoint to check user billing status
 * GET /api/debug/user-billing?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User document not found', userId },
        { status: 404 }
      );
    }

    const userData = userDoc.data() || {};

    return NextResponse.json({
      userId,
      exists: true,
      data: {
        email: userData.email,
        subscriptionTier: userData.subscriptionTier,
        paymentStatus: userData.paymentStatus,
        paymentDate: userData.paymentDate,
        stripeCustomerId: userData.stripeCustomerId,
        billing: userData.billing,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}



