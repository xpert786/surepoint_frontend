import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

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

    // Get Admin Firestore instance (initializes if needed)
    // Admin SDK bypasses security rules - necessary for webhooks
    const adminDb = getAdminDb();
    const userDocRef = adminDb.collection('users').doc(userId);
    
    // First, get the current document to merge with existing billing object
    const currentDoc = await userDocRef.get();
    if (!currentDoc.exists) {
      return NextResponse.json(
        { error: 'User document not found' },
        { status: 404 }
      );
    }

    const currentData = currentDoc.data() || {};
    
    // Build the update object, handling nested fields properly
    const firestoreUpdates: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Handle top-level fields
    if (updates.paymentStatus !== undefined) {
      firestoreUpdates.paymentStatus = updates.paymentStatus;
    }
    if (updates.subscriptionTier !== undefined) {
      firestoreUpdates.subscriptionTier = updates.subscriptionTier;
    }
    if (updates.paymentDate !== undefined) {
      // If it's a string ISO date, convert it to a Timestamp
      if (typeof updates.paymentDate === 'string') {
        firestoreUpdates.paymentDate = new Date(updates.paymentDate);
      } else if (updates.paymentDate) {
        firestoreUpdates.paymentDate = FieldValue.serverTimestamp();
      } else {
        firestoreUpdates.paymentDate = null;
      }
    }
    if (updates.stripeCustomerId !== undefined) {
      firestoreUpdates.stripeCustomerId = updates.stripeCustomerId;
    }

    // Handle nested billing object - merge with existing billing data
    const existingBilling = currentData.billing || {};
    const billingUpdates: any = {
      ...existingBilling,
    };

    // Update billing fields from the updates object
    if (updates['billing.status'] !== undefined) {
      billingUpdates.status = updates['billing.status'];
    }
    if (updates['billing.plan'] !== undefined) {
      billingUpdates.plan = updates['billing.plan'];
    }
    if (updates['billing.paymentDate'] !== undefined) {
      // If it's a string ISO date, convert it to a Timestamp
      if (typeof updates['billing.paymentDate'] === 'string') {
        billingUpdates.paymentDate = new Date(updates['billing.paymentDate']);
      } else if (updates['billing.paymentDate']) {
        billingUpdates.paymentDate = FieldValue.serverTimestamp();
      } else {
        billingUpdates.paymentDate = null;
      }
    }
    if (updates['billing.stripeCustomerId'] !== undefined) {
      billingUpdates.stripeCustomerId = updates['billing.stripeCustomerId'];
    }
    if (updates['billing.stripeSessionId'] !== undefined) {
      billingUpdates.stripeSessionId = updates['billing.stripeSessionId'];
    }

    firestoreUpdates.billing = billingUpdates;

    console.log('🔄 Updating user billing with Admin SDK:', userId);
    console.log('📝 Updates to apply:', {
      paymentStatus: firestoreUpdates.paymentStatus,
      subscriptionTier: firestoreUpdates.subscriptionTier,
      stripeCustomerId: firestoreUpdates.stripeCustomerId,
      billing: {
        status: billingUpdates.status,
        plan: billingUpdates.plan,
        stripeCustomerId: billingUpdates.stripeCustomerId,
        stripeSessionId: billingUpdates.stripeSessionId,
      },
    });
    
    // Use Admin SDK to update - this bypasses security rules
    await userDocRef.update(firestoreUpdates);
    
    console.log('✅ Firestore update completed');
    
    // Verify the update
    const updatedDoc = await userDocRef.get();
    if (!updatedDoc.exists) {
      throw new Error('User document not found after update');
    }

    const updatedData = updatedDoc.data() || {};
    console.log('✅ User billing updated successfully:', userId);
    console.log('📊 Updated values:', {
      billingStatus: updatedData.billing?.status,
      paymentStatus: updatedData.paymentStatus,
      plan: updatedData.billing?.plan,
      stripeCustomerId: updatedData.stripeCustomerId,
    });

    return NextResponse.json({ 
      success: true,
      message: 'User billing updated successfully',
      billingStatus: updatedData.billing?.status,
      paymentStatus: updatedData.paymentStatus,
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

