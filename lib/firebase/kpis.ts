import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import { KPI, UserRole } from '@/types';

export async function getKPIs(clientId?: string, userRole?: UserRole, days: number = 30): Promise<KPI[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let q;
    // Limit to actual days needed (plus some buffer) instead of 100
    const limitCount = Math.min(days + 5, 50);
    
    if (userRole === 'coo' || userRole === 'admin') {
      q = query(
        collection(db, 'kpis'),
        where('date', '>=', startDate),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
    } else if (clientId) {
      q = query(
        collection(db, 'kpis'),
        where('clientId', '==', clientId),
        where('date', '>=', startDate),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
    } else {
      return [];
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate() || new Date(),
      } as KPI;
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return [];
  }
}

export async function createKPI(kpi: Omit<KPI, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'kpis'), {
      ...kpi,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating KPI:', error);
    throw error;
  }
}

