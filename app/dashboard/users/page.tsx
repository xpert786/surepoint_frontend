'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Eye, Edit, Trash2, Plus, X, ChevronDown } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User } from '@/types';
import { getApiUrl } from '@/lib/utils';
import { canAccessSection } from '@/lib/auth/roles';
import { useRouter } from 'next/navigation';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  lastActive: Date | null;
}

export default function UsersPage() {
  const { userData, user, refreshUserData } = useAuth();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Check if user can access Users page
  useEffect(() => {
    if (userData && !canAccessSection(userData, 'users')) {
      router.push('/dashboard');
    }
  }, [userData, router]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    sendEmail: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      if (!user || !userData) {
        setLoading(false);
        return;
      }
  
      try {
        const teamInfo = (userData as any)?.onboardingInfo?.teamInfo;
  
        if (teamInfo?.members && Array.isArray(teamInfo.members)) {
          const members: TeamMember[] = teamInfo.members.map(
            (member: any, index: number) => ({
              id: `${user.uid}-${index}`,
              name: member.name || 'N/A',
              email: member.email || 'N/A',
              role: member.role || 'Admin',
              department: getDepartmentFromRole(member.role || 'operator'),
              status: 'active',
              lastActive:
                (userData as any)?.updatedAt?.toDate?.() || null,
            })
          );
  
          setTeamMembers(members); // ✅ set ONCE
        } else {
          setTeamMembers([]);
        }
      } catch (error) {
        console.error('Error loading team members:', error);
      } finally {
        setLoading(false);
      }
    }
  
    loadUsers();
  }, [user, userData]);

  const getDepartmentFromRole = (role: string): string => {
    const roleMap: Record<string, string> = {
      'coo': 'Management',
      'admin': 'Management',
      'client': 'Operations',
      'manager': 'Management',
      'operator': 'Operations',
    };
    return roleMap[role] || 'Operations';
  };

  const getRoleDisplay = (role: string): string => {
    // Map client role to Admin for display
    if (!role) return 'Admin';
    if (role.toLowerCase() === 'client') return 'Admin';
    return role.charAt(0).toUpperCase() + role.slice(1).toUpperCase();
  };

  const getRoleColor = (role: string): string => {
    const roleLower = (role || '').toLowerCase();
    // Admin, COO, CEO, Manager roles get blue badge
    if (roleLower === 'admin' || roleLower === 'coo' || roleLower === 'ceo' || roleLower === 'manager') {
      return 'bg-blue-100 text-blue-800';
    }
    // Operator, Client roles get orange badge
    return 'bg-orange-100 text-orange-800';
  };

  const getStatusColor = (status: string): string => {
    if (status === 'active') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-red-100 text-red-800';
  };

  const formatLastActive = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };
  console.log('teamMembers', teamMembers);
  const filteredMembers = teamMembers.filter((member) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    console.log('query', query);
    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query) ||
      member.department.toLowerCase().includes(query)
    );
  });

  console.log('filteredMembers', filteredMembers);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-semibold ">Users & Roles</h1>
          <p className="text-[#535B69] text-sm mt-1">Manage team members and permissions.</p>
        </div>

        {/* Search and Add User */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Q Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#E79138] hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            ADD USER
          </button>
        </div>

        {/* Team Members Table */}
        <div className="bg-white rounded-lg border border-gray-200 ">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          </div>
          <div className="overflow-x-auto">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No team members found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Name</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Role</th>

                    <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Last Active</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMembers.map((member) => (
                    <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{member.name}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-900">{member.email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                          {getRoleDisplay(member.role)}
                        </span>
                      </td>
                      
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600">{formatLastActive(member.lastActive)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <button
                            className="text-gray-600 hover:text-[#E79138] transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-[#E79138] transition-colors"
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
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
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

      {/* Add Team Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#00000099] flex items-center justify-center h-screen z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[70vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">Add Team Member</h2>
              <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      firstName: '',
                      lastName: '',
                      email: '',
                      password: '',
                      role: '',
                      sendEmail: false,
                    });
                    setShowPassword(false);
                  }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!user || !userData) return;

                // Validate password
                if (!formData.password || formData.password.length < 6) {
                  alert('Password must be at least 6 characters long');
                  return;
                }

                setSaving(true);
                try {
                  // Call API to create team member with password
                  const response = await fetch(getApiUrl('/api/team/create-member'), {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      email: formData.email.trim().toLowerCase(),
                      password: formData.password,
                      name: `${formData.firstName} ${formData.lastName}`.trim(),
                      role: formData.role || 'Operator',
                      ownerId: user.uid,
                      ownerClientId: (userData as any)?.clientId,
                    }),
                  });

                  const data = await response.json();

                  if (!response.ok) {
                    throw new Error(data.error || 'Failed to create team member');
                  }

                  console.log('Team member created successfully:', data);

                  // Close modal and reset form
                  setShowAddModal(false);
                  setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    role: '',
                    sendEmail: false,
                  });

                  // Wait a moment for Firestore to propagate the update
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  // Refresh user data to get the updated team members
                  await refreshUserData();
                  
                  console.log('User data refreshed, team members should now be visible');
                  alert('Team member created successfully! They can now log in with their email and password.');
                } catch (error: any) {
                  console.error('Error adding team member:', error);
                  alert('Failed to add team member: ' + (error.message || 'Unknown error'));
                } finally {
                  setSaving(false);
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Enter First Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Enter Last Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="client@.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password (min 6 characters)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 3m3.29 3.29L3 3" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Minimum 6 characters. Team member will use this to log in.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                    <option value="Operator">Operator</option>
                 
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>


              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#E79138] hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'SAVE CLIENT'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      firstName: '',
                      lastName: '',
                      email: '',
                      password: '',
                      role: '',
                      sendEmail: false,
                    });
                    setShowPassword(false);
                  }}
                  className="flex-1 border border-gray-300 bg-white text-gray-700 font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

