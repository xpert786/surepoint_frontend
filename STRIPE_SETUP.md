# Stripe Payment Integration Setup Guide

## Overview

The application now includes Stripe payment integration. After sign up or login, users must complete payment before accessing the dashboard.

## Setup Instructions

### 1. Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up for a free account (or log in)
3. Complete account setup

### 2. Get Stripe API Keys

1. In Stripe Dashboard, go to **Developers** → **API keys**
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_` for test mode)
   - **Secret key** (starts with `sk_test_` for test mode)

### 3. Add Stripe Keys to Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 4. Set Up Stripe Webhook (For Production)

For local development, you can use Stripe CLI:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copy the webhook signing secret (starts with `whsec_`) to `.env.local`

For production:
1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy the webhook signing secret to your production environment variables

### 5. Test Payment Flow

#### Test Card Numbers (Stripe Test Mode)

Use these test card numbers in Stripe Checkout:

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Declined Payment:**
- Card: `4000 0000 0000 0002`

**Requires Authentication:**
- Card: `4000 0025 0000 3155`

## How It Works

### Flow:

1. **User Signs Up/Logs In**
   - User creates account or logs in
   - User document created in Firestore with `paymentStatus: 'pending'`

2. **Payment Check**
   - After login, user is redirected to `/payment`
   - If payment is already paid, redirects to `/dashboard`

3. **Payment Page**
   - User selects a plan (Basic, Pro, Enterprise)
   - Clicks "Continue to Payment"
   - Redirected to Stripe Checkout

4. **Stripe Checkout**
   - User enters payment details
   - Stripe processes payment
   - On success, redirects to `/payment/success`

5. **Webhook Processing**
   - Stripe sends webhook to `/api/stripe/webhook`
   - User's `paymentStatus` updated to `'paid'` in Firestore
   - User redirected to dashboard

6. **Dashboard Access**
   - Dashboard checks payment status
   - If not paid, redirects to payment page
   - If paid, shows dashboard

## Payment Status Values

- `pending` - User hasn't paid yet (default)
- `paid` - Payment successful
- `failed` - Payment failed
- `cancelled` - Payment cancelled

## Testing Locally

1. Start your dev server: `npm run dev`
2. Sign up or log in
3. You'll be redirected to `/payment`
4. Select a plan and click "Continue to Payment"
5. Use test card: `4242 4242 4242 4242`
6. Complete checkout
7. You'll be redirected to dashboard

## Troubleshooting

### Payment Not Updating

- Check webhook is receiving events (Stripe Dashboard → Webhooks → View logs)
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check Firestore security rules allow webhook to update user documents

### Webhook Not Working Locally

- Use Stripe CLI: `  `
- Make sure webhook secret matches the one from CLI

### Payment Status Not Changing

- Check browser console for errors
- Verify webhook endpoint is accessible
- Check Firestore rules allow updates to user documents

## Security Notes

- Never commit `.env.local` to git
- Use test keys for development
- Switch to live keys only in production
- Always verify webhook signatures
- Use HTTPS in production

## Next Steps

1. Set up Stripe account
2. Add API keys to `.env.local`
3. Test payment flow with test cards
4. Set up webhook for production
5. Configure production webhook endpoint

