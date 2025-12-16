'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getClients } from '@/lib/firebase/clients';
import { getOrders } from '@/lib/firebase/orders';
import { useAuth } from '@/contexts/AuthContext';
import { Client, Order } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Search, Plus, Mail, Phone, MapPin, Edit, Trash2 } from 'lucide-react';

interface ClientWithStats extends Client {
  totalOrders: number;
  totalSpent: number;
  contactPerson?: string;
}

export default function ClientsPage() {
  const { userData } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    async function loadClients() {
      if (!userData || (userData.role !== 'coo' && userData.role !== 'admin')) {
        return;
      }

      try {
        const [fetchedClients, fetchedOrders] = await Promise.all([
          getClients(),
          getOrders(undefined, userData.role, 1000),
        ]);
        setClients(fetchedClients);
        setAllOrders(fetchedOrders);
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setLoading(false);
      }
    }

    loadClients();
  }, [userData]);

  // Calculate stats for each client
  const clientsWithStats = useMemo(() => {
    return clients.map((client) => {
      const clientOrders = allOrders.filter(
        (order) => order.clientId === client.id
      );
      const totalOrders = clientOrders.length;
      const totalSpent = clientOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      );

      // Extract contact person from email or use name
      const contactPerson = client.email
        ? client.email.split('@')[0].replace(/[._]/g, ' ')
        : client.name;

      return {
        ...client,
        totalOrders,
        totalSpent,
        contactPerson:
          contactPerson.charAt(0).toUpperCase() + contactPerson.slice(1),
      } as ClientWithStats;
    });
  }, [clients, allOrders]);

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clientsWithStats;

    const query = searchQuery.toLowerCase();
    return clientsWithStats.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.contactPerson?.toLowerCase().includes(query)
    );
  }, [clientsWithStats, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, currentPage]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading clients...</p>
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
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-600 mt-1">
              Manage your client accounts and relationships
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
            <Plus className="h-5 w-5" />
            ADD CLIENT
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search here..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Client Cards Grid */}
        {paginatedClients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No clients found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedClients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
              >
                {/* Header with Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {client.name}
                    </h3>
                    <p className="text-sm text-gray-600">{client.contactPerson}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      client.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {client.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Contact Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-4"></div>

                {/* Order Summary */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Orders</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {client.totalOrders}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Spent</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(client.totalSpent)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => {
                  if (typeof page === 'number') {
                    setCurrentPage(page);
                  }
                }}
                disabled={typeof page !== 'number'}
                className={`px-3 py-1 rounded ${
                  typeof page === 'number'
                    ? currentPage === page
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    : 'text-gray-400 cursor-default'
                } transition-colors`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

