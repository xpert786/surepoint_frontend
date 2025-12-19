import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { FIREBASE_SERVICE_ACCOUNT } from '@/app/config/firebase';

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
      let serviceAccountJson: any = null;
      
      // Option 1: Try JSON string from FIREBASE_SERVICE_ACCOUNT environment variable
      let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      
      if (serviceAccount) {
        // Remove surrounding quotes if present
        serviceAccount = serviceAccount.trim();
        if ((serviceAccount.startsWith('"') && serviceAccount.endsWith('"')) ||
            (serviceAccount.startsWith("'") && serviceAccount.endsWith("'"))) {
          serviceAccount = serviceAccount.slice(1, -1);
        }
        
        // Remove escaped newlines and quotes
        serviceAccount = serviceAccount.replace(/\\n/g, '\n').replace(/\\"/g, '"');
        serviceAccount = serviceAccount.trim();
        
        try {
          serviceAccountJson = JSON.parse(serviceAccount);
          console.log('📝 Using FIREBASE_SERVICE_ACCOUNT JSON string from environment variable');
        } catch (parseError: any) {
          console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', parseError.message);
          console.error('First 100 chars of service account:', serviceAccount.substring(0, 100));
          // Continue to try other options
        }
      }
      
      // Option 2: Try config file (individual environment variables)
      if (!serviceAccountJson) {
        try {
          // Check if config file has all required fields
          if (FIREBASE_SERVICE_ACCOUNT.type && 
              FIREBASE_SERVICE_ACCOUNT.project_id && 
              FIREBASE_SERVICE_ACCOUNT.client_email &&
              FIREBASE_SERVICE_ACCOUNT.private_key) {
            serviceAccountJson = {
              type: FIREBASE_SERVICE_ACCOUNT.type,
              project_id: FIREBASE_SERVICE_ACCOUNT.project_id,
              private_key_id: FIREBASE_SERVICE_ACCOUNT.private_key_id,
              private_key: FIREBASE_SERVICE_ACCOUNT.private_key,
              client_email: FIREBASE_SERVICE_ACCOUNT.client_email,
              client_id: FIREBASE_SERVICE_ACCOUNT.client_id,
              auth_uri: FIREBASE_SERVICE_ACCOUNT.auth_uri || 'https://accounts.google.com/o/oauth2/auth',
              token_uri: FIREBASE_SERVICE_ACCOUNT.token_uri || 'https://oauth2.googleapis.com/token',
              auth_provider_x509_cert_url: FIREBASE_SERVICE_ACCOUNT.auth_provider_x509_cert_url || 'https://www.googleapis.com/oauth2/v1/certs',
              client_x509_cert_url: FIREBASE_SERVICE_ACCOUNT.client_x509_cert_url,
              universe_domain: 'googleapis.com',
            };
            console.log('📝 Using FIREBASE_SERVICE_ACCOUNT from config file (individual env vars)');
          }
        } catch (error: any) {
          console.error('❌ Failed to construct service account from config file:', error.message);
        }
      }
      
      // Option 3: Use service account JSON file path
      if (!serviceAccountJson) {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
        
        if (serviceAccountPath) {
          console.log('📝 Using FIREBASE_SERVICE_ACCOUNT_PATH:', serviceAccountPath);
          try {
            // Load from file path
            const serviceAccount = require(serviceAccountPath);
            serviceAccountJson = serviceAccount;
          } catch (error: any) {
            console.error('❌ Failed to load service account from file:', error.message);
          }
        }
      }
      
      // Initialize with the service account we found
      if (serviceAccountJson) {
        adminApp = initializeApp({
          credential: cert(serviceAccountJson),
        });
      } else {
        // Option 4: Use Application Default Credentials (ADC)
        // This works if you've run: gcloud auth application-default login
        console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not found, trying Application Default Credentials');
        console.warn('⚠️ This will fail if ADC is not configured. Please set FIREBASE_SERVICE_ACCOUNT in .env.local');
        adminApp = initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
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

