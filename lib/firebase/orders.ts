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
import { Order, UserRole } from '@/types';

export async function getOrders(clientId?: string, userRole?: UserRole, limitCount: number = 50): Promise<Order[]> {
  try {
    console.log('getOrders called with:', { clientId, userRole, limitCount });
    
    let q;
    // Orders are stored in the 'testing' collection with 'client_id' field
    if (userRole === 'coo' || userRole === 'admin') {
      // COO and Admin can see all orders
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
      
      const order = {
        id: doc.id,
        orderNumber: data['Order ID']?.toString() || data['Shopify Order Number']?.toString() || doc.id,
        customerName: data['Customer Name'] || data['Clients name'] || 'N/A',
        customerEmail: data['Customer Email'] || '',
        status: data['Status'] || 'pending',
        totalAmount: parseFloat(data['Total'] || data['Subtotal'] || '0'),
        currency: data['Currency'] || 'USD',
        clientId: data['client_id'] || data['clientId'] || '',
        createdAt: orderDate,
        updatedAt: orderDate,
        // Map other fields if they exist
        lineItems: data['Line Items'] || '',
        shipping: parseFloat(data['Shipping'] || '0'),
        subtotal: parseFloat(data['Subtotal'] || '0'),
        fulfillmentStatus: data['Fulfillment Status'] || 'unfulfilled',
        items: data['Line Items'] || [],
        shippingAddress: {
          street: data['Shipping Address']?.address1 || '',
          city: data['Shipping Address']?.city || '',
          state: data['Shipping Address']?.province || '',
          zipCode: data['Shipping Address']?.zip || '',
          country: data['Shipping Address']?.country || '',
        },
      } as Order;
      
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
      
      return {
        id: orderDoc.id,
        orderNumber: data['Order ID']?.toString() || data['Shopify Order Number']?.toString() || orderDoc.id,
        customerName: data['Customer Name'] || data['Clients name'] || 'N/A',
        customerEmail: data['Customer Email'] || '',
        status: data['Status'] || 'pending',
        totalAmount: parseFloat(data['Total'] || data['Subtotal'] || '0'),
        currency: data['Currency'] || 'USD',
        clientId: data['client_id'] || data['clientId'] || '',
        createdAt: orderDate,
        updatedAt: orderDate,
        lineItems: data['Line Items'] || '',
        shipping: parseFloat(data['Shipping'] || '0'),
        subtotal: parseFloat(data['Subtotal'] || '0'),
        fulfillmentStatus: data['Fulfillment Status'] || 'unfulfilled',
        items: data['Line Items'] || [],
        shippingAddress: {
          street: data['Shipping Address']?.address1 || '',
          city: data['Shipping Address']?.city || '',
          state: data['Shipping Address']?.province || '',
          zipCode: data['Shipping Address']?.zip || '',
          country: data['Shipping Address']?.country || '',
        },
      } as Order;
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

