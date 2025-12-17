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
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    if (period === 'WEEKLY') {
      // Get last 7 days (including today)
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dayOfWeek = daysOfWeek[date.getDay()];
        
        const dayOrders = orders.filter(order => {
          const orderDate = order.createdAt instanceof Date 
            ? order.createdAt 
            : new Date(order.createdAt);
          const orderDateOnly = new Date(orderDate);
          orderDateOnly.setHours(0, 0, 0, 0);
          return orderDateOnly.getTime() === date.getTime();
        });
        
        const revenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const orderCount = dayOrders.length;
        
        weeklyData.push({
          day: dayOfWeek,
          date: date.toISOString().split('T')[0],
          revenue: revenue,
          orders: orderCount
        });
      }
      return weeklyData;
    } else if (period === 'MONTHLY') {
      // Get last 30 days, grouped by week
      const monthlyData = [];
      const weeks = [];
      
      // Create 4-5 weeks of data
      for (let weekIndex = 4; weekIndex >= 0; weekIndex--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (weekIndex * 7) - 6);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const weekOrders = orders.filter(order => {
          const orderDate = order.createdAt instanceof Date 
            ? order.createdAt 
            : new Date(order.createdAt);
          return orderDate >= weekStart && orderDate <= weekEnd;
        });
        
        const revenue = weekOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const orderCount = weekOrders.length;
        
        const weekLabel = `Week ${5 - weekIndex}`;
        monthlyData.push({
          day: weekLabel,
          date: `${weekStart.toISOString().split('T')[0]} - ${weekEnd.toISOString().split('T')[0]}`,
          revenue: revenue,
          orders: orderCount
        });
      }
      return monthlyData;
    } else if (period === 'YEARLY') {
      // Get last 12 months
      const yearlyData = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let monthIndex = 11; monthIndex >= 0; monthIndex--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - monthIndex, 1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthIndex + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        const monthOrders = orders.filter(order => {
          const orderDate = order.createdAt instanceof Date 
            ? order.createdAt 
            : new Date(order.createdAt);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });
        
        const revenue = monthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const orderCount = monthOrders.length;
        
        const monthLabel = `${monthNames[monthStart.getMonth()]} ${monthStart.getFullYear()}`;
        yearlyData.push({
          day: monthLabel,
          date: `${monthStart.toISOString().split('T')[0]} - ${monthEnd.toISOString().split('T')[0]}`,
          revenue: revenue,
          orders: orderCount
        });
      }
      return yearlyData;
    }
    
    return [];
  }, [orders, period]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-medium text-gray-900">{data.day}</p>
          {data.date && period !== 'WEEKLY' && (
            <p className="text-xs text-gray-500 mb-1">{data.date}</p>
          )}
          {data.orders !== undefined && (
            <p className="text-sm text-gray-600">Orders: {data.orders}</p>
          )}
          {data.revenue !== undefined && (
            <p className="text-sm text-gray-600">Revenue: ${data.revenue.toLocaleString()}</p>
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
