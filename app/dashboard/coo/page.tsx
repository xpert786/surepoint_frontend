'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { getClients } from '@/lib/firebase/clients';
import { getOrders } from '@/lib/firebase/orders';
import { useAuth } from '@/contexts/AuthContext';
import { Client, Order } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Users, Package, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function COOInsightsPage() {
  const { userData } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!userData || (userData.role !== 'coo' && userData.role !== 'admin')) {
        return;
      }

      try {
        const [fetchedClients, fetchedOrders] = await Promise.all([
          getClients(),
          getOrders(undefined, 'coo'),
        ]);
        setClients(fetchedClients);
        setAllOrders(fetchedOrders);
      } catch (error) {
        console.error('Error loading COO data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userData]);

  // Calculate aggregate metrics
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'active').length;
  const totalOrders = allOrders.length;
  const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading insights...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (userData?.role !== 'coo' && userData?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Access denied. COO role required.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">COO Insights Portal</h1>
          <p className="text-gray-600 mt-1">Executive overview of all operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Clients"
            value={totalClients}
            description={`${activeClients} active`}
            icon={Users}
          />
          <MetricCard
            title="Total Orders"
            value={totalOrders}
            description="Across all clients"
            icon={Package}
          />
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            description="All time"
            icon={DollarSign}
          />
          <MetricCard
            title="Avg Order Value"
            value={formatCurrency(avgOrderValue)}
            description="Platform average"
            icon={TrendingUp}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No clients found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Client Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Subscription</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => {
                      const clientOrders = allOrders.filter((o) => o.clientId === client.id);
                      const clientRevenue = clientOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                      
                      return (
                        <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{client.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{client.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                client.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : client.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {client.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {client.subscriptionTier || 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1 text-sm">
                              <span className="text-gray-600">{clientOrders.length} orders</span>
                              <span className="text-gray-600">{formatCurrency(clientRevenue)}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

