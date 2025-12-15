import { NextRequest, NextResponse } from 'next/server';
import { updateOrder, getOrderById } from '@/lib/firebase/orders';

// Webhook endpoint for real-time updates from external services
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === 'shipstation_update') {
      // Handle ShipStation tracking updates
      const { orderId, trackingNumber, trackingUrl, status } = data;
      
      if (orderId) {
        const order = await getOrderById(orderId);
        if (order) {
          await updateOrder(orderId, {
            trackingNumber,
            trackingUrl,
            status: status === 'shipped' ? 'shipped' : order.status,
            shippedAt: status === 'shipped' ? new Date() : order.shippedAt,
          });
        }
      }
    }

    if (type === 'shopify_order_update') {
      // Handle Shopify order updates
      const { shopifyOrderId, status, fulfillmentStatus } = data;
      
      // TODO: Find order by shopifyOrderId and update
      // This would require a query by shopifyOrderId field
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

