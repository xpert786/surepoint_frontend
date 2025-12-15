'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Order } from '@/types';
import { formatDate } from '@/lib/utils';

interface OrdersChartProps {
  orders: Order[];
}

export const OrdersChart = memo(function OrdersChart({ orders }: OrdersChartProps) {
  // Memoize chart data calculation to prevent recalculation on every render
  const chartData = useMemo(() => {
    const ordersByDate = orders.reduce((acc, order) => {
      const orderDate = order.createdAt instanceof Date 
        ? order.createdAt 
        : new Date(order.createdAt);
      
      const dateKey = orderDate.toISOString().split('T')[0];
      const dateLabel = formatDate(orderDate);
      
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateLabel, orders: 0, revenue: 0 };
      }
      acc[dateKey].orders += 1;
      acc[dateKey].revenue += order.totalAmount;
      return acc;
    }, {} as Record<string, { date: string; orders: number; revenue: number }>);

    return Object.values(ordersByDate).slice(-30).sort((a, b) => {
      return a.date.localeCompare(b.date);
    });
  }, [orders]);

  return (
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
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="orders"
              stroke="#3b82f6"
              name="Orders"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              name="Revenue ($)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
