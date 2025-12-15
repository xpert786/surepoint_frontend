import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { User, UserRole } from '@/types';

export async function signIn(email: string, password: string) {
  try {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please check your Firebase configuration.');
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    // Provide more helpful error messages
    let errorMessage = error.message;
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection.';
    }
    throw new Error(errorMessage);
  }
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  role: UserRole = 'client',
  clientId?: string
) {
  try {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please check your Firebase configuration.');
    }

    // Validate inputs
    if (!email || !email.trim()) {
      throw new Error('Email is required.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    if (!name || !name.trim()) {
      throw new Error('Name is required.');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    // Validate Firestore is initialized
    if (!db) {
      throw new Error('Firestore is not initialized. Please check your Firebase configuration.');
    }

    // Create user document in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    
    const userData = {
      email: email.trim(),
      name: name.trim(),
      role: role || 'client',
      ...(clientId && { clientId }), // Only include if provided
      paymentStatus: 'pending', // Default to pending payment
      billing: {
        status: 'inactive' as const, // inactive, active, cancelled, failed
        plan: null,
        paymentDate: null,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      console.log('Creating user document in Firestore:', user.uid);
      console.log('User data to save:', {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        clientId: userData.clientId,
        paymentStatus: userData.paymentStatus,
        billing: userData.billing,
        createdAt: '[Server Timestamp]',
        updatedAt: '[Server Timestamp]',
      });
      
      await setDoc(userDocRef, userData);
      
      // Verify the document was created
      const createdDoc = await getDoc(userDocRef);
      if (!createdDoc.exists()) {
        throw new Error('User document was not created in Firestore. Please check your security rules.');
      }
      
      console.log('✅ User document created successfully in Firestore');
    } catch (firestoreError: any) {
      console.error('❌ Error creating user document in Firestore:', firestoreError);
      console.error('Error code:', firestoreError.code);
      console.error('Error message:', firestoreError.message);
      
      // If Firestore write fails, we should still throw an error
      // But provide a helpful message
      if (firestoreError.code === 'permission-denied') {
        throw new Error(
          'Permission denied: Your Firestore security rules are blocking user creation. ' +
          'Make sure you have this rule: "allow write: if request.auth != null && request.auth.uid == userId;" ' +
          'in the users collection. See SETUP.md for the correct security rules.'
        );
      } else if (firestoreError.code === 'unavailable') {
        throw new Error('Firestore is unavailable. Please check your internet connection and Firebase project status.');
      } else if (firestoreError.code === 'failed-precondition') {
        throw new Error('Firestore operation failed. Please check your Firebase project configuration and security rules.');
      } else {
        throw new Error(
          `Failed to create user document in Firestore: ${firestoreError.message || 'Unknown error'}. ` +
          `Error code: ${firestoreError.code || 'N/A'}. ` +
          'Please check your browser console for more details.'
        );
      }
    }

    // Create Stripe Customer (async, don't wait for it)
    // This runs on client side, so we can use window.location.origin
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch(`${window.location.origin}/api/stripe/create-customer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            email: email.trim(),
            name: name.trim(),
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          // Save Stripe Customer ID to Firestore
          if (data.customerId) {
            await updateDoc(doc(db, 'users', user.uid), {
              stripeCustomerId: data.customerId,
              updatedAt: serverTimestamp(),
            });
          }
        } else {
          console.error('Failed to create Stripe customer:', await response.text());
        }
      } catch (error) {
        console.error('Error creating Stripe customer:', error);
        // Don't fail user creation if Stripe customer creation fails
      }
    }

    return user;
  } catch (error: any) {
    // Provide more helpful error messages
    let errorMessage = error.message;
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'An account with this email already exists. Please sign in instead.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address. Please check your email format.';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Email/Password authentication is not enabled. Please enable it in Firebase Console.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please use a stronger password.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (error.code === 'auth/invalid-api-key') {
      errorMessage = 'Invalid Firebase API key. Please check your .env.local configuration.';
    } else if (error.code === 'auth/configuration-not-found') {
      errorMessage = 'Firebase configuration not found. Please check your .env.local file and restart the server.';
    } else if (error.code === 'auth/unauthorized-domain') {
      errorMessage = 'This domain is not authorized. Please add it to Firebase Console authorized domains.';
    }
    
    console.error('Sign up error:', error.code, error.message);
    throw new Error(errorMessage);
  }
}

export async function logOut() {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getUserData(uid: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        id: uid,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        paymentDate: data.paymentDate?.toDate(),
        billing: data.billing ? {
          ...data.billing,
          paymentDate: data.billing.paymentDate?.toDate() || null,
        } : undefined,
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
