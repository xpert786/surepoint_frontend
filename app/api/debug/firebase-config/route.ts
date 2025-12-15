import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to check Firebase configuration
 * GET /api/debug/firebase-config
 */
export async function GET(request: NextRequest) {
  try {
    // Get Firebase config from environment
    const config = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? `${process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 20)}...` : 'NOT SET',
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
    };

    return NextResponse.json({
      success: true,
      config,
      message: 'Check if projectId matches the Firebase Console project you are viewing',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get config' },
      { status: 500 }
    );
  }
}

