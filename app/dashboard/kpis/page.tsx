'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { getKPIs } from '@/lib/firebase/kpis';
import { useAuth } from '@/contexts/AuthContext';
import { KPI } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function KPIsPage() {
  const { userData } = useAuth();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function loadKPIs() {
      if (!userData) return;

      try {
        const fetchedKPIs = await getKPIs(userData.clientId, userData.role, days);
        setKpis(fetchedKPIs);
      } catch (error) {
        console.error('Error loading KPIs:', error);
      } finally {
        setLoading(false);
      }
    }

    loadKPIs();
  }, [userData, days]);

  // Calculate aggregate metrics
  const aggregateMetrics = kpis.reduce(
    (acc, kpi) => {
      acc.totalOrders += kpi.totalOrders;
      acc.totalRevenue += kpi.totalRevenue;
      acc.fulfillmentRate += kpi.fulfillmentRate;
      acc.onTimeDeliveryRate += kpi.onTimeDeliveryRate;
      return acc;
    },
    { totalOrders: 0, totalRevenue: 0, fulfillmentRate: 0, onTimeDeliveryRate: 0 }
  );

  const avgFulfillmentRate = kpis.length > 0 ? aggregateMetrics.fulfillmentRate / kpis.length : 0;
  const avgOnTimeDeliveryRate = kpis.length > 0 ? aggregateMetrics.onTimeDeliveryRate / kpis.length : 0;
  const avgOrderValue = aggregateMetrics.totalOrders > 0 ? aggregateMetrics.totalRevenue / aggregateMetrics.totalOrders : 0;

  const chartData = kpis
    .map((kpi) => {
      // Ensure consistent date formatting
      const kpiDate = kpi.date instanceof Date ? kpi.date : new Date(kpi.date);
      return {
        date: formatDate(kpiDate),
        orders: kpi.totalOrders,
        revenue: kpi.totalRevenue,
        fulfillmentRate: kpi.fulfillmentRate,
        onTimeDelivery: kpi.onTimeDeliveryRate,
      };
    })
    .reverse();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading KPIs...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Key Performance Indicators</h1>
            <p className="text-gray-600 mt-1">Track your business metrics</p>
          </div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregateMetrics.totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(aggregateMetrics.totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Fulfillment Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgFulfillmentRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Orders & Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#3b82f6" name="Orders" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue ($)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="fulfillmentRate" fill="#3b82f6" name="Fulfillment Rate (%)" />
                  <Bar dataKey="onTimeDelivery" fill="#10b981" name="On-Time Delivery (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detailed KPI Data</CardTitle>
          </CardHeader>
          <CardContent>
            {kpis.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No KPI data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Orders</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Revenue</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Order Value</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Fulfillment Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">On-Time Delivery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.map((kpi) => (
                      <tr key={kpi.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDate(kpi.date)}</td>
                        <td className="py-3 px-4">{kpi.totalOrders}</td>
                        <td className="py-3 px-4">{formatCurrency(kpi.totalRevenue)}</td>
                        <td className="py-3 px-4">{formatCurrency(kpi.averageOrderValue)}</td>
                        <td className="py-3 px-4">{kpi.fulfillmentRate.toFixed(1)}%</td>
                        <td className="py-3 px-4">{kpi.onTimeDeliveryRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

