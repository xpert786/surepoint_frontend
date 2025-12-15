import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { User } from '@/types';

export async function checkPaymentStatus(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      return userData.paymentStatus === 'paid';
    }
    return false;
  } catch (error) {
    console.error('Error checking payment status:', error);
    return false;
  }
}

export async function getUserPaymentStatus(userId: string): Promise<User['paymentStatus']> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      return userData.paymentStatus || 'pending';
    }
    return 'pending';
  } catch (error) {
    console.error('Error getting payment status:', error);
    return 'pending';
  }
}

export async function updatePaymentStatus(
  userId: string,
  status: User['paymentStatus'],
  stripeCustomerId?: string,
  subscriptionTier?: string
): Promise<void> {
  try {
    const updateData: any = {
      paymentStatus: status,
      updatedAt: serverTimestamp(),
    };

    if (stripeCustomerId) {
      updateData.stripeCustomerId = stripeCustomerId;
    }

    if (subscriptionTier) {
      updateData.subscriptionTier = subscriptionTier;
    }

    if (status === 'paid') {
      updateData.paymentDate = serverTimestamp();
    }

    await updateDoc(doc(db, 'users', userId), updateData);
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}

