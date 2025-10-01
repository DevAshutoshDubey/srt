import { queries } from '@/lib/db';
import DomainConfig from '@/components/DomainConfig';
import Link from 'next/link';
import { BarChart3, Globe, Link as LinkIcon } from 'lucide-react';

export default async function AdminPage() {
  const domains = await queries.getDomains();
  const recentUrls = await queries.getUrlStats(10);

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your URL shortener configuration</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Domain Configuration - Remove the onDomainsChange prop */}
          <DomainConfig domains={domains} />

          {/* Recent URLs */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="text-blue-500" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Recent URLs</h2>
            </div>
            
            {recentUrls.length === 0 ? (
              <p className="text-gray-500">No URLs created yet.</p>
            ) : (
              <div className="space-y-3">
                {recentUrls.map((url) => (
                  <div key={url.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">/{url.short_code}</p>
                        <p className="text-sm text-gray-500 truncate">{url.original_url}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-gray-400">
                            {url.domain || 'Default domain'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {url.click_count} clicks
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <LinkIcon size={16} />
            Create Short URL
          </Link>
          <Link
            href="/admin/domains"
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <Globe size={16} />
            Manage Domains
          </Link>
        </div>
      </div>
    </main>
  );
}
