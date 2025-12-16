'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getOrderById } from '@/lib/firebase/orders';
import { Order } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [rawOrderData, setRawOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const orderId = params.id as string;
        
        // Fetch the raw document from Firestore to get all fields
        const orderDoc = await getDoc(doc(db, 'testing', orderId));
        
        if (orderDoc.exists()) {
          const data = orderDoc.data();
          setRawOrderData(data);
          
          // Also get the mapped order for compatibility
          const fetchedOrder = await getOrderById(orderId);
          setOrder(fetchedOrder);
        } else {
          console.error('Order not found:', orderId);
        }
      } catch (error) {
        console.error('Error loading order:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadOrder();
    }
  }, [params.id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading order...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order && !rawOrderData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Order not found</p>
          <button
            onClick={() => router.push('/dashboard/orders')}
            className="mt-4 px-4 py-2 bg-[#E79138] text-white rounded-lg hover:bg-orange-600"
          >
            Back to Orders
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'pending') {
      return 'bg-orange-100 text-orange-800';
    } else if (statusLower === 'delivered' || statusLower === 'fulfilled') {
      return 'bg-green-100 text-green-800';
    } else if (statusLower === 'cancelled') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  // Parse order date
  const parseDate = (dateValue: any): string => {
    if (!dateValue) return 'N/A';
    if (typeof dateValue === 'string') {
      return new Date(dateValue).toLocaleString();
    }
    if (dateValue.toDate) {
      return dateValue.toDate().toLocaleString();
    }
    return dateValue.toString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/orders')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Order {rawOrderData?.['Shopify Order Number'] || rawOrderData?.['Order ID'] || params.id}
            </h1>
            <p className="text-gray-600 mt-1">Order details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Order Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Document ID</p>
                    <p className="text-base text-gray-900 font-mono">{params.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Shopify Order Number</p>
                    <p className="text-base text-gray-900">{rawOrderData?.['Shopify Order Number'] || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Order ID</p>
                    <p className="text-base text-gray-900">{rawOrderData?.['Order ID'] || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Order Date</p>
                    <p className="text-base text-gray-900">{parseDate(rawOrderData?.['Order Date'])}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Client ID</p>
                    <p className="text-base text-gray-900 font-mono">{rawOrderData?.['client_id'] || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(rawOrderData?.['Status'] || order?.status)}`}>
                      {rawOrderData?.['Status'] || order?.status || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Clients Name</p>
                    <p className="text-base text-gray-900">{rawOrderData?.['Clients name'] || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Customer Name</p>
                    <p className="text-base text-gray-900">{rawOrderData?.['Customer Name'] || order?.customerName || 'N/A'}</p>
                  </div>
                  {rawOrderData?.['Customer Email'] && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Customer Email</p>
                      <p className="text-base text-gray-900">{rawOrderData['Customer Email']}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Card */}
            {rawOrderData?.['Line Items'] && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Product Name</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-700">Quantity</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Price</th>

                        </tr>
                      </thead>
                      <tbody>
                        {rawOrderData['Line Items'].split(';').map((item: string, index: number) => {
                          // Parse "Product Name x Quantity x Price" format
                          const trimmedItem = item.trim();
                          if (!trimmedItem) return null;
                          
                          // Try to match "Product Name x Quantity x Price" pattern
                          // Example: "Automation Maintenance Plan x 1 x 499.00"
                          const match = trimmedItem.match(/^(.+?)\s+x\s+(\d+)\s+x\s+([\d.]+)$/);
                          if (match) {
                            const [, productName, quantity, price] = match;
                            const quantityNum = parseInt(quantity, 10);
                            const priceNum = parseFloat(price);
                            const total = quantityNum * priceNum;
                            
                            return (
                              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 text-gray-900">{productName.trim()}</td>
                                <td className="py-3 px-4 text-center text-gray-900">{quantity}</td>
                                <td className="py-3 px-4 text-right text-gray-900">
                                  {formatCurrency(priceNum, 'USD')}
                                </td>
                                
                              </tr>
                            );
                          } else {
                            // Try to match "Product Name x Quantity" pattern (without price)
                            const matchWithoutPrice = trimmedItem.match(/^(.+?)\s+x\s+(\d+)$/);
                            if (matchWithoutPrice) {
                              const [, productName, quantity] = matchWithoutPrice;
                              return (
                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="py-3 px-4 text-gray-900">{productName.trim()}</td>
                                  <td className="py-3 px-4 text-center text-gray-900">{quantity}</td>
                                  <td className="py-3 px-4 text-right text-gray-500">-</td>
                                  <td className="py-3 px-4 text-right text-gray-500">-</td>
                                </tr>
                              );
                            } else {
                              // If pattern doesn't match, show the whole item
                              return (
                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="py-3 px-4 text-gray-900" colSpan={4}>{trimmedItem}</td>
                                </tr>
                              );
                            }
                          }
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(rawOrderData?.['Subtotal'] || 0, 'USD')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(rawOrderData?.['Shipping'] || 0, 'USD')}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(rawOrderData?.['Total'] || order?.totalAmount || 0, 'USD')}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Status Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(rawOrderData?.['Status'] || order?.status)}`}>
                    {rawOrderData?.['Status'] || order?.status || 'N/A'}
                  </span>
                </div>
                {order?.createdAt && (
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="text-sm text-gray-900">{formatDateTime(order.createdAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
