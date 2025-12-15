# Environment Variables Setup Guide

## What You Need in `.env.local`

### 1. INTERNAL_API_SECRET (Custom Secret - NOT from Firebase)

This is a **custom secret key** you create yourself. It's used to secure the internal API route that updates user billing.

**How to create it:**
- Generate a random string (any random text)
- Or use an online generator: https://randomkeygen.com/
- Or use: `openssl rand -hex 32` (if you have OpenSSL)

**Add to `.env.local`:**
```env
INTERNAL_API_SECRET=your-random-secret-key-here-make-it-long-and-random
```

**Example:**
```env
INTERNAL_API_SECRET=a7f3b9c2d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b
```

---

### 2. Firebase Web App Credentials (You Already Have These)

These are the credentials you get from Firebase Console → Project Settings → Your apps → Web app.

**Add to `.env.local`:**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

### 3. Firebase Admin SDK Service Account (REQUIRED for Webhooks)

**This is what you need to update user fields from webhooks!**

The web app credentials above are NOT enough. You need a **Service Account** which has admin privileges.

#### How to Get Service Account:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the **gear icon** ⚙️ → **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Click **Generate key** in the popup
7. A JSON file will download (e.g., `your-project-firebase-adminsdk-xxxxx.json`)

#### Add to `.env.local`:

**Option A: As JSON String (Recommended)**
```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

**Important:** The entire JSON must be on ONE line, with single quotes around it.

**Option B: As File Path (Alternative)**
1. Save the JSON file in your project root (e.g., `firebase-service-account.json`)
2. Add to `.gitignore`:
   ```
   firebase-service-account.json
   ```
3. Add to `.env.local`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```

---

### 4. Stripe Credentials (If Using Stripe)

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Complete `.env.local` Example

```env
# Internal API Secret (create your own random string)
INTERNAL_API_SECRET=a7f3b9c2d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b

# Firebase Web App Credentials (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Firebase Admin SDK Service Account (REQUIRED for webhooks)
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id",...}'

# Stripe (if using)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Why You Need Service Account

- **Web App Credentials**: Used for client-side Firebase (authentication, reading data)
- **Service Account**: Used for server-side operations (webhooks, admin updates)

Webhooks don't have an authenticated user, so they need the Service Account to bypass security rules and update user documents.

---

## Quick Setup Steps

1. **Create INTERNAL_API_SECRET**: Generate a random string
2. **Get Service Account**: Firebase Console → Project Settings → Service accounts → Generate new private key
3. **Add to `.env.local`**: Copy all the variables above
4. **Restart server**: `npm run dev`

---

## Troubleshooting

### Error: "Firebase Admin is not initialized"
- Make sure `FIREBASE_SERVICE_ACCOUNT` is set in `.env.local`
- Check that the JSON is valid and on one line
- Restart your server after adding it

### Error: "Permission denied"
- The Service Account needs Firestore permissions
- Make sure you downloaded the service account from the correct Firebase project

### Webhook not updating users
- Check that `FIREBASE_SERVICE_ACCOUNT` is set
- Check server logs for errors
- Verify the webhook is calling the internal API route

