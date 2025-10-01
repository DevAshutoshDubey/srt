'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  Shield,
  Users,
  Building,
  Link as LinkIcon,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Globe,
  AlertTriangle,
  Database
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Organizations', href: '/admin/organizations', icon: Building },
    { name: 'URLs', href: '/admin/urls', icon: LinkIcon },
    { name: 'Domains', href: '/admin/domains', icon: Globe },
    { name: 'System Logs', href: '/admin/logs', icon: AlertTriangle },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Database', href: '/admin/database', icon: Database },
  ];

  const handleSignOut = async () => {
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (!confirmed) return;

    try {
      await signOut({ redirect: false });
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 bg-red-600 text-white">
            <div className="flex items-center gap-2">
              <Shield size={24} />
              <span className="text-xl font-bold">Super Admin</span>
            </div>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  pathname === item.href
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 bg-red-600 text-white">
            <div className="flex items-center gap-2">
              <Shield size={24} />
              <span className="text-xl font-bold">Super Admin</span>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  pathname === item.href
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
                SUPER ADMIN MODE
              </div>
              
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Back to User Dashboard →
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
