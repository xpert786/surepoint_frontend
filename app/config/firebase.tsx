/**
 * Firebase Service Account Configuration
 * 
 * Set these environment variables in your .env.local or production environment:
 * - FIREBASE_TYPE=service_account
 * - FIREBASE_PROJECT_ID=your-project-id
 * - FIREBASE_PRIVATE_KEY_ID=your-private-key-id
 * - FIREBASE_PRIVATE_KEY=your-private-key (with \n for newlines)
 * - FIREBASE_CLIENT_EMAIL=your-client-email
 * - FIREBASE_CLIENT_ID=your-client-id
 * - FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
 * - FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
 * - FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
 * - FIREBASE_CLIENT_CERT_URL=your-client-cert-url
 * 
 * OR use FIREBASE_SERVICE_ACCOUNT as a single JSON string
 */
export const FIREBASE_SERVICE_ACCOUNT = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
  token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || 'googleapis.com',
};