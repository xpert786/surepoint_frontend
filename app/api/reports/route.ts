import { NextRequest, NextResponse } from 'next/server';
import { getOrders } from '@/lib/firebase/orders';
import { getKPIs } from '@/lib/firebase/kpis';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId') || undefined;
    const role = searchParams.get('role') as 'client' | 'coo' | 'admin' | undefined;
    const type = searchParams.get('type') || 'summary';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (type === 'orders') {
      const orders = await getOrders(clientId, role);
      
      // Filter by date range if provided
      let filteredOrders = orders;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        filteredOrders = orders.filter(
          (order) => order.createdAt >= start && order.createdAt <= end
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          orders: filteredOrders,
          total: filteredOrders.length,
          revenue: filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        },
      });
    }

    if (type === 'kpis') {
      const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30;
      const kpis = await getKPIs(clientId, role, days);
      
      return NextResponse.json({
        success: true,
        data: kpis,
      });
    }

    // Default summary report
    const orders = await getOrders(clientId, role);
    const kpis = await getKPIs(clientId, role, 30);

    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: orders.length > 0
        ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length
        : 0,
      pendingOrders: orders.filter((o) => o.status === 'pending' || o.status === 'processing').length,
      shippedOrders: orders.filter((o) => o.status === 'shipped' || o.status === 'delivered').length,
      fulfillmentRate: orders.length > 0
        ? (orders.filter((o) => o.status === 'shipped' || o.status === 'delivered').length / orders.length) * 100
        : 0,
      kpiCount: kpis.length,
    };

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

