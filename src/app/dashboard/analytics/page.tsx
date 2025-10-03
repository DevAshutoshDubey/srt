// app/dashboard/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AnalyticsChart from '@/components/dashboard/AnalyticsChart';
import { BarChart3, Globe, MousePointer, TrendingUp } from 'lucide-react';

interface UserProfile {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  organization: {
    id: number;
    name: string;
    slug: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    monthlyUrlsUsed: number;
    monthlyUrlLimit: number;
    apiKey: string;
  };
}

interface AnalyticsData {
  overview: {
    total_clicks: number;
    unique_visitors: number;
    top_country: string;
    avg_clicks_per_day: number;
  };
  clicksByDate: Array<{ date: string; clicks: number }>;
  topCountries: Array<{ country: string; clicks: number }>;
  topReferrers: Array<{ referrer: string; clicks: number }>;
  topUrls: Array<{ 
    id: number;
    short_code: string; 
    original_url: string; 
    clicks: number; 
  }>;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  // Load user profile
  useEffect(() => {
    if (session) {
      loadProfile();
    }
  }, [session]);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setError('Failed to load profile');
    }
  };

  // Load analytics data from API
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/analytics?days=${timeRange}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      } else {
        setError(data.error || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      loadAnalytics();
    }
  }, [profile, timeRange]);

  // Show loading while checking authentication
  if (status === 'loading' || !session || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const user = {
    name: `${profile.user.firstName} ${profile.user.lastName}`,
    email: profile.user.email,
    organizationName: profile.organization.name,
    organizationId: profile.organization.id,
    apiKey: profile.organization.apiKey
  };

  // Show error state
  if (error) {
    return (
      <DashboardLayout user={user}>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadAnalytics}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="p-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show empty state
  if (!analytics) {
    return (
      <DashboardLayout user={user}>
        <div className="p-8">
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No analytics data available yet</p>
            <p className="text-sm text-gray-400 mt-1">Start creating short URLs to see analytics</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">Track your URL performance and audience insights</p>
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MousePointer className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Clicks</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.overview.total_clicks.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Globe className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Unique Visitors</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.overview.unique_visitors.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Daily Clicks</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.overview.avg_clicks_per_day}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-orange-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Top Country</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.overview.top_country}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clicks Chart */}
        {analytics.clicksByDate.length > 0 ? (
          <div className="mb-8">
            <AnalyticsChart 
              data={analytics.clicksByDate}
              title="Clicks Over Time"
              color="blue"
            />
          </div>
        ) : (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Clicks Over Time</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              No click data available for this period
            </div>
          </div>
        )}

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Countries */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Countries</h3>
            {analytics.topCountries.length > 0 ? (
              <div className="space-y-4">
                {analytics.topCountries.map((country, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{country.country}</span>
                    <div className="flex items-center space-x-2">
                      <div className="bg-gray-200 rounded-full h-2 w-24">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ 
                            width: `${analytics.topCountries[0].clicks > 0 
                              ? (country.clicks / analytics.topCountries[0].clicks) * 100 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{country.clicks}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data available</p>
            )}
          </div>

          {/* Top Referrers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Referrers</h3>
            {analytics.topReferrers.length > 0 ? (
              <div className="space-y-4">
                {analytics.topReferrers.map((referrer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 truncate">{referrer.referrer}</span>
                    <div className="flex items-center space-x-2">
                      <div className="bg-gray-200 rounded-full h-2 w-24">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ 
                            width: `${analytics.topReferrers[0].clicks > 0 
                              ? (referrer.clicks / analytics.topReferrers[0].clicks) * 100 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{referrer.clicks}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data available</p>
            )}
          </div>

          {/* Top URLs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing URLs</h3>
            {analytics.topUrls.length > 0 ? (
              <div className="space-y-4">
                {analytics.topUrls.map((url, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 font-mono">/{url.short_code}</span>
                      <span className="text-sm font-medium text-gray-900">{url.clicks}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{url.original_url}</p>
                    <div className="bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-purple-500 h-1 rounded-full"
                        style={{ 
                          width: `${analytics.topUrls[0].clicks > 0 
                            ? (url.clicks / analytics.topUrls[0].clicks) * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data available</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
