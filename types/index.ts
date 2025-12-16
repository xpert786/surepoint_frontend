export type UserRole = 'client' | 'coo' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clientId?: string; // For client users, link to their client record
  isOnboarding?: boolean;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'cancelled'; // Legacy field
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionTier?: 'basic' | 'pro' | 'enterprise'; // Legacy field
  paymentDate?: Date; // Legacy field
  billing?: {
    status: 'inactive' | 'active' | 'cancelled' | 'failed';
    plan?: 'basic' | 'pro' | 'enterprise' | null;
    paymentDate?: Date | null;
    stripeCustomerId?: string;
    stripeSessionId?: string;
  };
  onboardingInfo?: {
    companyInfo?: {
      businessName: string;
      businessType: string;
      registeredAddress: string;
      warehouseAddress: string;
      timezone: string;
      supportEmail: string;
      supportPhone: string;
    };
    teamInfo?: {
      members: Array<{
        name: string;
        email: string;
        role: string;
      }>;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending';
  subscriptionTier?: 'basic' | 'pro' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled';

export interface Order {
  id: string;
  clientId: string;
  orderNumber: string;
  shopifyOrderId?: string;
  shipstationOrderId?: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  shippingAddress: Address;
  trackingNumber?: string;
  trackingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface OrderItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface InventoryItem {
  id: string;
  clientId: string;
  sku: string;
  productName: string;
  quantity: number;
  lowStockThreshold: number;
  cost: number;
  lastUpdated: Date;
}

export interface KPI {
  id: string;
  clientId: string;
  date: Date;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  fulfillmentRate: number;
  onTimeDeliveryRate: number;
  inventoryTurnover: number;
  lowStockItems: number;
}

export interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  shippedOrders: number;
  fulfillmentRate: number;
  lowStockItems: number;
  recentOrders: Order[];
}

export interface WebhookPayload {
  type: 'shopify_order' | 'shipstation_update' | 'inventory_change';
  data: any;
  timestamp: Date;
}

