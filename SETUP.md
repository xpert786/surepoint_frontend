# Surepoint Setup Guide

This guide will help you set up the Surepoint Operations Dashboard from scratch.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Firebase account (free tier works)
- (Optional) Stripe account for billing features

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Firebase Setup

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "surepoint" (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2.2 Enable Authentication

1. In Firebase Console, go to **Authentication** > **Get started**
2. Click **Sign-in method** tab
3. Enable **Email/Password** provider
4. Click **Save**

### 2.3 Create Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Select **Start in production mode** (we'll add rules later)
3. Choose a location (closest to your users)
4. Click **Enable**

### 2.4 Set Up Firestore Security Rules

1. Go to **Firestore Database** > **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to get user data
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Orders: clients see their own, COO/admin see all
    match /orders/{orderId} {
      allow read: if request.auth != null && (
        resource.data.clientId == getUserData().clientId ||
        getUserData().role == 'coo' ||
        getUserData().role == 'admin'
      );
      allow write: if request.auth != null;
    }
    
    // KPIs: same rules as orders
    match /kpis/{kpiId} {
      allow read: if request.auth != null && (
        resource.data.clientId == getUserData().clientId ||
        getUserData().role == 'coo' ||
        getUserData().role == 'admin'
      );
      allow write: if request.auth != null;
    }
    
    // Clients: only COO/admin can read
    match /clients/{clientId} {
      allow read: if request.auth != null && (
        getUserData().role == 'coo' ||
        getUserData().role == 'admin'
      );
      allow write: if request.auth != null && (
        getUserData().role == 'coo' ||
        getUserData().role == 'admin'
      );
    }
    
    // Inventory: clients see their own, COO/admin see all
    match /inventory/{itemId} {
      allow read: if request.auth != null && (
        resource.data.clientId == getUserData().clientId ||
        getUserData().role == 'coo' ||
        getUserData().role == 'admin'
      );
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

### 2.5 Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Web** icon (`</>`)
4. Register app with nickname "Surepoint Web"
5. Copy the Firebase configuration object

## Step 3: Environment Variables

1. Copy the example environment file:
```bash
cp env.example .env.local
```

2. Open `.env.local` and fill in your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

Replace the values with your actual Firebase config values.

## Step 4: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Create Your First User

1. Navigate to `/login`
2. Click "Don't have an account? Sign up"
3. Fill in:
   - Name: Your name
   - Email: your-email@example.com
   - Password: (at least 6 characters)
4. Click "Sign Up"

**Note:** The first user will be created as a "client" by default. To create a COO/admin user, you'll need to manually update the user document in Firestore or use the Firebase Console.

## Step 6: Create Test Data (Optional)

### Create a Client (for COO users)

1. Go to Firebase Console > Firestore Database
2. Click **Start collection**
3. Collection ID: `clients`
4. Document ID: (auto-generate)
5. Add fields:
   - `name` (string): "Test Client"
   - `email` (string): "client@example.com"
   - `status` (string): "active"
   - `subscriptionTier` (string): "pro"
   - `createdAt` (timestamp): (current time)
   - `updatedAt` (timestamp): (current time)
6. Click **Save**

### Create Test Orders

You can create test orders through the API or manually in Firestore:

1. Collection: `orders`
2. Fields:
   - `clientId` (string): (your client ID)
   - `orderNumber` (string): "ORD-001"
   - `status` (string): "pending"
   - `fulfillmentStatus` (string): "unfulfilled"
   - `customerName` (string): "John Doe"
   - `customerEmail` (string): "john@example.com"
   - `items` (array): [{"id": "1", "productName": "Product 1", "sku": "SKU-001", "quantity": 2, "price": 29.99, "total": 59.98}]
   - `totalAmount` (number): 59.98
   - `currency` (string): "USD"
   - `shippingAddress` (map): {street: "123 Main St", city: "New York", state: "NY", zipCode: "10001", country: "USA"}
   - `createdAt` (timestamp): (current time)
   - `updatedAt` (timestamp): (current time)

## Step 7: Set Up Webhooks (Optional)

### For Shopify Integration

1. In Shopify Admin, go to **Settings** > **Notifications**
2. Scroll to **Webhooks**
3. Create webhook:
   - Event: Order creation
   - Format: JSON
   - URL: `https://your-domain.com/api/sync?source=shopify`
   - API version: Latest

### For ShipStation Integration

1. In ShipStation, go to **Settings** > **Webhooks**
2. Add webhook:
   - Event: Order Shipped
   - URL: `https://your-domain.com/api/webhooks`
   - Method: POST

## Troubleshooting

### Authentication Issues

- Make sure Email/Password is enabled in Firebase Authentication
- Check that your Firebase config in `.env.local` is correct
- Verify Firestore security rules are published

### Data Not Showing

- Check browser console for errors
- Verify Firestore security rules allow your user to read data
- Ensure you have test data in Firestore

### Build Errors

- Run `npm install` again
- Delete `node_modules` and `.next` folders, then reinstall
- Check that all environment variables are set

## Next Steps

- Customize the branding and colors
- Set up Stripe for billing (see Stripe documentation)
- Configure production deployment
- Set up monitoring and error tracking
- Add more integrations as needed

## Support

For issues or questions, refer to the main README.md or contact the development team.

