import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Client-accessible route to update billing after payment
 * Called from payment success page when webhook hasn't processed yet
 * Verifies the session is paid before updating
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId } = body;

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Session ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify the session is actually paid
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeError: any) {
      console.error('Error retrieving Stripe session:', stripeError);
      return NextResponse.json(
        { error: 'Failed to verify payment session', details: stripeError.message },
        { status: 500 }
      );
    }
    
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed', status: session.payment_status },
        { status: 400 }
      );
    }

    // Verify userId matches session metadata
    const sessionUserId = session.metadata?.userId || session.metadata?.firebaseUserId;
    if (sessionUserId && sessionUserId !== userId) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    const plan = session.metadata?.plan || 'basic';
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || null;

    if (!customerId) {
      console.warn('⚠️ No customer ID in session:', session.id);
    }

    // Update user billing using Admin SDK
    let adminDb;
    try {
      // Debug: Check if environment variable is loaded
      const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
      console.log('🔍 FIREBASE_SERVICE_ACCOUNT present:', hasServiceAccount);
      if (!hasServiceAccount) {
        console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable is not set!');
        console.error('Please ensure .env.local exists and contains FIREBASE_SERVICE_ACCOUNT');
        console.error('You may need to restart your Next.js dev server after creating .env.local');
      }
      
      adminDb = getAdminDb();
    } catch (adminError: any) {
      console.error('❌ Error initializing Admin SDK:', adminError);
      console.error('Error message:', adminError.message);
      console.error('Error stack:', adminError.stack);
      return NextResponse.json(
        { 
          error: 'Failed to initialize Firebase Admin', 
          details: adminError.message,
          hint: 'Make sure FIREBASE_SERVICE_ACCOUNT is set in .env.local and restart the dev server'
        },
        { status: 500 }
      );
    }

    const userDocRef = adminDb.collection('users').doc(userId);
    
    // Get current document
    let currentDoc;
    try {
      currentDoc = await userDocRef.get();
    } catch (firestoreError: any) {
      console.error('Error reading Firestore document:', firestoreError);
      return NextResponse.json(
        { error: 'Failed to read user document', details: firestoreError.message },
        { status: 500 }
      );
    }

    if (!currentDoc.exists) {
      return NextResponse.json(
        { error: 'User document not found' },
        { status: 404 }
      );
    }

    const currentData = currentDoc.data() || {};
    const existingBilling = currentData.billing || {};

    // Build update object
    const firestoreUpdates: any = {
      updatedAt: FieldValue.serverTimestamp(),
      paymentStatus: 'paid',
      subscriptionTier: plan,
      paymentDate: FieldValue.serverTimestamp(),
      billing: {
        ...existingBilling,
        status: 'active',
        plan: plan,
        paymentDate: FieldValue.serverTimestamp(),
        stripeSessionId: sessionId,
      },
    };

    // Only add customer ID if it exists
    if (customerId) {
      firestoreUpdates.stripeCustomerId = customerId;
      firestoreUpdates.billing.stripeCustomerId = customerId;
    }

    console.log('🔄 Updating user billing after payment verification:', userId);
    console.log('📝 Updates to apply:', JSON.stringify(firestoreUpdates, null, 2));
    console.log('📋 Session metadata:', {
      userId: session.metadata?.userId,
      firebaseUserId: session.metadata?.firebaseUserId,
      plan: session.metadata?.plan,
    });

    try {
      await userDocRef.update(firestoreUpdates);
      console.log('✅ Firestore update completed for user:', userId);
    } catch (updateError: any) {
      console.error('❌ Error updating Firestore:', updateError);
      console.error('Error code:', updateError.code);
      console.error('Error message:', updateError.message);
      return NextResponse.json(
        {
          error: 'Failed to update Firestore',
          details: updateError.message,
          code: updateError.code,
        },
        { status: 500 }
      );
    }

    // Verify the update
    let updatedDoc;
    try {
      updatedDoc = await userDocRef.get();
    } catch (readError: any) {
      console.error('Error reading updated document:', readError);
      // Still return success if update worked but read failed
      return NextResponse.json({
        success: true,
        message: 'Billing updated successfully (verification read failed)',
      });
    }

    const updatedData = updatedDoc.data() || {};

    console.log('✅ Billing updated successfully');
    console.log('📊 Updated values:', {
      billingStatus: updatedData.billing?.status,
      paymentStatus: updatedData.paymentStatus,
      plan: updatedData.billing?.plan,
      subscriptionTier: updatedData.subscriptionTier,
    });
    console.log('📄 Full updated document:', JSON.stringify(updatedData, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Billing updated successfully',
      billingStatus: updatedData.billing?.status,
      paymentStatus: updatedData.paymentStatus,
    });
  } catch (error: any) {
    console.error('❌ Unexpected error updating billing after payment:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update billing',
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

