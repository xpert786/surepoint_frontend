'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { getKPIs, getKPISummary } from '@/lib/firebase/kpis';
import { getOrders } from '@/lib/firebase/orders';
import { OrdersChart } from '@/components/dashboard/OrdersChart';
import { useAuth } from '@/contexts/AuthContext';
import { KPI } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, TrendingUp, AlertCircle, Package } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { canAccessSection, isTeamMember } from '@/lib/auth/roles';
import { useRouter } from 'next/navigation';

export default function KPIsPage() {
  const { userData, user } = useAuth();
  const router = useRouter();
  
  // Check if user can access KPIs
  useEffect(() => {
    if (userData && !canAccessSection(userData, 'kpis')) {
      router.push('/dashboard');
    }
  }, [userData, router]);
  const [kpiSummary, setKpiSummary] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'WEEKLY' | 'MONTHLY' | 'YEARLY'>('WEEKLY');

  useEffect(() => {
    async function loadKPIData() {
      if (!userData) return;

      try {
        // Get clientId - prioritize user.uid since KPI documents use UID as Client field
        let clientId = user?.uid || userData.clientId;
        
        console.log('=== Client ID Debug ===');
        console.log('user.uid:', user?.uid);
        console.log('userData.clientId:', userData.clientId);
        console.log('userData.id:', userData.id);
        console.log('userData.email:', userData.email);
        console.log('Final clientId used:', clientId);
        console.log('userData.role:', userData.role);
        
        // Check if user is a team member
        const userIsTeamMember = isTeamMember(userData);
        
        // Fetch KPI summary and orders in parallel
        const [kpiData, ordersData] = await Promise.all([
          getKPISummary(clientId, userData.role),
          getOrders(clientId, userData.role, 1000, userIsTeamMember)
        ]);

        console.log('=== KPI Summary Data ===');
        console.log('Full KPI Data:', kpiData);
        console.log('Computed At:', kpiData?.computedAt);
        console.log('Client:', kpiData?.client);
        console.log('Total Order This Year:', kpiData?.totalOrderThisYear, typeof kpiData?.totalOrderThisYear);
        console.log('Total Revenue This Year:', kpiData?.totalRevenueThisYear, typeof kpiData?.totalRevenueThisYear);
        console.log('Avg Order Value:', kpiData?.avgOrderValue, typeof kpiData?.avgOrderValue);
        console.log('Pending Orders:', kpiData?.pendingOrders, typeof kpiData?.pendingOrders);
        console.log('Today Revenue:', kpiData?.todayRevenue, typeof kpiData?.todayRevenue);
        console.log('Today Total Order:', kpiData?.todayTotalOrder, typeof kpiData?.todayTotalOrder);
        console.log('Unfulfilled orders >24h:', kpiData?.unfulfilledOrders24h, typeof kpiData?.unfulfilledOrders24h);
        console.log('Raw data:', kpiData?.raw);

        // If KPI data is null but we have orders, calculate metrics from orders as fallback
        if (!kpiData && ordersData.length > 0) {
          console.log('KPI data not available, calculating from orders...');
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const yearStart = new Date(today.getFullYear(), 0, 1);
          
          const ordersThisYear = ordersData.filter(order => {
            const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
            return orderDate >= yearStart;
          });
          
          const ordersToday = ordersData.filter(order => {
            const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
            return orderDate >= today;
          });
          
          const totalRevenueThisYear = ordersThisYear.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
          const revenueToday = ordersToday.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
          const avgOrderValue = ordersThisYear.length > 0 ? totalRevenueThisYear / ordersThisYear.length : 0;
          const pendingOrders = ordersData.filter(o => o.status === 'pending' || o.status === 'processing').length;
          
          // Calculate unfulfilled orders >24h (orders older than 24 hours that are still pending)
          const now = new Date();
          const unfulfilledOrders24h = ordersData.filter(order => {
            const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
            const hoursDiff = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
            const status = order.status?.toLowerCase() || '';
            return (status === 'pending' || status === 'processing') && hoursDiff > 24;
          }).length;
          
          const fulfilledOrdersCount = ordersData.filter(o => {
            const status = o.status?.toLowerCase() || '';
            return status === 'delivered' || o.fulfillmentStatus === 'fulfilled';
          }).length;
          
          const fallbackKpiData = {
            totalOrderThisYear: ordersThisYear.length,
            totalRevenueThisYear: totalRevenueThisYear,
            avgOrderValue: avgOrderValue,
            pendingOrders: pendingOrders,
            todayRevenue: revenueToday,
            todayTotalOrder: ordersToday.length,
            unfulfilledOrders24h: unfulfilledOrders24h,
            fulfilledOrders: fulfilledOrdersCount,
            onTimeFulfilled: 0, // Can't calculate without fulfillment time data
            lateFulfilledOrders24h: 0, // Can't calculate without fulfillment time data
            avgFulfillmentTime: 0,
            computedAt: (() => {
              // Format today's date as "Dec 17, 2025"
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const month = months[today.getMonth()];
              const day = today.getDate();
              const year = today.getFullYear();
              return `${month} ${day}, ${year}`;
            })(),
            client: clientId,
          };
          
          console.log('Fallback KPI data calculated:', fallbackKpiData);
          setKpiSummary(fallbackKpiData);
        } else {
          setKpiSummary(kpiData);
        }
        
        setOrders(ordersData);
      } catch (error) {
        console.error('Error loading KPI data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadKPIData();
  }, [userData, user]);

  // Calculate YTD metrics from KPI summary
  const totalOrdersYTD = kpiSummary?.totalOrderThisYear || 0;
  const totalRevenueYTD = kpiSummary?.totalRevenueThisYear || 0;
  const avgOrderValue = kpiSummary?.avgOrderValue || 0;
  
  // Prepare metrics object for MetricCard components
  const metrics = {
    ordersToday: kpiSummary?.todayTotalOrder || 0,
    revenueToday: kpiSummary?.todayRevenue || 0,
    ordersThisYear: kpiSummary?.totalOrderThisYear || 0,
    revenueThisYear: kpiSummary?.totalRevenueThisYear || 0,
  };
  
  const trendValue = 0; // Placeholder trend value
  
  // Calculate fulfillment rate: (Fulfilled Orders / Total Orders) * 100
  // If no fulfilled orders, use on-time fulfilled as base
  const totalFulfilled = (kpiSummary?.fulfilledOrders || 0) + (kpiSummary?.onTimeFulfilled || 0);
  const fulfillmentRate = totalOrdersYTD > 0
    ? ((totalFulfilled / totalOrdersYTD) * 100).toFixed(1)
    : '0.0';

  // Calculate percentage changes (placeholder - in real app, compare with previous year/month)
  const ordersChange = 18; // Placeholder
  const revenueChange = 25; // Placeholder
  const avgOrderValueChange = 5; // Placeholder

  // Calculate fulfillment performance
  const onTimeOrders = kpiSummary?.onTimeFulfilled || 0;
  const lateOrders = kpiSummary?.lateFulfilledOrders24h || 0;
  // Get unfulfilled orders - check both mapped value and raw data
  const unfulfilledOrders = kpiSummary?.unfulfilledOrders24h !== undefined 
    ? kpiSummary.unfulfilledOrders24h 
    : (kpiSummary?.raw?.['Unfulfilled orders >24h'] !== undefined 
        ? Number(kpiSummary.raw['Unfulfilled orders >24h']) || 0 
        : 0);
  const totalFulfillmentOrders = onTimeOrders + lateOrders;
  
  console.log('Unfulfilled orders debug:', {
    fromSummary: kpiSummary?.unfulfilledOrders24h,
    fromRaw: kpiSummary?.raw?.['Unfulfilled orders >24h'],
    rawType: typeof kpiSummary?.raw?.['Unfulfilled orders >24h'],
    final: unfulfilledOrders
  });

  const fulfillmentData = [
    { name: 'On Time', value: onTimeOrders, color: '#10b981' },
    { name: 'Late', value: lateOrders, color: '#ef4444' },
  ];

  // Format revenue for display
  const formatRevenue = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return formatCurrency(amount);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading Analytics & KPI's...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
          <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & KPI's</h1>
          <p className="text-gray-600 mt-1">Performance metrics and insights.</p>
          {kpiSummary?.computedAt && (
            <div className="mt-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg inline-block">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Computed At:</span> {kpiSummary.computedAt}
              </p>
          </div>
          )}
        </div>

        {/* KPI Summary Cards from Firestore KPI collection */}
        {kpiSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Today Revenue</h3>
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpiSummary.todayRevenue || 0)}</p>
                  <p className="text-xs text-gray-500 mt-1">Today Total Order: {kpiSummary.todayTotalOrder || 0}</p>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Total Revenue This Year</h3>
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpiSummary.totalRevenueThisYear || 0)}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Orders: {kpiSummary.totalOrderThisYear || 0}</p>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Avg Order Value</h3>
                    <DollarSign className="h-5 w-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpiSummary.avgOrderValue || 0)}</p>
                  <p className="text-xs text-gray-500 mt-1">Avg Fulfillment Time: {kpiSummary.avgFulfillmentTime || 0}h</p>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Pending Orders</h3>
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{kpiSummary.pendingOrders || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Fulfilled: {kpiSummary.fulfilledOrders || 0} | On-time: {kpiSummary.onTimeFulfilled || 0}</p>
                </div>
              </div>
            )}
               {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <MetricCard
                title="Orders Today"
                value={(metrics as any).ordersToday ?? 0}
                icon={Package}
                trend={{ value: trendValue, isPositive: true }}
              />
           
              <MetricCard
                title="Orders This Year"
                value={((metrics as any).ordersThisYear || 0).toLocaleString()}
                icon={Package}
                trend={{ value: trendValue, isPositive: true }}
              />
            
             </div>

             {/* Additional KPI Details */}
            {kpiSummary && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Late Fulfilled (&gt;24h)</p>
                    <p className="text-lg font-semibold text-gray-900">{kpiSummary.lateFulfilledOrders24h || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Unfulfilled (&gt;24h)</p>
                    <p className="text-lg font-semibold text-red-600">{kpiSummary.unfulfilledOrders24h || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Computed At</p>
                    <p className="text-lg font-semibold text-gray-900">{kpiSummary.computedAt || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Metric Name</p>
                    <p className="text-sm font-medium text-gray-700">{kpiSummary.metricName || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

        {/* Middle Row - Revenue Trend Charts */}
        <OrdersChart orders={orders} />

        {/* Bottom Row - Three Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fulfillment Performance */}
          <Card className="bg-white border border-gray-200 shadow-sm h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Fulfillment Performance</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Precision Fulfillment for Peak Performance.</p>
              </div>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'WEEKLY' | 'MONTHLY' | 'YEARLY')}
                className="text-sm border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="WEEKLY">WEEKLY</option>
                <option value="MONTHLY">MONTHLY</option>
                <option value="YEARLY">YEARLY</option>
              </select>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={fulfillmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {fulfillmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="square"
                    formatter={(value, entry: any) => (
                      <span style={{ color: entry.color, marginLeft: '8px' }}>
                        {value}: {entry.payload.value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card className="bg-white border border-gray-200 shadow-sm h-[400px]">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Key Metrics</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Essential insights driving smarter decisions.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 h-[250px] overflow-y-auto">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Fulfillment Time</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {kpiSummary?.avgFulfillmentTime || 0}h
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">On-Time Orders</p>
                  <p className="text-lg font-semibold text-orange-600">{onTimeOrders}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Late Fulfillments</p>
                  <p className="text-lg font-semibold text-red-600">{lateOrders}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Unfulfilled Orders (&gt;24h)</p>
                  <p className="text-lg font-semibold text-red-600">{unfulfilledOrders}</p>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
                  <p className="text-lg font-semibold text-orange-600">{kpiSummary?.pendingOrders || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Fulfilled Orders</p>
                  <p className="text-lg font-semibold text-green-600">{kpiSummary?.fulfilledOrders || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Today Total Order</p>
                  <p className="text-lg font-semibold text-gray-900">{kpiSummary?.todayTotalOrder || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Today Revenue</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(kpiSummary?.todayRevenue || 0)}</p>
                </div>
        </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white border border-gray-200 shadow-sm h-[400px]">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Latest logs and events.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 h-[250px] overflow-y-auto">
                {orders.slice(0, 5).map((order, index) => (
                  <div key={order.id || index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.status === 'pending' || order.status === 'processing' ? 'Order Created' : 'Shipment Updated'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.createdAt instanceof Date
                          ? order.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
                          : new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                      </p>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
