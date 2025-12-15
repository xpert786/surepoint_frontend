# 📊 Firebase Data Setup Guide - Step by Step

This guide will walk you through exactly what data you need to add to Firebase Firestore to make your dashboard work.

## 🎯 Overview

Your application needs data in **5 main Firestore collections**:
1. **`users`** - User accounts (created automatically on signup)
2. **`clients`** - Client/company records
3. **`orders`** - Order records
4. **`kpis`** - Key Performance Indicators (daily metrics)
5. **`inventory`** - Inventory items (optional)

---

## 📋 Step 1: Verify Firebase Setup

### 1.1 Check Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. Make sure Firestore is enabled (not Firestore in Datastore mode)

### 1.2 Verify Security Rules
1. Go to **Firestore Database** → **Rules** tab
2. Make sure you have security rules set up (see `SETUP.md` for rules)
3. For testing, you can temporarily use:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
⚠️ **Warning**: This is permissive - only use for testing!

---

## 👤 Step 2: Create a User Account

### Option A: Through Your App (Recommended)
1. Start your app: `npm run dev`
2. Go to `http://localhost:3000/login`
3. Click "Don't have an account? Sign up"
4. Fill in:
   - **Name**: Your name
   - **Email**: your-email@example.com
   - **Password**: (at least 6 characters)
5. Click "Sign Up"
6. This automatically creates a user in the `users` collection

### Option B: Manually in Firebase Console
1. Go to Firebase Console → **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password
4. Then go to **Firestore Database**
5. Create a document in `users` collection with:
   - **Document ID**: The user's UID (from Authentication)
   - **Fields**:
     ```json
     {
       "email": "user@example.com",
       "name": "John Doe",
       "role": "client",
       "billing": {
         "status": "active",
         "plan": null,
         "paymentDate": null
       },
       "createdAt": [Timestamp - current time],
       "updatedAt": [Timestamp - current time]
     }
     ```

---

## 🏢 Step 3: Create a Client Record

**Why?** Orders need a `clientId` to link to a client. Users with role "client" also need a `clientId` in their user document.

### 3.1 Create Client in Firebase Console
1. Go to **Firestore Database**
2. Click **Start collection** (or add to existing `clients` collection)
3. **Collection ID**: `clients`
4. **Document ID**: Click "Auto-ID" (or use a custom ID like `client-001`)
5. **Add fields**:
   ```
   Field Name          | Type      | Value
   --------------------|-----------|------------------
   name                | string    | "Acme Corporation"
   email               | string    | "contact@acme.com"
   phone               | string    | "+1-555-0123" (optional)
   address             | string    | "123 Main St" (optional)
   status              | string    | "active"
   subscriptionTier    | string    | "pro" (optional)
   createdAt           | timestamp | [Current time]
   updatedAt           | timestamp | [Current time]
   ```
6. Click **Save**
7. **Copy the Document ID** - you'll need this for the next steps!

### 3.2 Link User to Client (if user is a client)
1. Go to `users` collection
2. Find your user document
3. Click **Edit document**
4. Add field:
   - **Field name**: `clientId`
   - **Type**: string
   - **Value**: The client document ID you just created
5. Click **Update**

---

## 📦 Step 4: Create Test Orders

**Why?** The dashboard displays orders, revenue, and metrics calculated from orders.

### 4.1 Create Order Document
1. Go to **Firestore Database**
2. Click **Start collection** (or add to existing `orders` collection)
3. **Collection ID**: `orders`
4. **Document ID**: Click "Auto-ID"
5. **Add fields** (required fields in bold):

   ```
   Field Name          | Type      | Value Example
   --------------------|-----------|------------------
   clientId            | string    | "client-001" (from Step 3)
   orderNumber         | string    | "ORD-2024-001"
   status              | string    | "pending" | "processing" | "shipped" | "delivered" | "cancelled"
   fulfillmentStatus   | string    | "unfulfilled" | "partial" | "fulfilled"
   customerName        | string    | "Jane Smith"
   customerEmail       | string    | "jane@example.com"
   totalAmount         | number    | 99.99
   currency            | string    | "USD"
   items               | array     | [See below for structure]
   shippingAddress     | map       | {See below for structure}
   createdAt           | timestamp | [Current time]
   updatedAt           | timestamp | [Current time]
   ```

