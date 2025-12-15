/**
 * Firebase Security Information
 * 
 * This file documents Firebase security practices for developers.
 * 
 * IMPORTANT: The Firebase API key is PUBLIC and meant to be exposed.
 * Security is enforced through:
 * 1. Firestore Security Rules
 * 2. Firebase Authentication
 * 3. API Key Restrictions (optional)
 * 
 * The API key in URLs like:
 * https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSy...
 * 
 * Is NORMAL and EXPECTED behavior. This is how Firebase Authentication works.
 */

export const FIREBASE_SECURITY_NOTES = {
  apiKeyVisibility: {
    isPublic: true,
    isSafe: true,
    reason: 'Firebase API keys are designed to be public. They identify your project but do not grant access by themselves.',
  },
  securityLayers: [
    'Firestore Security Rules - Control who can read/write data',
    'Firebase Authentication - Verify user identity with email/password',
    'API Key Restrictions - Limit which domains can use the key (optional)',
  ],
  bestPractices: [
    'Always set up Firestore Security Rules',
    'Enable API key restrictions in Google Cloud Console',
    'Use environment variables for configuration',
    'Never expose service account keys (different from API keys)',
  ],
};

/**
 * Check if Firebase is properly configured
 */
export function validateFirebaseConfig() {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ];

  const missing = required.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    console.warn(
      `⚠️ Missing Firebase environment variables: ${missing.join(', ')}\n` +
      'See .env.local.example for required variables.'
    );
    return false;
  }

  return true;
}

