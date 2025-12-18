import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Client } from '@/types';

export async function getClients(): Promise<Client[]> {
  try {
    console.log('🔍 Fetching clients from users collection...');
    
    if (!db) {
      console.error('❌ Firestore db instance is not initialized!');
      return [];
    }
    
    // Get all users from users collection
    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);
    
    console.log(`✅ Found ${querySnapshot.docs.length} total users`);
    
    // Filter users with role "client" (case-insensitive)
    const clientUsers = querySnapshot.docs
      .map((doc) => {
        const data = doc.data();
        const role = (data.role || '').toLowerCase();
        return { doc, data, role };
      })
      .filter(({ role }) => role === 'client');
    
    console.log(`📊 Found ${clientUsers.length} users with client role`);
    
    // Map to Client format
    const clients = clientUsers.map(({ doc, data }) => {
      // Get company info from onboardingInfo if available
      const onboardingInfo = data.onboardingInfo || {};
      const companyInfo = onboardingInfo.companyInfo || {};
      
      // Get billing plan
      const billingPlan = data.billing?.plan || data.subscriptionTier || null;
      
      const client: Client = {
        id: doc.id,
        name: companyInfo.businessName || data.name || 'Unknown',
        email: data.email || companyInfo.supportEmail || '',
        phone: data.phone || companyInfo.supportPhone || '',
        address: companyInfo.registeredAddress || companyInfo.warehouseAddress || data.address || '',
        status: (data.billing?.status === 'active' || data.paymentStatus === 'paid') ? 'active' : 'inactive',
        subscriptionTier: billingPlan as 'basic' | 'pro' | 'enterprise' | undefined,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
      
      console.log(`📄 Client: ${client.name} (${client.email}) - ${client.status} - Plan: ${billingPlan}`);
      return client;
    });
    
    console.log(`✅ Returning ${clients.length} clients`);
    return clients;
  } catch (error: any) {
    console.error('❌ Error fetching clients:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'permission-denied') {
      console.error('🚫 PERMISSION DENIED: Check Firestore security rules');
    }
    
    return [];
  }
}

export async function getClientById(clientId: string): Promise<Client | null> {
  try {
    const clientDoc = await getDoc(doc(db, 'clients', clientId));
    if (clientDoc.exists()) {
      const data = clientDoc.data();
      return {
        id: clientDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Client;
    }
    return null;
  } catch (error) {
    console.error('Error fetching client:', error);
    return null;
  }
}

export async function createClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'clients'), {
      ...client,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
}

export async function updateClient(clientId: string, updates: Partial<Client>): Promise<void> {
  try {
    await updateDoc(doc(db, 'clients', clientId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
}

