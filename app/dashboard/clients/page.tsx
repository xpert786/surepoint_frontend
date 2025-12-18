'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getClients } from '@/lib/firebase/clients';
import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@/types';
import { Search, Plus, Mail, Phone, MapPin, Edit, Trash2 } from 'lucide-react';

interface ClientWithStats extends Client {
  contactPerson?: string;
  companyName?: string;
  businessType?: string;
  registeredAddress?: string;
  warehouseAddress?: string;
}

export default function ClientsPage() {
  const { userData, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    async function loadClients() {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // If no userData or user doesn't have required role, stop loading
      if (!userData) {
        setLoading(false);
        return;
      }
      
      const userRole = userData.role?.toLowerCase();
      if (userRole !== 'coo' && userRole !== 'admin') {
        setLoading(false);
        return;
      }

      try {
        console.log('🔄 Loading clients...');
        console.log('👤 User role:', userRole);
        console.log('👤 User ID:', userData.id);
        console.log('🔐 User authenticated:', !!userData);
        
        const fetchedClients = await getClients();
        console.log(`📊 Loaded ${fetchedClients.length} clients`);
        console.log('📋 Clients array:', fetchedClients);
        setClients(fetchedClients);
      } catch (error: any) {
        console.error('❌ Error loading clients:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          stack: error.stack,
        });
      } finally {
        setLoading(false);
      }
    }

    loadClients();
  }, [userData, authLoading]);

  // Add company info to each client
  const clientsWithStats = useMemo(() => {
    return clients.map((client) => {
      // Extract contact person from email or use name
      const contactPerson = client.email
        ? client.email.split('@')[0].replace(/[._]/g, ' ')
        : client.name;

      return {
        ...client,
        contactPerson:
          contactPerson.charAt(0).toUpperCase() + contactPerson.slice(1),
      } as ClientWithStats;
    });
  }, [clients]);

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

  if (authLoading || loading) {
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

  const userRole = userData?.role?.toLowerCase();
  if (userRole !== 'coo' && userRole !== 'admin') {
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-600 mt-1">
              Manage your client accounts and relationships
            </p>
          </div>
      
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E79138] focus:border-transparent"
          />
        </div>

        

        {/* Client Cards Grid */}
        {paginatedClients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No clients found</p>
            {clients.length > 0 && (
              <p className="text-sm text-gray-400 mt-2">
                (Found {clients.length} clients but they may be filtered out)
              </p>
            )}
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
                  {client.subscriptionTier && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Plan:</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {client.subscriptionTier}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
             
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">
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
                      ? 'bg-[#E79138] text-white'
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

