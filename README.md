# Surepoint - Operations Dashboard Platform

A comprehensive operations automation and dashboard platform built with Next.js, Firebase, and modern web technologies.

## 🚀 Features

- **Real-time Dashboard** - Monitor orders, revenue, and KPIs in real-time
- **Order Management** - Track orders from creation to delivery
- **KPI Tracking** - Comprehensive performance metrics and analytics
- **Multi-role Access** - Client and COO views with role-based permissions
- **Inventory Tracking** - Monitor stock levels and low inventory alerts
- **API Integration** - Webhook endpoints for Shopify, ShipStation, and more
- **Modern UI** - Beautiful, responsive interface built with Tailwind CSS

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd surepoints
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Configure Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Copy your Firebase config to `.env.local`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔧 Configuration

### Firebase Setup

1. Create a new Firebase project
2. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
3. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see below)

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Orders: clients can only see their own, COO can see all
    match /orders/{orderId} {
      allow read: if request.auth != null && (
        resource.data.clientId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.clientId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'coo' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow write: if request.auth != null;
    }
    
    // KPIs: same rules as orders
    match /kpis/{kpiId} {
      allow read: if request.auth != null && (
        resource.data.clientId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.clientId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'coo' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow write: if request.auth != null;
    }
    
    // Clients: only COO/admin can read
    match /clients/{clientId} {
      allow read: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'coo' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow write: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'coo' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
  }
}
```

## 📁 Project Structure

```
surepoints/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── orders/        # Orders API
│   │   ├── sync/          # Sync endpoints
│   │   └── webhooks/      # Webhook handlers
│   ├── dashboard/         # Dashboard pages
│   │   ├── orders/        # Order management
│   │   ├── kpis/          # KPI dashboard
│   │   ├── inventory/     # Inventory tracking
│   │   ├── coo/           # COO insights
│   │   └── clients/       # Client management
│   ├── login/             # Authentication
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── dashboard/         # Dashboard components
│   ├── layout/            # Layout components
│   └── ui/                # UI components
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── lib/                   # Utility libraries
│   ├── firebase/          # Firebase utilities
│   └── utils.ts           # Helper functions
├── types/                 # TypeScript types
│   └── index.ts           # Type definitions
└── public/                # Static assets
```

## 🔌 API Integration

### Webhook Endpoints

#### Sync Orders (POST /api/sync)
Sync orders from external platforms (Shopify, ShipStation, etc.)

```json
{
  "source": "shopify",
  "data": {
    "clientId": "client-123",
    "order_number": "1001",
    "id": "shopify-order-id",
    "customer": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    "line_items": [...],
    "total_price": "99.99",
    "shipping_address": {...}
  }
}
```

#### Webhooks (POST /api/webhooks)
Receive real-time updates from external services

```json
{
  "type": "shipstation_update",
  "data": {
    "orderId": "order-123",
    "trackingNumber": "1Z999AA10123456784",
    "trackingUrl": "https://...",
    "status": "shipped"
  }
}
```

## 👥 User Roles

- **Client**: Can view their own orders, KPIs, and inventory
- **COO**: Can view all clients, orders, and platform-wide insights
- **Admin**: Full access to all features

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Firebase Hosting

```bash
npm run build
firebase deploy
```

## 📝 License

This project is proprietary software.

## 🤝 Support

For support, please contact the development team.
