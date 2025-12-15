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
      let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      
      // Remove surrounding quotes if present
      if (serviceAccount) {
        serviceAccount = serviceAccount.trim();
        if ((serviceAccount.startsWith('"') && serviceAccount.endsWith('"')) ||
            (serviceAccount.startsWith("'") && serviceAccount.endsWith("'"))) {
          serviceAccount = serviceAccount.slice(1, -1);
        }
      }
      
      if (serviceAccount) {
        try {
          // Parse JSON string from environment variable
          const serviceAccountJson = JSON.parse(serviceAccount);
          console.log('📝 Using FIREBASE_SERVICE_ACCOUNT from environment variable');
          adminApp = initializeApp({
            credential: cert(serviceAccountJson),
          });
        } catch (parseError: any) {
          console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', parseError.message);
          console.error('First 100 chars of service account:', serviceAccount.substring(0, 100));
          throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT JSON: ${parseError.message}`);
        }
      } else {
        // Option 2: Use service account JSON file path
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
        
        if (serviceAccountPath) {
          console.log('📝 Using FIREBASE_SERVICE_ACCOUNT_PATH:', serviceAccountPath);
          // Load from file path
          const serviceAccount = require(serviceAccountPath);
          adminApp = initializeApp({
            credential: cert(serviceAccount),
          });
        } else {
          // Option 3: Use Application Default Credentials (ADC)
          // This works if you've run: gcloud auth application-default login
          console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not found, trying Application Default Credentials');
          console.warn('⚠️ This will fail if ADC is not configured. Please set FIREBASE_SERVICE_ACCOUNT in .env.local');
          adminApp = initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          });
        }
      }
      
      adminDb = getFirestore(adminApp);
      console.log('✅ Firebase Admin SDK initialized successfully');
      return adminDb;
    } catch (error: any) {
      console.error('❌ Firebase Admin SDK initialization error:', error.message);
      console.error('Error stack:', error.stack);
      throw new Error(`Failed to initialize Firebase Admin: ${error.message}. Please set up FIREBASE_SERVICE_ACCOUNT environment variable in .env.local`);
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

