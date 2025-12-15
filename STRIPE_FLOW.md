# 🚀 Complete Stripe Payment Flow Implementation

## High-Level Flow (Implemented)

### 1️⃣ User Authentication (Firebase Auth) ✅
- User signs up / logs in using Firebase Auth (Email/password)
- After login, user gets a Firebase UID
- This UID becomes the main ID for the entire system

### 2️⃣ Create Stripe Customer (API Route) ✅
**When a new Firebase user is created:**
- Trigger API route → create a Stripe customer
- Save that `customerId` in Firestore under `/users/{uid}`

**Flow:**
```
Firebase Auth → API Route (/api/stripe/create-customer) → Stripe Customer → Saved in Firestore
```

**Implementation:**
- Automatically called after user signup in `lib/firebase/auth.ts`
- Creates Stripe customer with user email and name
- Saves `stripeCustomerId` in Firestore user document

### 3️⃣ Start Payment / Subscription ✅
**User clicks "Upgrade" or "Buy":**
- Frontend calls API route (NOT directly touching Stripe secret keys)
- API route creates a Stripe Checkout Session
- Returns the Checkout URL to frontend
- Frontend redirects user to Stripe

**Flow:**
```
Frontend → API Route (/api/stripe/create-checkout) → Stripe Checkout URL → Redirect user
```

**Implementation:**
- Payment page calls `/api/stripe/create-checkout`
- Uses existing Stripe Customer ID from Firestore
- Creates checkout session with selected plan
- Returns checkout URL for redirect

### 4️⃣ Stripe Webhook → Update Firebase ✅
**After successful payment, Stripe sends a webhook event:**
- Webhook API route receives the event
- Updates Firestore:
  - `/users/{uid}/billing.status = "active"`
  - `/users/{uid}/billing.plan = "pro"`
- This unlocks the dashboard

**Flow:**
```
Stripe Payment Success → Webhook → API Route (/api/stripe/webhook) → Update Firestore
```

**Implementation:**
- Webhook endpoint at `/api/stripe/webhook`
- Handles `checkout.session.completed` event
- Updates `billing.status` and `billing.plan` in Firestore
- Also handles payment failures and subscription cancellations

### 5️⃣ Protect Dashboard Using Firestore Rules ✅
**Your Next.js app checks:**
- Is user logged in?
- Does Firestore say: `billing.status = "active"`?
- If yes → show Dashboard
- If no → show "Please complete your payment"

**Implementation:**
- `DashboardLayout` checks `billing.status` or `paymentStatus`
- Redirects to `/payment` if not active
- Payment page redirects to dashboard if already active

### 6️⃣ Stripe Portal (Optional) ✅
**To allow users to manage cards, cancel subscription, etc.:**
- API route creates a Stripe billing portal link
- User → Portal → Returns back to your app

**Flow:**
```
User clicks "Manage Billing" → API Route (/api/stripe/billing-portal) → Stripe Portal → Returns to app
```

**Implementation:**
- Billing portal button in sidebar (for active subscribers)
- API route at `/api/stripe/billing-portal`
- Creates portal session and redirects user
- Returns to dashboard after portal session

## 📁 File Structure

```
app/
├── api/
│   └── stripe/
│       ├── create-customer/route.ts      # Step 2: Create Stripe Customer
│       ├── create-checkout/route.ts      # Step 3: Create Checkout Session
│       ├── webhook/route.ts              # Step 4: Handle Webhooks
│       └── billing-portal/route.ts       # Step 6: Billing Portal
├── payment/
│   ├── page.tsx                          # Payment page
│   └── success/page.tsx                  # Payment success page
components/
├── billing/
│   └── BillingPortalButton.tsx           # Manage billing button
lib/
├── firebase/
│   └── auth.ts                           # Auto-create Stripe customer on signup
```

## 🔄 Complete User Journey

```
1. User Signs Up
   ↓
2. Firebase Auth creates user
   ↓
3. API Route creates Stripe Customer
   ↓
4. Stripe Customer ID saved in Firestore
   ↓
5. User redirected to /payment
   ↓
6. User selects plan → clicks "Continue to Payment"
   ↓
7. API Route creates Checkout Session
   ↓
8. User redirected to Stripe Checkout
   ↓
9. User enters payment details
   ↓
10. Payment successful
    ↓
11. Stripe sends webhook to /api/stripe/webhook
    ↓
12. Webhook updates Firestore: billing.status = "active"
    ↓
13. User redirected to /payment/success
    ↓
14. Success page verifies payment
    ↓
15. User redirected to /dashboard
    ↓
16. Dashboard checks billing.status
    ↓
17. If active → Show dashboard ✅
    If not → Redirect to /payment
```

## 🔐 Firestore Structure

```javascript
/users/{uid}
{
  email: "user@example.com",
  name: "John Doe",
  role: "client",
  stripeCustomerId: "cus_xxxxx",  // Created on signup
  billing: {
    status: "inactive" | "active" | "cancelled" | "failed",
    plan: "basic" | "pro" | "enterprise" | null,
    paymentDate: Timestamp,
    stripeCustomerId: "cus_xxxxx",
    stripeSessionId: "cs_xxxxx"
  },
  // Legacy fields (for backward compatibility)
  paymentStatus: "pending" | "paid" | "failed" | "cancelled",
  subscriptionTier: "basic" | "pro" | "enterprise"
}
```

## 🧪 Testing

### Test Stripe Customer Creation:
1. Sign up a new user
2. Check Firestore → user document should have `stripeCustomerId`
3. Check Stripe Dashboard → should see new customer

### Test Payment Flow:
1. Sign up / log in
2. Go to `/payment`
3. Select plan
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout
6. Check Firestore → `billing.status` should be `"active"`
7. Should redirect to dashboard

### Test Webhook:
1. Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Complete a test payment
3. Check webhook logs in terminal
4. Verify Firestore updated

### Test Billing Portal:
1. Log in as user with active subscription
2. Click "Manage Billing" in sidebar
3. Should redirect to Stripe portal
4. Can manage payment methods, view invoices, etc.

## 📝 Environment Variables

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🎯 Key Features

✅ Automatic Stripe Customer creation on signup
✅ Secure checkout session creation (server-side only)
✅ Webhook-based payment status updates
✅ Dashboard protection based on billing status
✅ Billing portal for subscription management
✅ Backward compatible with legacy payment fields

## 🚀 Next Steps

1. Set up Stripe account and get API keys
2. Add keys to `.env.local`
3. Set up webhook endpoint (use Stripe CLI for local testing)
4. Test complete flow with test cards
5. Deploy and configure production webhook

