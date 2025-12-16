'use client';

import { memo, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Order } from '@/types';

interface OrdersChartProps {
  orders: Order[];
}

export const OrdersChart = memo(function OrdersChart({ orders }: OrdersChartProps) {
  const [period, setPeriod] = useState<'WEEKLY' | 'MONTHLY' | 'YEARLY'>('WEEKLY');

  // Memoize chart data calculation to prevent recalculation on every render
  const chartData = useMemo(() => {
    const now = new Date();
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Get last 7 days for weekly view
    const weeklyData = daysOfWeek.map((day, index) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - index));
      
      const dayOrders = orders.filter(order => {
        const orderDate = order.createdAt instanceof Date 
          ? order.createdAt 
          : new Date(order.createdAt);
        return orderDate.toDateString() === date.toDateString();
      });
      
      const revenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const orderCount = dayOrders.length;
      
      return {
        day: day,
        revenue: revenue,
        orders: orderCount
      };
    });

    return weeklyData;
  }, [orders]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-medium text-gray-900">{payload[0].payload.day}</p>
          {payload[0].payload.orders !== undefined && (
            <p className="text-sm text-gray-600">Order's: {payload[0].payload.orders}</p>
          )}
          {payload[0].payload.revenue !== undefined && (
            <p className="text-sm text-gray-600">Revenue "$": {payload[0].payload.revenue.toLocaleString()}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Revenue Trend</CardTitle>
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
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenueArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorRevenueArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Revenue Trend</CardTitle>
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" fill="#1e40af" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
});