### 4.2 Add Order Items (Array Field)
1. Click on the `items` field
2. Select type: **Array**
3. Click **Add item** for each item:

   **Item 1:**
   ```
   Type: map
   Fields:
   - id: string → "item-1"
   - productName: string → "Widget A"
   - sku: string → "WID-A-001"
   - quantity: number → 2
   - price: number → 29.99
   - total: number → 59.98
   ```

   **Item 2:**
   ```
   Type: map
   Fields:
   - id: string → "item-2"
   - productName: string → "Widget B"
   - sku: string → "WID-B-001"
   - quantity: number → 1
   - price: number → 39.99
   - total: number → 39.99
   ```

### 4.3 Add Shipping Address (Map Field)
1. Click on the `shippingAddress` field
2. Select type: **Map**
3. Add fields:
   ```
   street: string → "456 Oak Avenue"
   city: string → "New York"
   state: string → "NY"
   zipCode: string → "10001"
   country: string → "USA"
   ```

### 4.4 Optional Fields
- `shopifyOrderId`: string (if syncing from Shopify)
- `shipstationOrderId`: string (if using ShipStation)
- `trackingNumber`: string
- `trackingUrl`: string
- `shippedAt`: timestamp (when order was shipped)
- `deliveredAt`: timestamp (when order was delivered)

### 4.5 Create Multiple Orders
Create at least **5-10 test orders** with:
- Different statuses (pending, processing, shipped, delivered)
- Different dates (spread over last 30 days)
- Different amounts
- All linked to the same `clientId`

**Quick Tip**: Create orders with `createdAt` dates spread over the last 30 days to see trends in the dashboard.

---

## 📈 Step 5: Create KPI Records

**Why?** KPIs are daily aggregated metrics. The dashboard can calculate from orders, but having pre-calculated KPIs is faster.

### 5.1 Create KPI Document
1. Go to **Firestore Database**
2. Click **Start collection** (or add to existing `kpis` collection)
3. **Collection ID**: `kpis`
4. **Document ID**: Click "Auto-ID"
5. **Add fields**:

   ```
   Field Name          | Type      | Value Example
   --------------------|-----------|------------------
   clientId            | string    | "client-001"
   date                | timestamp | [Date for this KPI - e.g., today]
   totalOrders         | number    | 15
   totalRevenue        | number    | 1250.50
   averageOrderValue   | number    | 83.37
   fulfillmentRate     | number    | 85.5 (percentage)
   onTimeDeliveryRate  | number    | 92.0 (percentage)
   inventoryTurnover   | number    | 4.2 (optional)
   lowStockItems       | number    | 3
   ```

### 5.2 Create Multiple KPI Records
Create KPI records for the **last 30 days** (one per day):
- Use different dates in the `date` field
- Vary the numbers to show trends
- All should have the same `clientId`

**Quick Tip**: 
- For `date`, use timestamps at midnight (00:00:00) of each day
- `fulfillmentRate` and `onTimeDeliveryRate` are percentages (0-100)
- `totalRevenue` should match the sum of orders for that day

---

## 📦 Step 6: Create Inventory Items (Optional)

**Why?** The dashboard shows "Low Stock Items" metric.

### 6.1 Create Inventory Item
1. Go to **Firestore Database**
2. Click **Start collection** (or add to existing `inventory` collection)
3. **Collection ID**: `inventory`
4. **Document ID**: Click "Auto-ID"
5. **Add fields**:

   ```
   Field Name          | Type      | Value Example
   --------------------|-----------|------------------
   clientId            | string    | "client-001"
   sku                 | string    | "WID-A-001"
   productName         | string    | "Widget A"
   quantity            | number    | 50
   lowStockThreshold   | number    | 20
   cost                | number    | 15.00
   lastUpdated         | timestamp | [Current time]
   ```

### 6.2 Create Multiple Inventory Items
Create several items:
- Some with `quantity` > `lowStockThreshold` (normal stock)
- Some with `quantity` <= `lowStockThreshold` (low stock - will show in dashboard)

---

## ✅ Step 7: Verify Your Data

### 7.1 Check Collections
Go to Firestore Database and verify you have:
- ✅ `users` collection with at least 1 user
- ✅ `clients` collection with at least 1 client
- ✅ `orders` collection with at least 5-10 orders
- ✅ `kpis` collection with at least 5-10 KPI records
- ✅ `inventory` collection (optional, but recommended)

### 7.2 Verify Relationships
- ✅ User document has `clientId` field (if user is a client)
- ✅ All orders have `clientId` matching a client document ID
- ✅ All KPIs have `clientId` matching a client document ID
- ✅ All inventory items have `clientId` matching a client document ID

