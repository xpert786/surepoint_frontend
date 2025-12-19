import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Shared function to update user billing status
 * Can be called directly from webhooks or API routes
 * Uses Firebase Admin SDK which bypasses security rules
 */
export async function updateUserBilling(
  userId: string,
  updates: {
    'billing.status'?: string;
    'billing.plan'?: string | null;
    'billing.paymentDate'?: string | null;
    'billing.stripeCustomerId'?: string;
    'billing.stripeSessionId'?: string;
    paymentStatus?: string;
    subscriptionTier?: string;
    paymentDate?: string | null;
    stripeCustomerId?: string;
  }
): Promise<{ success: boolean; billingStatus?: string; paymentStatus?: string }> {
  try {
    // Get Admin Firestore instance (initializes if needed)
    const adminDb = getAdminDb();
    const userDocRef = adminDb.collection('users').doc(userId);
    
    // First, get the current document to merge with existing billing object
    const currentDoc = await userDocRef.get();
    if (!currentDoc.exists) {
      throw new Error('User document not found');
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
      billingUpdates.plan = updates['billing.plan'] ?? null;
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

    return { 
      success: true,
      billingStatus: updatedData.billing?.status,
      paymentStatus: updatedData.paymentStatus,
    };
  } catch (error: any) {
    console.error('Error updating user billing:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
}

