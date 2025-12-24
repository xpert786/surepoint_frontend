'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { OrdersChart } from '@/components/dashboard/OrdersChart';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { getOrders } from '@/lib/firebase/orders';
import { getKPIs, getKPISummary } from '@/lib/firebase/kpis';
import { useAuth } from '@/contexts/AuthContext';
import { Order, DashboardMetrics } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Package, DollarSign, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { isTeamMember } from '@/lib/auth/roles';

export default function DashboardPage() {
  const { userData, user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [kpiSummary, setKpiSummary] = useState<any | null>(null);
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
        // Get clientId - use userData.clientId or fallback to user.uid
        let clientId = userData.clientId;
        if (!clientId && user?.uid) {
          clientId = user.uid;
        }
        
        // Check if user is a team member
        const userIsTeamMember = isTeamMember(userData);
        
        // Fetch orders, KPIs, and KPI summary in parallel for better performance
        // Fetch more orders to calculate today/year metrics
        const [orders, kpis, kpiSummaryData] = await Promise.all([
          getOrders(clientId, userData.role, 1000, userIsTeamMember),
          getKPIs(clientId, userData.role, 30),
          getKPISummary(clientId, userData.role)
        ]);
        
        console.log('KPI Summary data:', kpiSummaryData);
        setKpiSummary(kpiSummaryData);

        // Calculate metrics efficiently
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Calculate today's metrics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        
        const ordersToday = orders.filter(order => {
          const orderDate = order.createdAt instanceof Date 
            ? order.createdAt 
            : new Date(order.createdAt);
          return orderDate >= today && orderDate <= todayEnd;
        });
        const revenueToday = ordersToday.reduce((sum, order) => sum + order.totalAmount, 0);
        
        // Calculate this year's metrics
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const yearEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        
        const ordersThisYear = orders.filter(order => {
          const orderDate = order.createdAt instanceof Date 
            ? order.createdAt 
            : new Date(order.createdAt);
          return orderDate >= yearStart && orderDate <= yearEnd;
        });
        const revenueThisYear = ordersThisYear.reduce((sum, order) => sum + order.totalAmount, 0);
        
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
          recentOrders: orders.slice(0, 7),
          allOrders: orders,
          ordersToday: ordersToday.length,
          revenueToday,
          ordersThisYear: ordersThisYear.length,
          revenueThisYear,
        } as any);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [userData, mounted]);

  // Calculate trend by comparing with previous period
  // For now, only show trend if there's actual data
  const calculateTrend = (current: number, previous: number): number | null => {
    if (previous === 0) {
      // If previous period had 0, and current has data, show 100% increase
      if (current > 0) return 100;
      // If both are 0, don't show trend
      return null;
    }
    // Calculate percentage change
    const change = ((current - previous) / previous) * 100;
    return Math.round(change * 10) / 10; // Round to 1 decimal place
  };

  // For now, we don't have previous period data, so don't show trend
  // TODO: Fetch previous period data (yesterday for today, last year for this year)
  const ordersTodayTrend = null; // Will be calculated when we have previous day data
  const revenueTodayTrend = null;
  const ordersThisYearTrend = null;
  const revenueThisYearTrend = null;

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
      <div className="space-y-8 p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening today..</p>
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
           

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Orders Today"
                value={(metrics as any).ordersToday ?? 0}
                icon={Package}
                trend={ordersTodayTrend !== null ? { value: ordersTodayTrend, isPositive: ordersTodayTrend >= 0 } : undefined}
              />
              <MetricCard
                title="Revenue Today"
                value={formatCurrency((metrics as any).revenueToday || 0)}
                icon={DollarSign}
                trend={revenueTodayTrend !== null ? { value: revenueTodayTrend, isPositive: revenueTodayTrend >= 0 } : undefined}
              />
              <MetricCard
                title="Orders This Year"
                value={((metrics as any).ordersThisYear || 0).toLocaleString()}
                icon={Package}
                trend={ordersThisYearTrend !== null ? { value: ordersThisYearTrend, isPositive: ordersThisYearTrend >= 0 } : undefined}
              />
              <MetricCard
                title="Revenue This Year"
                value={formatCurrency((metrics as any).revenueThisYear || 0)}
                icon={DollarSign}
                trend={revenueThisYearTrend !== null ? { value: revenueThisYearTrend, isPositive: revenueThisYearTrend >= 0 } : undefined}
              />
            </div>

            {/* Charts */}
            <OrdersChart orders={(metrics as any).allOrders || metrics.recentOrders} />

            {/* Order List Table */}
            <RecentOrders orders={metrics.recentOrders} />
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

