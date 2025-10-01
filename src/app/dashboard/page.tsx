'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import UrlList from '@/components/dashboard/UrlList';
import SessionCreateUrlForm from '@/components/dashboard/SessionCreateUrlForm';

interface Url {
  id: number;
  short_code: string;
  original_url: string;
  click_count: number;
  created_at: string;
  domain?: string;
}

interface Stats {
  totalUrls: number;
  totalClicks: number;
  urlsToday: number;
  clicksToday: number;
  monthlyUsage: number;
  monthlyLimit: number;
}

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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalUrls: 0,
    totalClicks: 0,
    urlsToday: 0,
    clicksToday: 0,
    monthlyUsage: 0,
    monthlyLimit: 1000
  });
  const [urls, setUrls] = useState<Url[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return; // Still loading
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
        setStats({
          totalUrls: 0, // We'll implement these later
          totalClicks: 0,
          urlsToday: 0,
          clicksToday: 0,
          monthlyUsage: data.data.organization.monthlyUrlsUsed,
          monthlyLimit: data.data.organization.monthlyUrlLimit
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadUrls = async () => {
    try {
      const response = await fetch('/api/urls');
      const data = await response.json();
      
      if (data.success) {
        setUrls(data.data);
      }
    } catch (error) {
      console.error('Failed to load URLs:', error);
    }
  };

  const refreshData = () => {
    loadProfile();
    loadUrls();
  };

  useEffect(() => {
    if (profile) {
      const loadData = async () => {
        setLoading(true);
        await loadUrls();
        setLoading(false);
      };
      
      loadData();
    }
  }, [profile]);

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

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-24 rounded"></div>
              ))}
            </div>
            <div className="mt-8 bg-gray-200 h-48 rounded"></div>
            <div className="mt-8 bg-gray-200 h-64 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name}</p>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <DashboardStats stats={stats} />
        </div>

        {/* Create URL Form */}
        <div className="mb-8">
          <SessionCreateUrlForm onUrlCreated={refreshData} />
        </div>

        {/* URL List */}
        <UrlList urls={urls} />
      </div>
    </DashboardLayout>
  );
}
