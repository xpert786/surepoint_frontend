'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AlertCircle, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getRolePermissions } from '@/lib/auth/roles';

export default function InventoryPage() {
  const { userData } = useAuth();
  const permissions = getRolePermissions(userData);
  
  // TODO: Implement inventory fetching from Firebase
  // Note: Workers can view but not edit inventory (permissions.canEditInventory)
  const lowStockItems = 0;
  const totalItems = 0;
  const totalValue = 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">Track and manage your inventory</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Items"
            value={totalItems}
            description="All inventory items"
            icon={Package}
          />
          <MetricCard
            title="Total Value"
            value={`$${totalValue.toLocaleString()}`}
            description="Inventory value"
            icon={Package}
          />
          <MetricCard
            title="Low Stock Items"
            value={lowStockItems}
            description="Needs restocking"
            icon={AlertCircle}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-500">Inventory tracking coming soon</p>
              <p className="text-sm text-gray-400 mt-2">
                This feature will integrate with your inventory management system
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

