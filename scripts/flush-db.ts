/**
 * Script to flush/clear Firestore database
 * WARNING: This will delete ALL data from the database
 * 
 * Usage: npx tsx scripts/flush-db.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
// Get the project root (parent of scripts directory)
const projectRoot = resolve(process.cwd());
config({ path: resolve(projectRoot, '.env.local') });

import { getAdminDb } from '../lib/firebase/admin';

async function flushDatabase() {
  try {
    console.log('⚠️  WARNING: This will delete ALL data from Firestore!');
    console.log('Starting database flush...\n');

    const adminDb = getAdminDb();
    
    // Get all collections
    const collections = await adminDb.listCollections();
    
    console.log(`Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`  - ${col.id}`));
    console.log('');

    // Delete all documents in each collection
    for (const collection of collections) {
      console.log(`🗑️  Deleting all documents from collection: ${collection.id}`);
      
      const snapshot = await collection.get();
      const totalDocs = snapshot.size;
      
      if (totalDocs === 0) {
        console.log(`   No documents to delete in ${collection.id}`);
        continue;
      }
      
      const batchSize = 500; // Firestore batch limit
      const docs = snapshot.docs;
      
      // Process in batches
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = adminDb.batch();
        const batchDocs = docs.slice(i, i + batchSize);
        
        batchDocs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log(`   Deleted batch ${Math.floor(i / batchSize) + 1} (${batchDocs.length} documents)`);
      }
      
      console.log(`✅ Deleted ${totalDocs} documents from ${collection.id}`);
    }

    console.log('\n✅ Database flush completed successfully!');
    console.log('All collections have been cleared.');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error flushing database:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

// Run the script
flushDatabase();

