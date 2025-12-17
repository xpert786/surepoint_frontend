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

// Fetch KPI summary from the "KPI" collection (capital) with "Client" field
export async function getKPISummary(clientId?: string, userRole?: UserRole): Promise<any | null> {
  try {
    console.log('getKPISummary called with:', { clientId, userRole });
    
    if (!clientId && userRole !== 'coo' && userRole !== 'admin') {
      console.log('No clientId and not COO/Admin, returning null');
      return null;
    }

    let q;
    if (userRole === 'coo' || userRole === 'admin') {
      // For COO/Admin, get all KPI documents and sort client-side
      console.log('Querying all KPI documents (COO/Admin)');
      q = query(
        collection(db, 'KPI'),
        limit(100) // Get recent documents
      );
    } else if (clientId) {
      // For clients, filter by Client field
      console.log('Querying KPI documents for clientId:', clientId);
      q = query(
        collection(db, 'KPI'),
        where('Client', '==', clientId),
        limit(100) // Get recent documents
      );
    } else {
      console.log('No query conditions met, returning null');
      return null;
    }

    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.docs.length} KPI documents`);
    
    if (querySnapshot.empty) {
      console.log('No KPI documents found');
      return null;
    }
    
    // Log all documents found
    querySnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Document ${index + 1} (${doc.id}):`, {
        Client: data['Client'],
        'Computed At': data['Computed At'],
        'Total Order This Year': data['Total Order This Year'],
        'Total Revenue This Year': data['Total Revenue This Year'],
      });
    });

    // Sort by Computed At (handle both string and date formats) and get the most recent
    const sortedDocs = querySnapshot.docs.sort((a, b) => {
      const aDate = a.data()['Computed At'];
      const bDate = b.data()['Computed At'];
      // If both are strings, compare as strings (descending - newest first)
      if (typeof aDate === 'string' && typeof bDate === 'string') {
        return bDate.localeCompare(aDate);
      }
      // If dates, compare as dates
      if (aDate?.toDate && bDate?.toDate) {
        return bDate.toDate().getTime() - aDate.toDate().getTime();
      }
      return 0;
    });

    console.log(`Sorted ${sortedDocs.length} documents, selecting most recent`);
    const doc = sortedDocs[0];
    const data = doc.data();
    
    console.log('Selected document ID:', doc.id);
    console.log('Selected document Client:', data['Client']);
    console.log('Selected document Computed At:', data['Computed At']);
    
    // Map Firestore fields to a more usable structure
    // Log raw data to debug field names
    console.log('Raw KPI data fields:', Object.keys(data));
    console.log('Unfulfilled orders >24h value:', data['Unfulfilled orders >24h']);
    console.log('Unfulfilled orders >24h type:', typeof data['Unfulfilled orders >24h']);
    console.log('All data:', data);
    
    // Handle unfulfilled orders - check if it exists and is not null/undefined
    let unfulfilledOrders = 0;
    if (data['Unfulfilled orders >24h'] !== undefined && data['Unfulfilled orders >24h'] !== null) {
      unfulfilledOrders = Number(data['Unfulfilled orders >24h']) || 0;
    }
    
    return {
      id: doc.id,
      avgFulfillmentTime: data['Avg Fulfillment Time'] || 0,
      avgOrderValue: data['Avg Order Value'] || 0,
      client: data['Client'] || '',
      computedAt: data['Computed At'] || '',
      fulfilledOrders: data['Fulfilled Orders'] || 0,
      lateFulfilledOrders24h: data['Late Fulfilled orders >24h'] || 0,
      metricName: data['Metric Name'] || '',
      onTimeFulfilled: data['On-time Fulfilled'] || 0,
      pendingOrders: data['Pending Orders '] || data['Pending Orders'] || 0,
      todayRevenue: data['Today Revenue'] || 0,
      todayTotalOrder: data['Today Total Order'] || 0,
      totalOrderThisYear: data['Total Order This Year'] || 0,
      totalRevenueThisYear: data['Total Revenue This Year'] || 0,
      unfulfilledOrders24h: unfulfilledOrders,
      // Raw data for reference
      raw: data,
    };
  } catch (error) {
    console.error('Error fetching KPI summary:', error);
    return null;
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

