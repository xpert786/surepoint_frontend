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
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import { Order, UserRole, Address } from '@/types';

export async function getOrders(clientId?: string, userRole?: UserRole, limitCount: number = 50, isTeamMember?: boolean): Promise<Order[]> {
  try {
    console.log('getOrders called with:', { clientId, userRole, limitCount, isTeamMember });
    
    let q;
    // Orders are stored in the 'testing' collection with 'client_id' field
    
    // Team members (managers/workers) should only see their owner's orders, not all orders
    // Even if they have 'admin' role, they're team members and should be filtered by clientId
    if (isTeamMember && clientId) {
      // Team members can only see their owner's orders - filter by client_id
      console.log('Querying orders for team member with clientId:', clientId);
      q = query(
        collection(db, 'testing'),
        where('client_id', '==', clientId),
        limit(limitCount)
      );
    } else if (userRole === 'coo' || (userRole === 'admin' && !isTeamMember)) {
      // COO and Admin (non-team members) can see all orders
      console.log('Querying all orders (COO/Admin)');
      q = query(collection(db, 'testing'), limit(limitCount));
    } else if (clientId) {
      // Clients can only see their own orders - filter by client_id
      console.log('Querying orders for clientId:', clientId);
      q = query(
        collection(db, 'testing'),
        where('client_id', '==', clientId),
        limit(limitCount)
      );
    } else {
      // No clientId and not COO/Admin - return empty
      console.log('No clientId and not COO/Admin - returning empty');
      return [];
    }

    console.log('Executing Firestore query...');
    const querySnapshot = await getDocs(q);
    console.log(`Query returned ${querySnapshot.docs.length} documents`);
    
    const orders = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      console.log('Processing order document:', doc.id, data);
      
      // Map Firestore fields to Order type
      // Firestore has: Order ID, Customer Name, Order Date, Total, client_id, etc.
      // Order type expects: orderNumber, customerName, createdAt, totalAmount, clientId, etc.
      
      // Parse Order Date if it's a string
      let orderDate: Date;
      if (data['Order Date']) {
        if (typeof data['Order Date'] === 'string') {
          orderDate = new Date(data['Order Date']);
        } else if (data['Order Date'].toDate) {
          orderDate = data['Order Date'].toDate();
        } else {
          orderDate = new Date();
        }
      } else {
        orderDate = new Date();
      }
      
      // Parse line items if they exist
      let items: any[] = [];
      if (data['Line Items']) {
        // Try to parse line items string if it's a string
        const lineItemsStr = typeof data['Line Items'] === 'string' ? data['Line Items'] : '';
        // For now, create a simple item from the string
        if (lineItemsStr) {
          items = [{
            id: '1',
            productName: lineItemsStr,
            sku: '',
            quantity: 1,
            price: parseFloat(data['Subtotal'] || '0'),
            total: parseFloat(data['Subtotal'] || '0'),
          }];
        }
      }

      // Determine fulfillment status from order status
      let fulfillmentStatus: 'unfulfilled' | 'partial' | 'fulfilled' = 'unfulfilled';
      const status = (data['Status'] || 'pending').toLowerCase();
      if (status === 'fulfilled' || status === 'delivered') {
        fulfillmentStatus = 'fulfilled';
      } else if (status === 'processing' || status === 'shipped') {
        fulfillmentStatus = 'partial';
      }

      const order: Order = {
        id: doc.id,
        orderNumber: data['Order ID']?.toString() || data['Shopify Order Number']?.toString() || doc.id,
        customerName: data['Customer Name'] || data['Clients name'] || 'N/A',
        customerEmail: data['Customer Email'] || '',
        status: (data['Status'] || 'pending') as any,
        fulfillmentStatus,
        items,
        totalAmount: parseFloat(data['Total'] || data['Subtotal'] || '0'),
        currency: data['Currency'] || 'USD',
        clientId: data['client_id'] || data['clientId'] || '',
        shippingAddress: {
          street: data['Shipping Address']?.street || data['Address']?.street || '',
          city: data['Shipping Address']?.city || data['Address']?.city || '',
          state: data['Shipping Address']?.state || data['Address']?.state || '',
          zipCode: data['Shipping Address']?.zipCode || data['Address']?.zipCode || '',
          country: data['Shipping Address']?.country || data['Address']?.country || 'US',
        },
        createdAt: orderDate,
        updatedAt: orderDate,
      };
      
      console.log('Mapped order:', order);
      return order;
    });
    
    console.log(`Returning ${orders.length} orders`);
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    // Orders are in the 'testing' collection
    const orderDoc = await getDoc(doc(db, 'testing', orderId));
    if (orderDoc.exists()) {
      const data = orderDoc.data();
      
      // Parse Order Date if it's a string
      let orderDate: Date;
      if (data['Order Date']) {
        if (typeof data['Order Date'] === 'string') {
          orderDate = new Date(data['Order Date']);
        } else {
          orderDate = data['Order Date'].toDate();
        }
      } else {
        orderDate = new Date();
      }
      
      // Parse line items if they exist
      let items: any[] = [];
      if (data['Line Items']) {
        const lineItemsStr = typeof data['Line Items'] === 'string' ? data['Line Items'] : '';
        if (lineItemsStr) {
          items = [{
            id: '1',
            productName: lineItemsStr,
            sku: '',
            quantity: 1,
            price: parseFloat(data['Subtotal'] || '0'),
            total: parseFloat(data['Subtotal'] || '0'),
          }];
        }
      }

      // Determine fulfillment status from order status
      let fulfillmentStatus: 'unfulfilled' | 'partial' | 'fulfilled' = 'unfulfilled';
      const status = (data['Status'] || 'pending').toLowerCase();
      if (status === 'fulfilled' || status === 'delivered') {
        fulfillmentStatus = 'fulfilled';
      } else if (status === 'processing' || status === 'shipped') {
        fulfillmentStatus = 'partial';
      }

      return {
        id: orderDoc.id,
        orderNumber: data['Order ID']?.toString() || data['Shopify Order Number']?.toString() || orderDoc.id,
        customerName: data['Customer Name'] || data['Clients name'] || 'N/A',
        customerEmail: data['Customer Email'] || '',
        status: (data['Status'] || 'pending') as any,
        fulfillmentStatus,
        items,
        totalAmount: parseFloat(data['Total'] || data['Subtotal'] || '0'),
        currency: data['Currency'] || 'USD',
        clientId: data['client_id'] || data['clientId'] || '',
        shippingAddress: {
          street: data['Shipping Address']?.street || data['Address']?.street || '',
          city: data['Shipping Address']?.city || data['Address']?.city || '',
          state: data['Shipping Address']?.state || data['Address']?.state || '',
          zipCode: data['Shipping Address']?.zipCode || data['Address']?.zipCode || '',
          country: data['Shipping Address']?.country || data['Address']?.country || 'US',
        },
        createdAt: orderDate,
        updatedAt: orderDate,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

