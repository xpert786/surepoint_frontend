'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Order } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface RecentOrdersProps {
  orders: Order[];
}

export const RecentOrders = memo(function RecentOrders({ orders }: RecentOrdersProps) {
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link
            href="/dashboard/orders"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No orders yet</p>
          ) : (
            recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {order.orderNumber}
                    </Link>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {order.customerName} • {formatDateTime(order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(order.totalAmount, order.currency)}
                  </p>
                  {order.trackingNumber && (
                    <p className="text-xs text-gray-500 mt-1">
                      {order.trackingNumber}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
});

