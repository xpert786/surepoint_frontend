import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment variables or JSON file
 * Lazy initialization - only initializes when first accessed
 */
function initializeAdmin(): Firestore {
  if (adminDb) {
    return adminDb;
  }

  if (getApps().length === 0) {
    try {
      // Option 1: Use service account from environment variables (recommended)
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      
      if (serviceAccount) {
        // Parse JSON string from environment variable
        const serviceAccountJson = JSON.parse(serviceAccount);
        adminApp = initializeApp({
          credential: cert(serviceAccountJson),
        });
      } else {
        // Option 2: Use service account JSON file path
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
        
        if (serviceAccountPath) {
          // Load from file path
          const serviceAccount = require(serviceAccountPath);
          adminApp = initializeApp({
            credential: cert(serviceAccount),
          });
        } else {
          // Option 3: Use Application Default Credentials (ADC)
          // This works if you've run: gcloud auth application-default login
          adminApp = initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          });
        }
      }
      
      adminDb = getFirestore(adminApp);
      console.log('✅ Firebase Admin SDK initialized');
      return adminDb;
    } catch (error: any) {
      console.error('❌ Firebase Admin SDK initialization error:', error.message);
      throw new Error(`Failed to initialize Firebase Admin: ${error.message}. Please set up FIREBASE_SERVICE_ACCOUNT environment variable.`);
    }
  } else {
    adminApp = getApps()[0];
    adminDb = getFirestore(adminApp);
    return adminDb;
  }
}

/**
 * Get Firebase Admin Firestore instance
 * Initializes on first access if not already initialized
 * This bypasses security rules - use only in server-side API routes
 */
export function getAdminDb(): Firestore {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin SDK can only be used on the server side');
  }
  
  return initializeAdmin();
}

export { adminApp };

