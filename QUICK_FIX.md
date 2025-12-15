# Quick Fix for Firebase Configuration Error

## The Problem
You're getting `CONFIGURATION_NOT_FOUND` because the `.env.local` file doesn't exist or isn't configured correctly.

## The Solution

### Step 1: Create `.env.local` file

Create a file named `.env.local` in the root directory (same folder as `package.json`).

### Step 2: Add Your Firebase Credentials

Open `.env.local` and add these lines (replace with YOUR actual Firebase values):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

**Important:**
- No spaces around the `=` sign
- No quotes around the values
- All variable names must start with `NEXT_PUBLIC_`

### Step 3: Get Your Firebase Config Values

1. Go to https://console.firebase.google.com/
2. Select your project
3. Click the ⚙️ gear icon → **Project settings**
4. Scroll to **Your apps** section
5. If no web app exists, click **Add app** → Select **Web** (`</>`)
6. Copy the values from the `firebaseConfig` object

Example:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← Copy this
  authDomain: "project.firebaseapp.com",  // ← Copy this
  projectId: "your-project-id",  // ← Copy this
  storageBucket: "project.appspot.com",   // ← Copy this
  messagingSenderId: "123456789", // ← Copy this
  appId: "1:123:web:abc"          // ← Copy this
};
```

### Step 4: Restart Your Dev Server

**CRITICAL:** After creating `.env.local`, you MUST restart:

1. Stop the server (press `Ctrl+C` in terminal)
2. Start again: `npm run dev`

Environment variables are only loaded when the server starts!

### Step 5: Verify It Works

1. Open http://localhost:3000/login
2. Try to sign up or sign in
3. The error should be gone!

## Still Not Working?

1. **Check file name:** Must be exactly `.env.local` (not `.env`, not `env.local`)
2. **Check file location:** Must be in root directory (same as `package.json`)
3. **Check format:** No spaces, no quotes, correct variable names
4. **Restart server:** Always restart after changing `.env.local`
5. **Check terminal:** Look for error messages about missing variables

## Need More Help?

See `FIREBASE_SETUP.md` for detailed troubleshooting guide.

