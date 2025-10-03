// app/admin/organizations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Search, Building, Users, Link as LinkIcon, TrendingUp } from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  slug: string;
  subscription_tier: string;
  subscription_status: string;
  monthly_urls_limit: number;
  monthly_urls_used: number;
  user_count: number;
  url_count: number;
  total_clicks: number;
  created_at: string;
}

export default function AdminOrganizationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (status === 'loading') return;
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      try {
        const response = await fetch('/api/admin/verify');
        const data = await response.json();
        
        if (data.success && data.adminLevel === 'super_admin') {
          setHasAccess(true);
          loadOrganizations();
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Access check failed:', error);
        router.push('/dashboard');
      }
    };

    checkAccess();
  }, [session, status, router]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/organizations');
      const data = await response.json();

      if (data.success) {
        setOrganizations(data.data);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUsagePercentage = (used: number, limit: number) => {
    return limit > 0 ? Math.round((used / limit) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'starter': return 'bg-green-100 text-green-800';
      case 'free': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!hasAccess) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600">Manage all organizations and their subscriptions</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search organizations by name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Organizations</div>
            <div className="text-2xl font-bold text-gray-900">{organizations.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {organizations.filter(o => o.subscription_status === 'active').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Trial</div>
            <div className="text-2xl font-bold text-blue-600">
              {organizations.filter(o => o.subscription_status === 'trial').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Suspended</div>
            <div className="text-2xl font-bold text-red-600">
              {organizations.filter(o => o.subscription_status === 'suspended').length}
            </div>
          </div>
        </div>

        {/* Organizations List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredOrgs.map((org) => (
              <div key={org.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-blue-100 p-2 rounded">
                        <Building className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                        <p className="text-sm text-gray-500">@{org.slug}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTierColor(org.subscription_tier)}`}>
                      {org.subscription_tier.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(org.subscription_status)}`}>
                      {org.subscription_status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="text-gray-400" size={16} />
                    <div>
                      <div className="text-xs text-gray-500">Users</div>
                      <div className="text-sm font-semibold">{org.user_count}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="text-gray-400" size={16} />
                    <div>
                      <div className="text-xs text-gray-500">URLs</div>
                      <div className="text-sm font-semibold">{org.url_count}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-gray-400" size={16} />
                    <div>
                      <div className="text-xs text-gray-500">Total Clicks</div>
                      <div className="text-sm font-semibold">{org.total_clicks.toLocaleString()}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Monthly Usage</div>
                    <div className="text-sm font-semibold">
                      {org.monthly_urls_used} / {org.monthly_urls_limit === -1 ? '∞' : org.monthly_urls_limit}
                    </div>
                  </div>
                </div>

                {/* Usage Bar */}
                {org.monthly_urls_limit > 0 && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>URL Limit Usage</span>
                      <span>{getUsagePercentage(org.monthly_urls_used, org.monthly_urls_limit)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          getUsagePercentage(org.monthly_urls_used, org.monthly_urls_limit) > 90
                            ? 'bg-red-500'
                            : getUsagePercentage(org.monthly_urls_used, org.monthly_urls_limit) > 75
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(getUsagePercentage(org.monthly_urls_used, org.monthly_urls_limit), 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  Created {new Date(org.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}

            {filteredOrgs.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No organizations found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
