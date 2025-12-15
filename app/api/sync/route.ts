import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/firebase/orders';
import { Order } from '@/types';

// This endpoint would be called by Zapier/Make webhooks
// to sync orders from Shopify, ShipStation, etc.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, data } = body;

    // Handle different sync sources
    if (source === 'shopify') {
      // Transform Shopify order data to our Order format
      const order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
        clientId: data.clientId || 'default-client',
        orderNumber: data.order_number || data.name,
        shopifyOrderId: data.id?.toString(),
        status: mapShopifyStatus(data.fulfillment_status),
        fulfillmentStatus: data.fulfillment_status === 'fulfilled' ? 'fulfilled' : 'unfulfilled',
        customerName: `${data.customer?.first_name || ''} ${data.customer?.last_name || ''}`.trim(),
        customerEmail: data.customer?.email || '',
        items: (data.line_items || []).map((item: any) => ({
          id: item.id?.toString() || Math.random().toString(),
          productName: item.name,
          sku: item.sku || '',
          quantity: item.quantity,
          price: parseFloat(item.price),
          total: parseFloat(item.price) * item.quantity,
        })),
        totalAmount: parseFloat(data.total_price || 0),
        currency: data.currency || 'USD',
        shippingAddress: {
          street: data.shipping_address?.address1 || '',
          city: data.shipping_address?.city || '',
          state: data.shipping_address?.province || '',
          zipCode: data.shipping_address?.zip || '',
          country: data.shipping_address?.country || '',
        },
      };

      const orderId = await createOrder(order);
      return NextResponse.json({ success: true, orderId });
    }

    if (source === 'shipstation') {
      // Transform ShipStation data
      // TODO: Implement ShipStation sync
      return NextResponse.json({ success: true, message: 'ShipStation sync not yet implemented' });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown sync source' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function mapShopifyStatus(fulfillmentStatus: string): Order['status'] {
  const statusMap: Record<string, Order['status']> = {
    fulfilled: 'shipped',
    partial: 'processing',
    unfulfilled: 'pending',
    restocked: 'cancelled',
  };
  return statusMap[fulfillmentStatus] || 'pending';
}

