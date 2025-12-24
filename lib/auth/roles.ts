/**
 * Role-based access control utilities
 * 
 * Roles:
 * - coo: Highest level, sees all companies
 * - admin/client: Company owner, buys plan
 * - manager: Under admin/client, can view/edit orders/inventory
 * - worker: Under admin/client, limited view-only access
 */

export type UserRole = 'coo' | 'admin' | 'client' | 'manager' | 'worker';

export interface RolePermissions {
  canViewDashboard: boolean;
  canViewOrders: boolean;
  canEditOrders: boolean;
  canViewInventory: boolean;
  canEditInventory: boolean;
  canViewKPIs: boolean;
  canViewReports: boolean;
  canViewClients: boolean;
  canManageTeam: boolean;
  canViewSettings: boolean;
  canManageBilling: boolean;
  canViewLogs: boolean;
  canViewUsers: boolean;
}

/**
 * Get user's effective role
 * Handles teamRole field for team members
 */
export function getUserRole(userData: any): UserRole {
  if (!userData) return 'client';
  
  // Check if user is a team member with teamRole
  const teamRole = (userData as any)?.teamRole?.toLowerCase();
  if (teamRole) {
    // Map team roles to system roles
    if (teamRole === 'manager') return 'manager';
    if (teamRole === 'operator' || teamRole === 'worker' || teamRole === 'viewer') return 'worker';
  }
  
  // Use main role field
  const role = userData.role?.toLowerCase() || 'client';
  
  // Map client to admin for access control (they're the same)
  if (role === 'client') return 'admin';
  
  return role as UserRole;
}

/**
 * Check if user has a specific role
 */
export function hasRole(userData: any, roles: UserRole[]): boolean {
  const userRole = getUserRole(userData);
  return roles.includes(userRole);
}

/**
 * Check if user is a team member (not the owner)
 */
export function isTeamMember(userData: any): boolean {
  return !!(userData as any)?.isTeamMember || !!(userData as any)?.ownerId;
}

/**
 * Check if user is company owner (admin/client)
 */
export function isCompanyOwner(userData: any): boolean {
  const role = getUserRole(userData);
  return role === 'admin' || role === 'coo';
}

/**
 * Get permissions for a user role
 */
export function getRolePermissions(userData: any): RolePermissions {
  const role = getUserRole(userData);
  const isTeam = isTeamMember(userData);
  
  // COO - Full access to everything
  if (role === 'coo') {
    return {
      canViewDashboard: true,
      canViewOrders: true,
      canEditOrders: true,
      canViewInventory: true,
      canEditInventory: true,
      canViewKPIs: true,
      canViewReports: true,
      canViewClients: true,
      canManageTeam: true,
      canViewSettings: true,
      canManageBilling: true,
      canViewLogs: true,
      canViewUsers: true,
    };
  }
  
  // Admin/Client - Company owner
  if (role === 'admin') {
    return {
      canViewDashboard: true,
      canViewOrders: true,
      canEditOrders: true,
      canViewInventory: true,
      canEditInventory: true,
      canViewKPIs: true,
      canViewReports: true,
      canViewClients: false, // Only COO sees all clients
      canManageTeam: true,
      canViewSettings: true,
      canManageBilling: true,
      canViewLogs: true,
      canViewUsers: true,
    };
  }
  
  // Manager - Can view/edit orders and inventory
  if (role === 'manager') {
    return {
      canViewDashboard: true,
      canViewOrders: true,
      canEditOrders: true,
      canViewInventory: true,
      canEditInventory: true,
      canViewKPIs: true,
      canViewReports: true,
      canViewClients: false,
      canManageTeam: false,
      canViewSettings: false,
      canManageBilling: false,
      canViewLogs: true,
      canViewUsers: false,
    };
  }
  
  // Worker - Limited view-only access
  if (role === 'worker') {
    return {
      canViewDashboard: true,
      canViewOrders: true,
      canEditOrders: false, // View only
      canViewInventory: true,
      canEditInventory: false, // View only
      canViewKPIs: false,
      canViewReports: false, // Or limited reports
      canViewClients: false,
      canManageTeam: false,
      canViewSettings: false,
      canManageBilling: false,
      canViewLogs: true, // Workers can see logs to track orders
      canViewUsers: false,
    };
  }
  
  // Default - no access
  return {
    canViewDashboard: false,
    canViewOrders: false,
    canEditOrders: false,
    canViewInventory: false,
    canEditInventory: false,
    canViewKPIs: false,
    canViewReports: false,
    canViewClients: false,
    canManageTeam: false,
    canViewSettings: false,
    canManageBilling: false,
    canViewLogs: false,
    canViewUsers: false,
  };
}

/**
 * Check if user can access a specific section
 */
export function canAccessSection(userData: any, section: string): boolean {
  const permissions = getRolePermissions(userData);
  
  const sectionMap: Record<string, keyof RolePermissions> = {
    'dashboard': 'canViewDashboard',
    'orders': 'canViewOrders',
    'inventory': 'canViewInventory',
    'kpis': 'canViewKPIs',
    'reports': 'canViewReports',
    'clients': 'canViewClients',
    'users': 'canViewUsers',
    'settings': 'canViewSettings',
    'billing': 'canManageBilling',
    'logs': 'canViewLogs',
  };
  
  const permissionKey = sectionMap[section.toLowerCase()];
  return permissionKey ? permissions[permissionKey] : false;
}

/**
 * Get accessible menu items for sidebar
 */
export function getAccessibleMenuItems(userData: any): string[] {
  const permissions = getRolePermissions(userData);
  const items: string[] = [];
  
  if (permissions.canViewDashboard) items.push('dashboard');
  if (permissions.canViewOrders) items.push('orders');
  if (permissions.canViewClients) items.push('clients');
  if (permissions.canViewKPIs) items.push('kpis');
  if (permissions.canManageTeam) items.push('users');
  if (permissions.canViewLogs) items.push('logs');
  if (permissions.canViewSettings) items.push('settings');
  
  return items;
}

