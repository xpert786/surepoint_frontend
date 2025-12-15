import { getOrders } from './orders';
import { getKPIs } from './kpis';
import { getLowStockItems } from './inventory';
import { DashboardMetrics, UserRole } from '@/types';

export async function getDashboardMetrics(
  clientId?: string,
  userRole?: UserRole
): Promise<DashboardMetrics> {
  try {
    const [orders, kpis, lowStockItems] = await Promise.all([
      getOrders(clientId, userRole),
      getKPIs(clientId, userRole, 30),
      getLowStockItems(clientId),
    ]);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const pendingOrders = orders.filter(
      (o) => o.status === 'pending' || o.status === 'processing'
    ).length;
    const shippedOrders = orders.filter(
      (o) => o.status === 'shipped' || o.status === 'delivered'
    ).length;
    const fulfillmentRate = totalOrders > 0 ? (shippedOrders / totalOrders) * 100 : 0;

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      pendingOrders,
      shippedOrders,
      fulfillmentRate,
      lowStockItems: lowStockItems.length,
      recentOrders: orders.slice(0, 5),
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
}

