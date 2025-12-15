/**
 * Script to add dummy data to Firebase
 * Run with: npm run add-dummy-data
 * 
 * This script adds:
 * - Dummy clients (if none exist)
 * - Dummy orders
 * - Dummy KPIs (last 30 days)
 * - Dummy inventory items
 */

// CRITICAL: Load environment variables FIRST before any Firebase imports
const fs = require('fs');
const path = require('path');

// Load .env.local file
function loadEnvVars() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!');
    console.error('   Please make sure .env.local exists in the project root.');
    process.exit(1);
  }

  const envFile = fs.readFileSync(envPath, 'utf8');
  let loadedCount = 0;
  
  envFile.split('\n').forEach((line: string) => {
    // Skip comments and empty lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    const match = trimmed.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Set environment variable
      process.env[key] = value;
      loadedCount++;
    }
  });
  
  console.log(`✅ Loaded ${loadedCount} environment variables from .env.local`);
  
  // Verify required Firebase vars are loaded
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  
  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    process.exit(1);
  }
}

// Load environment variables immediately
loadEnvVars();

// Helper functions (don't depend on Firebase)
function randomDate(daysAgo: number): Date {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Sample data arrays
const sampleNames = ['John Smith', 'Jane Doe', 'Robert Johnson', 'Emily Davis', 'Michael Brown', 'Sarah Wilson', 'David Lee', 'Lisa Anderson'];
const sampleEmails = ['john@example.com', 'jane@example.com', 'robert@example.com', 'emily@example.com', 'michael@example.com', 'sarah@example.com', 'david@example.com', 'lisa@example.com'];
const sampleProducts = [
  { name: 'Premium T-Shirt', sku: 'TSH-001', price: 29.99 },
  { name: 'Denim Jeans', sku: 'JNS-002', price: 79.99 },
  { name: 'Running Shoes', sku: 'SHO-003', price: 129.99 },
  { name: 'Baseball Cap', sku: 'CAP-004', price: 24.99 },
  { name: 'Hoodie', sku: 'HOD-005', price: 59.99 },
  { name: 'Sunglasses', sku: 'SUN-006', price: 89.99 },
  { name: 'Backpack', sku: 'BAG-007', price: 49.99 },
  { name: 'Watch', sku: 'WAT-008', price: 199.99 },
];
const sampleCities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];
const sampleStates = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA'];
const sampleClientNames = ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Mega Retail', 'Prime Services'];

