'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { OrdersChart } from '@/components/dashboard/OrdersChart';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { getOrders } from '@/lib/firebase/orders';
import { getKPIs } from '@/lib/firebase/kpis';
import { useAuth } from '@/contexts/AuthContext';
import { Order, DashboardMetrics } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Package, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { userData, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      if (!userData || !mounted) return;
      
      setLoading(true);
      
      try {
        // Fetch orders and KPIs in parallel for better performance
        const [orders, kpis] = await Promise.all([
          getOrders(userData.clientId, userData.role),
          getKPIs(userData.clientId, userData.role, 30)
        ]);

        // Calculate metrics efficiently
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Single pass through orders for status counts
        let pendingOrders = 0;
        let shippedOrders = 0;
        for (const order of orders) {
          if (order.status === 'pending' || order.status === 'processing') {
            pendingOrders++;
          } else if (order.status === 'shipped' || order.status === 'delivered') {
            shippedOrders++;
          }
        }
        
        const fulfillmentRate = totalOrders > 0 ? (shippedOrders / totalOrders) * 100 : 0;
        const lowStockItems = 0; // TODO: Calculate from inventory

        setMetrics({
          totalOrders,
          totalRevenue,
          averageOrderValue,
          pendingOrders,
          shippedOrders,
          fulfillmentRate,
          lowStockItems,
          recentOrders: orders.slice(0, 5),
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [userData, mounted]);

  // Show loading state during initial mount to prevent hydration mismatch
  if (!mounted || authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show skeleton/loading state while data loads, but render layout immediately
  const isLoading = loading || !metrics;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {userData?.name || 'User'}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        ) : metrics ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Orders"
                value={metrics.totalOrders}
                description="All time"
                icon={Package}
              />
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(metrics.totalRevenue)}
                description="All time"
                icon={DollarSign}
              />
              <MetricCard
                title="Avg Order Value"
                value={formatCurrency(metrics.averageOrderValue)}
                description="Last 30 days"
                icon={TrendingUp}
              />
              <MetricCard
                title="Pending Orders"
                value={metrics.pendingOrders}
                description="Requires attention"
                icon={AlertCircle}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OrdersChart orders={metrics.recentOrders} />
              <RecentOrders orders={metrics.recentOrders} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Fulfillment Rate"
                value={`${metrics.fulfillmentRate.toFixed(1)}%`}
                description="Orders shipped/delivered"
              />
              <MetricCard
                title="Shipped Orders"
                value={metrics.shippedOrders}
                description="Completed shipments"
              />
              <MetricCard
                title="Low Stock Items"
                value={metrics.lowStockItems}
                description="Needs restocking"
                icon={AlertCircle}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No data available</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

