# Troubleshooting 400 Bad Request Error on Sign Up

## Error Details
```
Request URL: https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=...
Status Code: 400 Bad Request
```

## Common Causes & Solutions

### 1. ✅ Email/Password Provider Not Enabled (MOST COMMON)

**Problem:** Firebase Authentication doesn't have Email/Password enabled.

**Solution:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Sign-in method**
4. Find **Email/Password** in the list
5. Click on it
6. **Enable** the first toggle (Email/Password)
7. Click **Save**

**Important:** Make sure the toggle is ON (blue/green), not just the "Email link (passwordless sign-in)" option.

### 2. ✅ Domain Not Authorized

**Problem:** Your domain (localhost) might not be in the authorized domains list.

**Solution:**
1. Go to Firebase Console → **Authentication** → **Settings**
2. Scroll to **Authorized domains**
3. Make sure these are listed:
   - `localhost` (should be there by default)
   - `127.0.0.1` (if you're using IP)
   - Your production domain (when deploying)
4. If `localhost` is missing, click **Add domain** and add it

### 3. ✅ API Key Restrictions

**Problem:** Your API key has restrictions that block localhost.

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** → **Credentials**
4. Find your API key (starts with `AIzaSy...`)
5. Click **Edit**
6. Under **Application restrictions**:
   - If set to "HTTP referrers", make sure `localhost:3000/*` is added
   - OR temporarily set to "None" for testing (not recommended for production)
7. Click **Save**

**Note:** Wait a few minutes for changes to propagate.

### 4. ✅ Invalid Request Payload

**Problem:** The request might be missing required fields or have invalid format.

**Check:**
- Email is valid format (e.g., `user@example.com`)
- Password is at least 6 characters
- Name field is filled (for sign up)
- No extra spaces in email/password

**Solution:** The code now validates these automatically, but double-check your form inputs.

### 5. ✅ Firebase Project Configuration

**Problem:** Firebase project might not be properly configured.

**Check:**
1. Go to Firebase Console → **Project Settings**
2. Verify your project is active (not paused)
3. Check that **Authentication** service is enabled
4. Verify your `.env.local` values match the Firebase Console config

### 6. ✅ Browser/Network Issues

**Problem:** Browser cache or network issues.

**Solution:**
1. Clear browser cache and cookies
2. Try in incognito/private mode
3. Check browser console for CORS errors
4. Try a different browser
5. Check your internet connection

## Step-by-Step Debugging

### Step 1: Check Browser Console

Open browser DevTools (F12) → Console tab and look for:
- Error messages
- Network errors
- CORS errors

### Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Try to sign up
3. Find the `accounts:signUp` request
4. Click on it
5. Check:
   - **Request Payload** - Does it have `email`, `password`, `returnSecureToken: true`?
   - **Response** - What's the error message?

### Step 3: Verify Firebase Setup

Run this checklist:
- [ ] Firebase project is active
- [ ] Email/Password provider is enabled
- [ ] `localhost` is in authorized domains
- [ ] `.env.local` file exists with correct values
- [ ] Development server was restarted after creating `.env.local`
- [ ] No API key restrictions blocking localhost

### Step 4: Test with Firebase Console

1. Go to Firebase Console → **Authentication** → **Users**
2. Try creating a user manually
3. If this works, the issue is with your app configuration
4. If this doesn't work, the issue is with Firebase project setup

## Quick Fix Checklist

1. **Enable Email/Password:**
   ```
   Firebase Console → Authentication → Sign-in method → Email/Password → Enable
   ```

2. **Add localhost to authorized domains:**
   ```
   Firebase Console → Authentication → Settings → Authorized domains → Add "localhost"
   ```

3. **Check API key restrictions:**
   ```
   Google Cloud Console → APIs & Services → Credentials → Edit API Key
   → Add "localhost:3000/*" to HTTP referrers
   ```

4. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

5. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or use incognito mode

## Expected Request Payload

When working correctly, the request should look like:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "returnSecureToken": true
}
```

## Expected Response (Success)

```json
{
  "idToken": "...",
  "email": "user@example.com",
  "refreshToken": "...",
  "expiresIn": "3600",
  "localId": "..."
}
```

## Expected Response (Error)

```json
{
  "error": {
    "code": 400,
    "message": "EMAIL_EXISTS" // or other error code
  }
}
```

## Still Not Working?

1. **Check the exact error message** in Network tab → Response
2. **Check browser console** for JavaScript errors
3. **Verify all environment variables** are set correctly
4. **Try creating a new Firebase project** (if nothing else works)
5. **Check Firebase status page** for service outages

## Common Error Codes

- `EMAIL_EXISTS` - Email already registered
- `OPERATION_NOT_ALLOWED` - Email/Password not enabled
- `INVALID_EMAIL` - Invalid email format
- `WEAK_PASSWORD` - Password too weak
- `INVALID_API_KEY` - API key is invalid
- `UNAUTHORIZED_DOMAIN` - Domain not authorized

## Need More Help?

1. Check the browser console error message
2. Check the Network tab response
3. Verify Firebase Console settings
4. Check that all environment variables are correct

