/**
 * Script to flush/clear Firebase Authentication users
 * WARNING: This will delete ALL authentication users
 * 
 * Usage: npx tsx scripts/flush-auth.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { getAuth } from 'firebase-admin/auth';

// Load environment variables from .env.local
const projectRoot = resolve(process.cwd());
config({ path: resolve(projectRoot, '.env.local') });

import { getAdminDb } from '../lib/firebase/admin';

async function flushAuthUsers() {
  try {
    console.log('⚠️  WARNING: This will delete ALL Firebase Authentication users!');
    console.log('Starting authentication users flush...\n');

    // Initialize Admin SDK (this will get the app)
    const adminDb = getAdminDb();
    
    // Get the admin app
    const { getApps } = await import('firebase-admin/app');
    const apps = getApps();
    if (apps.length === 0) {
      throw new Error('Firebase Admin not initialized');
    }
    
    const adminApp = apps[0];
    const auth = getAuth(adminApp);
    
    // List all users (in batches of 1000)
    let nextPageToken: string | undefined;
    let totalDeleted = 0;
    
    do {
      const listUsersResult = await auth.listUsers(1000, nextPageToken);
      
      if (listUsersResult.users.length === 0) {
        console.log('No users to delete.');
        break;
      }
      
      console.log(`Found ${listUsersResult.users.length} users to delete...`);
      
      // Delete users in batches
      const uids = listUsersResult.users.map(user => user.uid);
      await auth.deleteUsers(uids);
      
      totalDeleted += uids.length;
      console.log(`✅ Deleted ${uids.length} users (Total: ${totalDeleted})`);
      
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`\n✅ Authentication flush completed successfully!`);
    console.log(`Total users deleted: ${totalDeleted}`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error flushing authentication users:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

// Run the script
flushAuthUsers();

