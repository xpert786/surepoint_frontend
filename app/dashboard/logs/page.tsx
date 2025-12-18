'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Upload, ChevronDown } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Format date as "12/12/2025, 10:56:07 AM"
const formatDateTime = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const hoursStr = hours.toString();
  
  return `${month}/${day}/${year}, ${hoursStr}:${minutes}:${seconds} ${ampm}`;
};

interface ActivityLog {
  id: string;
  timestamp: Date;
  eventType: 'Order Created' | 'Shipment Updated' | 'User Action';
  details: string;
}

export default function LogsPage() {
  const { userData, user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All Orders');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadLogs() {
      if (!userData) return;

      try {
        // Get clientId
        let clientId = user?.uid || userData.clientId;

        if (!clientId) {
          console.log('No clientId available');
          setLoading(false);
          return;
        }

        // Query logs collection filtered by client_id, ordered by date (latest first)
        const logsRef = collection(db, 'logs');
        const activityLogs: ActivityLog[] = [];
        let q;
        
        try {
          if (userData.role === 'coo' || userData.role === 'admin') {
            // COO/Admin can see all logs
            q = query(logsRef, orderBy('date', 'desc'), limit(1000));
          } else {
            // Regular users see only their logs
            q = query(
              logsRef,
              where('client_id', '==', clientId),
              orderBy('date', 'desc'),
              limit(1000)
            );
          }

          const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Parse date field
          let logDate: Date;
          if (data.date) {
            if (typeof data.date === 'string') {
              logDate = new Date(data.date);
            } else if (data.date.toDate) {
              logDate = data.date.toDate();
            } else {
              logDate = new Date();
            }
          } else {
            logDate = new Date();
          }

          // Determine event type from status
          let eventType: 'Order Created' | 'Shipment Updated' | 'User Action' = 'User Action';
          const status = (data.status || '').toLowerCase();
          
          if (status.includes('order') || status.includes('scyned') || status.includes('created')) {
            eventType = 'Order Created';
          } else if (status.includes('shipment') || status.includes('shipped') || status.includes('delivered')) {
            eventType = 'Shipment Updated';
          }

          // Format details from Matric field or create JSON
          let details = '';
          if (data.Matric) {
            // Use Matric field as details
            details = data.Matric;
          } else {
            // Create JSON from available fields
            const detailObj: any = {};
            if (data.order_id) detailObj.order_id = data.order_id;
            if (data.shopify_order_id) detailObj.shopify_order_id = data.shopify_order_id;
            if (data.customer_name) detailObj.customer = data.customer_name;
            if (data.tracking_id) detailObj.tracking_id = data.tracking_id;
            if (data.status) detailObj.status = data.status;
            details = JSON.stringify(detailObj);
          }

          // Truncate details if too long
          if (details.length > 80) {
            details = details.substring(0, 80) + '...';
          }

          activityLogs.push({
            id: doc.id,
            timestamp: logDate,
            eventType,
            details,
          });
        });

          // Additional sort by timestamp (newest first) as backup
          activityLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

          setLogs(activityLogs);
        } catch (queryError: any) {
          // If query fails due to missing index, try without orderBy
          if (queryError?.code === 'failed-precondition' || queryError?.message?.includes('index')) {
            console.log('Index required, trying query without orderBy...');
            try {
              let q2;
              if (userData.role === 'coo' || userData.role === 'admin') {
                q2 = query(logsRef, limit(1000));
              } else {
                q2 = query(
                  logsRef,
                  where('client_id', '==', clientId),
                  limit(1000)
                );
              }
              const querySnapshot2 = await getDocs(q2);
              
              querySnapshot2.forEach((doc) => {
                const data = doc.data();
                
                let logDate: Date;
                if (data.date) {
                  if (typeof data.date === 'string') {
                    logDate = new Date(data.date);
                  } else if (data.date.toDate) {
                    logDate = data.date.toDate();
                  } else {
                    logDate = new Date();
                  }
                } else {
                  logDate = new Date();
                }

                let eventType: 'Order Created' | 'Shipment Updated' | 'User Action' = 'User Action';
                const status = (data.status || '').toLowerCase();
                
                if (status.includes('order') || status.includes('scyned') || status.includes('created')) {
                  eventType = 'Order Created';
                } else if (status.includes('shipment') || status.includes('shipped') || status.includes('delivered')) {
                  eventType = 'Shipment Updated';
                }

                let details = '';
                if (data.Matric) {
                  details = data.Matric;
                } else {
                  const detailObj: any = {};
                  if (data.order_id) detailObj.order_id = data.order_id;
                  if (data.shopify_order_id) detailObj.shopify_order_id = data.shopify_order_id;
                  if (data.customer_name) detailObj.customer = data.customer_name;
                  if (data.tracking_id) detailObj.tracking_id = data.tracking_id;
                  if (data.status) detailObj.status = data.status;
                  details = JSON.stringify(detailObj);
                }

                if (details.length > 80) {
                  details = details.substring(0, 80) + '...';
                }

                activityLogs.push({
                  id: doc.id,
                  timestamp: logDate,
                  eventType,
                  details,
                });
              });

              // Sort by timestamp (newest first) client-side
              activityLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
              setLogs(activityLogs);
            } catch (fallbackError) {
              console.error('Error loading logs (fallback):', fallbackError);
            }
          } else {
            throw queryError;
          }
        }
      } catch (error) {
        console.error('Error loading logs:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, [userData, user]);

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'Order Created':
        return 'bg-blue-100 text-blue-800';
      case 'Shipment Updated':
        return 'bg-orange-100 text-orange-800';
      case 'User Action':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.eventType.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query) ||
        formatDateTime(log.timestamp).toLowerCase().includes(query)
      );
    }
    if (filterType !== 'All Orders') {
      return log.eventType === filterType;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading logs...</p>
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Logs & Activity</h1>
            <p className="text-gray-600 mt-1">System events and audit trail.</p>
          </div>
        
        </div>

        {/* Search and Filter */}
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
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none bg-white border border-[#BFC1C3] rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
            >
              <option>All Orders</option>
              <option>Order Created</option>
              <option>Shipment Updated</option>
              <option>User Action</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Activity Log Table */}
        <div className="bg-white rounded-lg border border-[#BFC1C3]">
          <div className="px-6 py-4 border-b border-[#BFC1C3]">
            <h2 className="text-lg font-semibold text-gray-700">Activity Log ({filteredLogs.length})</h2>
          </div>
          <div className="overflow-x-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No activity logs found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#BFC1C3] bg-gray-50">
                    <th className="text-left py-3 px-6 font-medium text-gray-700 w-48">Timestamp</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700 w-40">Event Type</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 text-sm text-gray-600 whitespace-nowrap">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getEventTypeColor(log.eventType)}`}>
                          {log.eventType}
                        </span>
                      </td>
                      <td className="py-4 px-6 max-w-md">
                        <code className="text-xs text-gray-700 bg-gray-50 px-3 py-2 rounded font-mono break-words whitespace-normal block">
                          {log.details}
                        </code>
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
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                let pageNum;
                if (totalPages <= 3) {
                  pageNum = i + 1;
                } else if (currentPage <= 2) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 1) {
                  pageNum = totalPages - 2 + i;
                } else {
                  pageNum = currentPage - 1 + i;
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
              {totalPages > 3 && currentPage < totalPages - 1 && (
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
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

