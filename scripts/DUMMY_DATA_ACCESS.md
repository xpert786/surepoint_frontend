# Dummy Data Access Control

This document explains who can see the dummy records created by the `add-dummy-data.ts` script based on the role-based access control system.

## 📊 What Was Created

The script creates:
- **3 Clients**: Acme Corp, TechStart Inc, Global Solutions
- **50 Orders**: Randomly distributed across the 3 clients
- **90 KPIs**: 30 days × 3 clients = 90 KPI records
- **45 Inventory Items**: 15 items per client

## 👥 Who Can See What

### **COO (Chief Operating Officer) & Admin Roles**
✅ **Can see ALL dummy data:**
- All 3 clients
- All 50 orders (from all clients)
- All 90 KPIs (from all clients)
- All 45 inventory items (from all clients)

**Why?** COO and Admin roles have full access to view data across all clients for management and oversight purposes.

---

### **Client Role**
✅ **Can only see their own client's data:**
- Only their own client record (if they have `clientId` set in their user document)
- Only orders where `order.clientId` matches their `user.clientId`
- Only KPIs where `kpi.clientId` matches their `user.clientId`
- Only inventory items where `inventory.clientId` matches their `user.clientId`

**Example:**
- If a user has `clientId: "4SOCif9DxMIoZbeEpxVk"` (Acme Corp), they will see:
  - ~16-17 orders (randomly assigned to Acme Corp)
  - 30 KPIs (30 days for Acme Corp)
  - 15 inventory items (for Acme Corp)

---

## 🔐 How It Works

### Application-Level Filtering
The code in `lib/firebase/orders.ts` and `lib/firebase/kpis.ts` filters data based on role:

```typescript
// For COO/Admin - see all
if (userRole === 'coo' || userRole === 'admin') {
  // No clientId filter - gets all records
}

// For Client - see only their own
else if (clientId) {
  // Filters by: where('clientId', '==', clientId)
}
```

### Firestore Security Rules
Firestore security rules enforce this at the database level:

```javascript
// Orders: clients see their own, COO/admin see all
match /orders/{orderId} {
  allow read: if request.auth != null && (
    resource.data.clientId == getUserData().clientId ||
    getUserData().role == 'coo' ||
    getUserData().role == 'admin'
  );
}
```

---

## 🧪 Testing Access

To test the access control:

1. **Create a Client User:**
   - Sign up a new user
   - Set their `role: 'client'` in Firestore
   - Set their `clientId` to one of the created client IDs (e.g., `"4SOCif9DxMIoZbeEpxVk"`)
   - They should only see data for that client

2. **Create a COO/Admin User:**
   - Sign up a new user
   - Set their `role: 'coo'` or `'admin'` in Firestore
   - They should see ALL dummy data

---

## 📝 Important Notes

1. **User's `clientId` must match:** For client users to see data, their user document in Firestore must have a `clientId` field that matches one of the created client IDs.

2. **Client IDs Created:**
   - Check the console output when running the script to see the actual client IDs created
   - Example output: `✓ Created client: Acme Corp (4SOCif9DxMIoZbeEpxVk)`

3. **Data Distribution:**
   - Orders are randomly assigned to clients, so each client may have a different number of orders
   - KPIs are evenly distributed (30 days per client)
   - Inventory is evenly distributed (15 items per client)

---

## 🔍 Verifying Access

To verify who can see what:

1. **Check Firestore Console:**
   - Go to Firebase Console → Firestore Database
   - Check the `users` collection to see user roles and clientIds
   - Check the `orders`, `kpis`, and `inventory` collections to see the `clientId` field

2. **Check Application:**
   - Log in as different users with different roles
   - Navigate to `/dashboard/orders` and `/dashboard/kpis`
   - Verify the data shown matches the access rules above

