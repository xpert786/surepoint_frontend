'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getOrders } from '@/lib/firebase/orders';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { Search, Filter, Upload, Eye, Edit, Trash2, ChevronDown } from 'lucide-react';
import { getRolePermissions, isTeamMember } from '@/lib/auth/roles';

export default function OrdersPage() {
  const { userData, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Get role permissions
  const permissions = getRolePermissions(userData);

  useEffect(() => {
    async function loadOrders() {
      if (!userData) {
        console.log('No userData available yet');
        return;
      }

      try {
        // Get clientId from userData - this is the logged-in user's client ID
        // Note: In Firestore, orders use 'client_id' field which might be the user's UID
        let clientId = userData.clientId;
        const userRole = userData.role;
        const userUid = user?.uid;
        
        // If no clientId in userData, try using the user's UID as fallback
        // (since orders might have client_id set to the user's UID)
        if (!clientId && userUid) {
          console.log('No clientId in userData, using user UID as fallback:', userUid);
          clientId = userUid;
        }
        
        console.log('Loading orders for:', { 
          clientId, 
          userRole, 
          userUid,
          userId: userData.id || userData.email,
          hasClientIdInUserData: !!userData.clientId,
          fullUserData: userData 
        });
        
        // Check if user is a team member (manager/worker)
        const userIsTeamMember = isTeamMember(userData);
        
        // Fetch orders filtered by clientId (if client or team member) or all orders (if COO/Admin)
        const fetchedOrders = await getOrders(clientId, userRole, 50, userIsTeamMember);
        
        console.log(`Found ${fetchedOrders.length} orders for clientId: ${clientId}`);
        console.log('Orders data:', fetchedOrders);
        
        // If no orders found and we have a clientId, try fetching all orders to debug
        if (fetchedOrders.length === 0 && clientId && userRole !== 'coo' && userRole !== 'admin') {
          console.log('No orders found with clientId filter, trying to fetch all orders for debugging...');
          const allOrders = await getOrders(undefined, 'coo'); // Temporarily use COO role to see all
          console.log(`Total orders in database: ${allOrders.length}`);
          console.log('All orders client_id values:', allOrders.map(o => ({ id: o.id, clientId: o.clientId, orderNumber: o.orderNumber })));
        }
        
        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [userData]);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') {
      return 'bg-orange-100 text-orange-800';
    } else if (statusLower === 'delivered' || statusLower === 'fulfilled') {
      return 'bg-green-100 text-green-800';
    } else if (statusLower === 'cancelled') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'delivered') return 'Fullfilled';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(query) ||
      order.customerName?.toLowerCase().includes(query) ||
      order.customerEmail?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-1 text-sm">Manage and track all orders</p>
          </div>
    
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <select className="appearance-none bg-white border border-[#BFC1C3] rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer">
              <option>All Orders</option>
              <option>Pending</option>
              <option>Fulfilled</option>
              <option>Cancelled</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <button className="flex items-center gap-2 border border-[#BFC1C3] rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" />
            Filter's
          </button>
      
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg border border-[#BFC1C3] ">
          <div className="px-6 py-4 border-b border-[#BFC1C3]">
            <h2 className="text-lg font-semibold text-gray-700">Order List</h2>
          </div>
          <div className="overflow-x-auto">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No orders found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#BFC1C3] bg-gray-50">
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Order ID</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Customer</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Total</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="text-[#535B69] font-medium hover:text-[#E79138]"
                        >
                          {order.orderNumber || order.id?.slice(-6)}
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-[#535B69]">{order.customerName || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-6 text-sm text-[#535B69]">
                        {order.createdAt ? formatDateTime(order.createdAt).split(',')[0] : 'N/A'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {formatStatus(order.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-[#535B69]">
                        {formatCurrency(order.totalAmount || 0, order.currency || 'USD')}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="text-[#535B69] hover:text-[#E79138] transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {permissions.canEditOrders && (
                            <>
                              <button
                                className="text-[#535B69] hover:text-[#E79138] transition-colors"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                className="text-gray-600 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded ${
                      currentPage === pageNum
                        ? 'bg-[#E79138] text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-2">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
