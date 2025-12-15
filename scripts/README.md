# Dummy Data Script

This script adds dummy data to your Firebase Firestore database for testing and development purposes.

## What it adds:

- **Clients**: 3 dummy client records (if none exist)
- **Orders**: 50 dummy orders with various statuses
- **KPIs**: 30 days of KPI data for each client (90 total KPI records for 3 clients)
- **Inventory**: 15 inventory items per client (45 total items for 3 clients)

## Prerequisites

1. Make sure your Firebase environment variables are set. The script will try to load them from `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. (Optional) If you get environment variable errors, install dotenv:
   ```bash
   npm install -D dotenv
   ```

## How to run:

```bash
npm run add-dummy-data
```

Or directly with tsx:

```bash
npx tsx scripts/add-dummy-data.ts
```

## Notes:

- The script will check if clients already exist. If they do, it will use existing client IDs instead of creating new ones.
- Orders are created with random dates from the last 60 days.
- KPIs are created for the last 30 days.
- All data is randomly generated but follows realistic patterns.
- The script is safe to run multiple times - it will add more data each time.

## Data Summary:

After running, you should have:
- **3 Clients** (or existing clients)
- **50 Orders** (spread across clients)
- **90 KPIs** (30 days × 3 clients)
- **45 Inventory Items** (15 per client)

