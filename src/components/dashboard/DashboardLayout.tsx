"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Link as LinkIcon,
  BarChart3,
  Settings,
  Globe,
  Menu,
  X,
  LogOut,
  BookOpen,
  Shield, // Add this import
} from "lucide-react";
import { signOut } from "next-auth/react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    organizationName: string;
    apiKey: string;
    adminLevel?: string; // Add this to the interface
  };
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "URLs", href: "/dashboard/urls", icon: LinkIcon },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Domains", href: "/dashboard/domains", icon: Globe },
    { name: "API Docs", href: "/dashboard/docs", icon: BookOpen },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const handleSignOut = async () => {
    try {
      const confirmed = window.confirm("Are you sure you want to sign out?");
      if (!confirmed) return;

      await signOut({
        redirect: false,
        callbackUrl: "/",
      });

      localStorage.clear();
      sessionStorage.clear();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <span className="text-xl font-bold">URL Shortener</span>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 pb-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
            
            {/* Add Super Admin link to mobile menu */}
            {user?.adminLevel === 'super_admin' && (
              <Link
                href="/admin"
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md bg-red-50 text-red-700 hover:bg-red-100"
                onClick={() => setSidebarOpen(false)}
              >
                <Shield className="mr-3 h-5 w-5" />
                Super Admin
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <span className="text-xl font-bold">URL Shortener</span>
          </div>
          <nav className="flex-1 space-y-1 px-2 pb-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
            
            {/* Add Super Admin link to desktop menu */}
            {user?.adminLevel === 'super_admin' && (
              <Link
                href="/admin"
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md bg-red-50 text-red-700 hover:bg-red-100 mt-4"
              >
                <Shield className="mr-3 h-5 w-5" />
                Super Admin
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              {/* ADD THE SUPER ADMIN BUTTON HERE */}
              {user?.adminLevel === 'super_admin' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                >
                  <Shield size={16} />
                  Admin Panel
                </Link>
              )}

              {user && (
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-gray-500">{user.organizationName}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100 transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
