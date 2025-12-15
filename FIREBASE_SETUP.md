# Firebase Setup Troubleshooting Guide

## Common Error: CONFIGURATION_NOT_FOUND

This error occurs when Firebase cannot find or validate your configuration. Follow these steps:

## Step 1: Verify Your .env.local File

1. **Create `.env.local` file** in the root directory (same level as `package.json`)

2. **Add your Firebase credentials** (make sure there are NO spaces around the `=` sign):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

## Step 2: Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the **gear icon** ⚙️ next to "Project Overview"
4. Select **Project settings**
5. Scroll down to **Your apps** section
6. If you don't have a web app, click **Add app** and select **Web** (`</>`)
7. Register your app with a nickname (e.g., "Surepoint Web")
8. Copy the configuration values from the `firebaseConfig` object

**Important:** Make sure you're copying from the `firebaseConfig` object, not from the SDK setup instructions.

Example of what you should see:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## Step 3: Verify Environment Variables Format

Your `.env.local` file should look exactly like this (no quotes, no spaces):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

**Common mistakes:**
- ❌ `NEXT_PUBLIC_FIREBASE_API_KEY = "value"` (spaces and quotes)
- ✅ `NEXT_PUBLIC_FIREBASE_API_KEY=value` (no spaces, no quotes)

## Step 4: Restart Your Development Server

**CRITICAL:** After creating or modifying `.env.local`, you MUST restart your dev server:

1. Stop the server (Ctrl+C in terminal)
2. Start it again: `npm run dev`

Environment variables are only loaded when the server starts!

## Step 5: Verify Firebase Services Are Enabled

### Enable Authentication:

1. In Firebase Console, go to **Authentication**
2. Click **Get started** (if you haven't already)
3. Go to **Sign-in method** tab
4. Enable **Email/Password** provider
5. Click **Save**

### Create Firestore Database:

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (you can add rules later)
4. Select a location (choose closest to your users)
5. Click **Enable**

## Step 6: Test Your Configuration

After restarting your server, check the browser console. You should NOT see any Firebase configuration errors.

If you still see errors:

1. **Check the terminal** where `npm run dev` is running - it will show which environment variables are missing
2. **Verify file name** - it must be exactly `.env.local` (not `.env`, not `env.local`)
3. **Check file location** - it must be in the root directory (same folder as `package.json`)
4. **Verify no typos** - variable names must match exactly (case-sensitive)

## Step 7: Verify Values Are Correct

Double-check that:
- `projectId` matches your Firebase project ID
- `authDomain` is `your-project-id.firebaseapp.com`
- `storageBucket` is `your-project-id.appspot.com`
- All values are from the same Firebase project

## Still Having Issues?

1. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Check for multiple .env files:**
   - Make sure you only have `.env.local` (not `.env`, `.env.development`, etc.)
   - Next.js loads `.env.local` last and it overrides other files

3. **Verify Firebase project is active:**
   - Make sure your Firebase project is not paused or deleted
   - Check that billing is enabled if required

4. **Check browser console:**
   - Open browser DevTools (F12)
   - Look for any Firebase-related errors
   - Check Network tab for failed requests

## Quick Checklist

- [ ] `.env.local` file exists in root directory
- [ ] All 6 environment variables are set
- [ ] No spaces around `=` sign
- [ ] No quotes around values
- [ ] Variable names start with `NEXT_PUBLIC_`
- [ ] Development server was restarted after creating/modifying `.env.local`
- [ ] Firebase Authentication is enabled
- [ ] Firestore Database is created
- [ ] All values are from the same Firebase project

## Need Help?

If you're still experiencing issues, check:
1. Terminal output for specific error messages
2. Browser console for client-side errors
3. Firebase Console to verify your project is active

