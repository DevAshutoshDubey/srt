'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
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
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Admin access check failed:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [session, status, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this area.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}