### 7.3 Check Field Types
Make sure:
- ✅ Dates are **timestamp** type (not string)
- ✅ Numbers are **number** type (not string)
- ✅ Arrays are **array** type
- ✅ Maps/Objects are **map** type

---

## 🧪 Step 8: Test Your Dashboard

1. **Start your app**: `npm run dev`
2. **Login** with the user you created
3. **Go to dashboard**: `http://localhost:3000/dashboard`
4. **Verify you see**:
   - ✅ Total Orders count
   - ✅ Total Revenue
   - ✅ Average Order Value
   - ✅ Pending Orders
   - ✅ Orders chart (if you have orders with dates)
   - ✅ Recent Orders list
   - ✅ Fulfillment Rate
   - ✅ Shipped Orders
   - ✅ Low Stock Items (if you created inventory)

---

## 📝 Sample Data Templates

### Sample Order (JSON format for reference)
```json
{
  "clientId": "client-001",
  "orderNumber": "ORD-2024-001",
  "status": "delivered",
  "fulfillmentStatus": "fulfilled",
  "customerName": "Jane Smith",
  "customerEmail": "jane@example.com",
  "totalAmount": 99.99,
  "currency": "USD",
  "items": [
    {
      "id": "item-1",
      "productName": "Widget A",
      "sku": "WID-A-001",
      "quantity": 2,
      "price": 29.99,
      "total": 59.98
    },
    {
      "id": "item-2",
      "productName": "Widget B",
      "sku": "WID-B-001",
      "quantity": 1,
      "price": 39.99,
      "total": 39.99
    }
  ],
  "shippingAddress": {
    "street": "456 Oak Avenue",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "trackingNumber": "1Z999AA10123456784",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "shippedAt": "2024-01-16T14:20:00Z",
  "deliveredAt": "2024-01-18T09:15:00Z"
}
```

### Sample KPI (JSON format for reference)
```json
{
  "clientId": "client-001",
  "date": "2024-01-15T00:00:00Z",
  "totalOrders": 15,
  "totalRevenue": 1250.50,
  "averageOrderValue": 83.37,
  "fulfillmentRate": 85.5,
  "onTimeDeliveryRate": 92.0,
  "inventoryTurnover": 4.2,
  "lowStockItems": 3
}
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Dashboard shows "No data available"
**Solution**: 
- Check that orders have the correct `clientId`
- Verify user's `clientId` matches the orders' `clientId`
- Check browser console for errors

### Issue 2: Can't see orders
**Solution**:
- Verify Firestore security rules allow read access
- Check that `clientId` in orders matches user's `clientId`
- For COO/admin users, they should see all orders

### Issue 3: Dates not showing correctly
**Solution**:
- Make sure dates are **timestamp** type in Firestore
- Not string type
- Use Firebase Console's timestamp picker

### Issue 4: Numbers showing as 0
**Solution**:
- Verify `totalAmount` is **number** type (not string)
- Check that `quantity`, `price`, etc. are numbers
- Remove any currency symbols from number fields

---

## 🎯 Quick Start Checklist

- [ ] Firebase project created and Firestore enabled
- [ ] Security rules configured
- [ ] User account created (through app or manually)
- [ ] Client record created
- [ ] User linked to client (if client role)
- [ ] At least 5-10 orders created with proper structure
- [ ] At least 5-10 KPI records created (last 30 days)
- [ ] Inventory items created (optional)
- [ ] All `clientId` fields match
- [ ] All dates are timestamp type
- [ ] All numbers are number type
- [ ] Dashboard tested and showing data

---

## 📚 Next Steps

Once you have test data:
1. **Test the dashboard** - Make sure all metrics display correctly
2. **Test filtering** - Try different date ranges
3. **Test user roles** - Create COO/admin users to see all data
4. **Set up webhooks** - Connect to Shopify/ShipStation for real data
5. **Automate KPI creation** - Set up a script to calculate KPIs daily

---

## 💡 Pro Tips

1. **Use consistent clientId**: Use the same clientId across all related documents
2. **Spread dates**: Create orders/KPIs with dates spread over 30 days to see trends
3. **Vary statuses**: Create orders with different statuses to test filtering
4. **Test with real data**: Once working, import real data from your systems
5. **Backup data**: Export your Firestore data regularly

---

**Need Help?** Check the browser console for errors and verify all field names match exactly (case-sensitive!).

