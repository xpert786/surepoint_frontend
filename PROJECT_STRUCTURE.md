# Surepoint Project Structure

Complete overview of the project structure and file organization.

## 📁 Directory Structure

```
surepoints/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── orders/
│   │   │   └── route.ts         # GET orders endpoint
│   │   ├── reports/
│   │   │   └── route.ts         # GET reports endpoint
│   │   ├── sync/
│   │   │   └── route.ts         # POST sync endpoint (Shopify, ShipStation)
│   │   └── webhooks/
│   │       └── route.ts         # POST webhook handler
│   ├── dashboard/                # Dashboard Pages
│   │   ├── page.tsx             # Main dashboard
│   │   ├── orders/
│   │   │   ├── page.tsx         # Orders list
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Order detail
│   │   ├── kpis/
│   │   │   └── page.tsx         # KPI dashboard
│   │   ├── inventory/
│   │   │   └── page.tsx         # Inventory management
│   │   ├── coo/
│   │   │   └── page.tsx         # COO insights portal
│   │   └── clients/
│   │       └── page.tsx         # Client management (COO only)
│   ├── login/
│   │   └── page.tsx             # Authentication page
│   ├── layout.tsx               # Root layout with AuthProvider
│   ├── page.tsx                 # Home page (redirects to dashboard)
│   └── globals.css              # Global styles
│
├── components/                   # React Components
│   ├── dashboard/               # Dashboard-specific components
│   │   ├── MetricCard.tsx      # Metric display card
│   │   ├── OrdersChart.tsx     # Orders/revenue chart
│   │   └── RecentOrders.tsx    # Recent orders list
│   ├── layout/                  # Layout components
│   │   ├── DashboardLayout.tsx # Main dashboard layout
│   │   └── Sidebar.tsx         # Navigation sidebar
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.tsx          # Button component
│   │   └── Card.tsx            # Card components
│   └── billing/                 # Billing components
│       └── StripeProvider.tsx  # Stripe integration wrapper
│
├── contexts/                     # React Contexts
│   └── AuthContext.tsx          # Authentication context
│
├── lib/                          # Utility Libraries
│   ├── firebase/                # Firebase utilities
│   │   ├── config.ts           # Firebase initialization
│   │   ├── auth.ts             # Authentication functions
│   │   ├── orders.ts           # Order CRUD operations
│   │   ├── kpis.ts             # KPI operations
│   │   ├── clients.ts          # Client operations
│   │   ├── inventory.ts        # Inventory operations
│   │   └── dashboard.ts        # Dashboard metrics
│   └── utils.ts                 # General utilities
│
├── types/                        # TypeScript Types
│   └── index.ts                 # Type definitions
│
├── public/                       # Static Assets
│   └── ...                      # Images, icons, etc.
│
├── env.example                   # Environment variables template
├── SETUP.md                      # Setup instructions
├── README.md                     # Project documentation
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── next.config.ts                # Next.js config
```

## 🔑 Key Files Explained

### App Router Pages

- **`app/page.tsx`**: Home page that redirects to dashboard
- **`app/login/page.tsx`**: Authentication page (sign in/sign up)
- **`app/dashboard/page.tsx`**: Main dashboard with metrics and charts
- **`app/dashboard/orders/page.tsx`**: Orders list view
- **`app/dashboard/orders/[id]/page.tsx`**: Individual order detail page
- **`app/dashboard/kpis/page.tsx`**: KPI dashboard with charts
- **`app/dashboard/inventory/page.tsx`**: Inventory management
- **`app/dashboard/coo/page.tsx`**: COO insights portal (multi-client view)
- **`app/dashboard/clients/page.tsx`**: Client management (COO only)

### API Routes

- **`app/api/orders/route.ts`**: GET endpoint to fetch orders
- **`app/api/sync/route.ts`**: POST endpoint to sync orders from external platforms
- **`app/api/webhooks/route.ts`**: POST endpoint for webhook handlers
- **`app/api/reports/route.ts`**: GET endpoint for generating reports

### Components

- **`components/layout/DashboardLayout.tsx`**: Wraps dashboard pages with sidebar
- **`components/layout/Sidebar.tsx`**: Navigation sidebar with role-based menu
- **`components/dashboard/MetricCard.tsx`**: Reusable metric display card
- **`components/dashboard/OrdersChart.tsx`**: Line chart for orders/revenue
- **`components/dashboard/RecentOrders.tsx`**: Recent orders list component
- **`components/ui/Button.tsx`**: Reusable button component
- **`components/ui/Card.tsx`**: Card components (Card, CardHeader, CardContent, etc.)

### Firebase Utilities

- **`lib/firebase/config.ts`**: Firebase app initialization
- **`lib/firebase/auth.ts`**: Authentication functions (sign in, sign up, logout)
- **`lib/firebase/orders.ts`**: Order CRUD operations
- **`lib/firebase/kpis.ts`**: KPI operations
- **`lib/firebase/clients.ts`**: Client management operations
- **`lib/firebase/inventory.ts`**: Inventory operations
- **`lib/firebase/dashboard.ts`**: Dashboard metrics aggregation

### Types

- **`types/index.ts`**: All TypeScript type definitions including:
  - User, Client, Order, InventoryItem, KPI
  - DashboardMetrics, WebhookPayload
  - UserRole, OrderStatus, FulfillmentStatus

## 🔄 Data Flow

### Authentication Flow
```
User visits /login
  → AuthContext checks auth state
  → If not authenticated, show login form
  → On sign in, Firebase Auth authenticates
  → User data fetched from Firestore
  → Redirect to /dashboard
```

### Dashboard Data Flow
```
Dashboard page loads
  → useAuth() gets current user
  → getOrders() fetches orders from Firestore
  → getKPIs() fetches KPIs from Firestore
  → Metrics calculated and displayed
  → Charts render with data
```

### Order Sync Flow
```
External platform (Shopify) creates order
  → Webhook calls /api/sync
  → Order data transformed to our format
  → createOrder() saves to Firestore
  → Dashboard updates in real-time (if using Firestore listeners)
```

## 🎨 Component Hierarchy

```
RootLayout
  └── AuthProvider
      └── Page Component
          └── DashboardLayout (if authenticated)
              ├── Sidebar
              └── Page Content
                  ├── MetricCard
                  ├── OrdersChart
                  ├── RecentOrders
                  └── Other Components
```

## 📊 Database Collections

### Firestore Collections

- **`users`**: User accounts and authentication data
- **`clients`**: Client/company information
- **`orders`**: Order records
- **`kpis`**: Key performance indicators (daily/weekly aggregates)
- **`inventory`**: Inventory items and stock levels

## 🔐 Security

- Authentication handled by Firebase Auth
- Role-based access control (client, coo, admin)
- Firestore security rules enforce data access
- API routes can be protected with middleware (future enhancement)

## 🚀 Deployment Considerations

- Environment variables must be set in production
- Firebase project must be configured
- Firestore security rules must be published
- API routes are serverless functions (Vercel/Firebase)
- Static assets served from CDN