async function createDummyClients(db: any, collection: any, getDocs: any, addDoc: any, Timestamp: any, Client: any): Promise<string[]> {
  console.log('📋 Creating dummy clients...');
  
  // Check if clients already exist
  const existingClients = await getDocs(collection(db, 'clients'));
  if (existingClients.size > 0) {
    console.log(`✅ Found ${existingClients.size} existing clients, using them...`);
    return existingClients.docs.map((doc: any) => doc.id);
  }

  const clientIds: string[] = [];
  for (let i = 0; i < 3; i++) {
    const client: any = {
      name: sampleClientNames[i] || `Client ${i + 1}`,
      email: `client${i + 1}@example.com`,
      phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      address: `${randomInt(100, 9999)} Main St, ${sampleCities[i]}, ${sampleStates[i]} ${randomInt(10000, 99999)}`,
      status: 'active',
      subscriptionTier: ['basic', 'pro', 'enterprise'][i],
    };

    const docRef = await addDoc(collection(db, 'clients'), {
      ...client,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    clientIds.push(docRef.id);
    console.log(`  ✓ Created client: ${client.name} (${docRef.id})`);
  }

  return clientIds;
}

async function createDummyOrders(db: any, collection: any, addDoc: any, Timestamp: any, clientIds: string[], Order: any): Promise<void> {
  console.log('📦 Creating dummy orders...');
  
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const fulfillmentStatuses = ['unfulfilled', 'partial', 'fulfilled'];
  
  for (let i = 0; i < 50; i++) {
    const clientId = clientIds[randomInt(0, clientIds.length - 1)];
    const customerIndex = randomInt(0, sampleNames.length - 1);
    const orderDate = randomDate(60); // Orders from last 60 days
    const status = statuses[randomInt(0, statuses.length - 1)];
    const fulfillmentStatus = fulfillmentStatuses[randomInt(0, fulfillmentStatuses.length - 1)];
    
    // Generate 1-4 items per order
    const numItems = randomInt(1, 4);
    const items = [];
    let totalAmount = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = sampleProducts[randomInt(0, sampleProducts.length - 1)];
      const quantity = randomInt(1, 3);
      const itemTotal = product.price * quantity;
      totalAmount += itemTotal;
      
      items.push({
        id: `item-${i}-${j}`,
        productName: product.name,
        sku: product.sku,
        quantity,
        price: product.price,
        total: itemTotal,
      });
    }

    const cityIndex = randomInt(0, sampleCities.length - 1);
    const order: any = {
      clientId,
      orderNumber: `ORD-${String(1000 + i).padStart(6, '0')}`,
      shopifyOrderId: `shopify-${randomInt(100000, 999999)}`,
      status,
      fulfillmentStatus,
      customerName: sampleNames[customerIndex],
      customerEmail: sampleEmails[customerIndex],
      items,
      totalAmount: Math.round(totalAmount * 100) / 100,
      currency: 'USD',
      shippingAddress: {
        street: `${randomInt(100, 9999)} ${['Main', 'Oak', 'Elm', 'Park', 'First'][randomInt(0, 4)]} St`,
        city: sampleCities[cityIndex],
        state: sampleStates[cityIndex],
        zipCode: String(randomInt(10000, 99999)),
        country: 'USA',
      },
      createdAt: Timestamp.fromDate(orderDate),
      updatedAt: Timestamp.fromDate(orderDate),
    };

    // Add optional fields only if they have values (Firestore doesn't allow undefined)
    if (status === 'shipped' || status === 'delivered') {
      order.trackingNumber = `TRK${randomInt(1000000, 9999999)}`;
      order.trackingUrl = `https://tracking.example.com/${order.trackingNumber}`;
      order.shippedAt = Timestamp.fromDate(randomDate(30));
    }
    
    if (status === 'delivered') {
      order.deliveredAt = Timestamp.fromDate(randomDate(15));
    }

    await addDoc(collection(db, 'orders'), order);
    
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ Created ${i + 1} orders...`);
    }
  }
  
  console.log(`✅ Created 50 dummy orders`);
}

async function createDummyKPIs(db: any, collection: any, addDoc: any, Timestamp: any, clientIds: string[], KPI: any): Promise<void> {
  console.log('📊 Creating dummy KPIs...');
  
  for (let day = 0; day < 30; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    
    for (const clientId of clientIds) {
      const totalOrders = randomInt(5, 25);
      const totalRevenue = randomFloat(500, 5000);
      const averageOrderValue = totalRevenue / totalOrders;
      const fulfillmentRate = randomFloat(85, 98);
      const onTimeDeliveryRate = randomFloat(90, 99);
      const inventoryTurnover = randomFloat(2, 8);
      const lowStockItems = randomInt(0, 5);
      
      const kpi: any = {
        clientId,
        date,
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
        onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
        inventoryTurnover: Math.round(inventoryTurnover * 100) / 100,
        lowStockItems,
      };

      await addDoc(collection(db, 'kpis'), {
        ...kpi,
        date: Timestamp.fromDate(date),
        createdAt: Timestamp.now(),
      });
    }
    
    if ((day + 1) % 10 === 0) {
      console.log(`  ✓ Created KPIs for ${day + 1} days...`);
    }
  }
  
  console.log(`✅ Created KPIs for 30 days (${clientIds.length} clients × 30 days = ${clientIds.length * 30} KPI records)`);
}

async function createDummyInventory(db: any, collection: any, addDoc: any, Timestamp: any, clientIds: string[], InventoryItem: any): Promise<void> {
  console.log('📦 Creating dummy inventory items...');
  
  for (const clientId of clientIds) {
    for (let i = 0; i < 15; i++) {
      const product = sampleProducts[randomInt(0, sampleProducts.length - 1)];
      const quantity = randomInt(0, 200);
      const lowStockThreshold = randomInt(10, 30);
      const cost = product.price * randomFloat(0.3, 0.6); // Cost is 30-60% of price
      
      const item: any = {
        clientId,
        sku: `${product.sku}-${String(i + 1).padStart(3, '0')}`,
        productName: product.name,
        quantity,
        lowStockThreshold,
        cost: Math.round(cost * 100) / 100,
      };

      await addDoc(collection(db, 'inventory'), {
        ...item,
        lastUpdated: Timestamp.now(),
      });
    }
  }
  
  console.log(`✅ Created ${clientIds.length * 15} dummy inventory items`);
}

async function main() {
  console.log('🚀 Starting dummy data generation...\n');
  
  try {
    // Dynamically import Firebase modules AFTER env vars are loaded
    console.log('📦 Loading Firebase modules...');
    const { initializeApp, getApps } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');
    const { collection, getDocs, addDoc, Timestamp } = await import('firebase/firestore');
    
    // Initialize Firebase directly here (env vars are already loaded)
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };
    
    let app;
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    
    const db = getFirestore(app);
    
    console.log('✅ Firebase modules loaded\n');
    
    // Step 1: Create or get clients
    const clientIds = await createDummyClients(db, collection, getDocs, addDoc, Timestamp, null);
    console.log('');
    
    // Step 2: Create orders
    await createDummyOrders(db, collection, addDoc, Timestamp, clientIds, null);
    console.log('');
    
    // Step 3: Create KPIs
    await createDummyKPIs(db, collection, addDoc, Timestamp, clientIds, null);
    console.log('');
    
    // Step 4: Create inventory
    await createDummyInventory(db, collection, addDoc, Timestamp, clientIds, null);
    console.log('');
    
    console.log('✅ All dummy data has been added successfully!');
    console.log(`\nSummary:`);
    console.log(`  - Clients: ${clientIds.length}`);
    console.log(`  - Orders: 50`);
    console.log(`  - KPIs: ${clientIds.length * 30} (30 days × ${clientIds.length} clients)`);
    console.log(`  - Inventory Items: ${clientIds.length * 15}`);
    
  } catch (error) {
    console.error('❌ Error adding dummy data:', error);
    process.exit(1);
  }
}

// Run the script
main();
