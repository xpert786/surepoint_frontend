import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Get environment variables - ensure they're available
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

// Check if we're in build mode (Vercel sets NEXT_PHASE during build)
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

// Validate that all required environment variables are set (skip during build)
const missing: string[] = [];
if (!apiKey) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
if (!authDomain) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
if (!projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
if (!storageBucket) missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
if (!messagingSenderId) missing.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
if (!appId) missing.push('NEXT_PUBLIC_FIREBASE_APP_ID');

// Only throw error if not in build mode
if (missing.length > 0 && !isBuildTime) {
  throw new Error(
    `Missing required Firebase environment variables: ${missing.join(', ')}. ` +
    `Please check your .env.local file.`
  );
}

// Use dummy values during build if env vars are missing
const firebaseConfig = {
  apiKey: apiKey || 'dummy-key-for-build',
  authDomain: authDomain || 'dummy.firebaseapp.com',
  projectId: projectId || 'dummy-project',
  storageBucket: storageBucket || 'dummy.appspot.com',
  messagingSenderId: messagingSenderId || '123456789',
  appId: appId || '1:123456789:web:dummy',
  measurementId
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error: any) {
    // During build, use dummy config to avoid errors
    if (isBuildTime) {
      console.warn('Firebase: Using dummy config for build');
      app = initializeApp({
        apiKey: 'dummy',
        authDomain: 'dummy.firebaseapp.com',
        projectId: 'dummy',
        storageBucket: 'dummy.appspot.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:dummy',
      });
    } else {
      console.error('Firebase initialization error:', error);
      throw new Error(
        `Failed to initialize Firebase: ${error.message}. Please check your Firebase configuration in .env.local`
      );
    }
  }
} else {
  app = getApps()[0];
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export default app;

