import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { InventoryItem } from '@/types';

export async function getInventoryItems(clientId?: string): Promise<InventoryItem[]> {
  try {
    let q;
    if (clientId) {
      q = query(collection(db, 'inventory'), where('clientId', '==', clientId));
    } else {
      q = query(collection(db, 'inventory'));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
    })) as InventoryItem[];
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return [];
  }
}

export async function getInventoryItemById(itemId: string): Promise<InventoryItem | null> {
  try {
    const itemDoc = await getDoc(doc(db, 'inventory', itemId));
    if (itemDoc.exists()) {
      const data = itemDoc.data();
      return {
        id: itemDoc.id,
        ...data,
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      } as InventoryItem;
    }
    return null;
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return null;
  }
}

export async function createInventoryItem(item: Omit<InventoryItem, 'id' | 'lastUpdated'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'inventory'), {
      ...item,
      lastUpdated: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating inventory item:', error);
    throw error;
  }
}

export async function updateInventoryItem(itemId: string, updates: Partial<InventoryItem>): Promise<void> {
  try {
    await updateDoc(doc(db, 'inventory', itemId), {
      ...updates,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
}

export async function getLowStockItems(clientId?: string): Promise<InventoryItem[]> {
  try {
    const items = await getInventoryItems(clientId);
    return items.filter((item) => item.quantity <= item.lowStockThreshold);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    return [];
  }
}

