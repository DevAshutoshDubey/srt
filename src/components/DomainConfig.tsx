'use client';

import { useState } from 'react';
import { Plus, Globe, Trash2 } from 'lucide-react';
import { CustomDomain } from '@/types';
import { useRouter } from 'next/navigation';

interface DomainConfigProps {
  domains: CustomDomain[];
}

export default function DomainConfig({ domains }: DomainConfigProps) {
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentDomains, setCurrentDomains] = useState(domains);
  const router = useRouter();

  const refreshData = () => {
    router.refresh(); // This is the Next.js way to refresh server data
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'ashutosh', // In production, get this from auth
        },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setNewDomain('');
        // Update local state immediately
        setCurrentDomains([data.data, ...currentDomains]);
        // Refresh server data
        refreshData();
      } else {
        setError(data.error || 'Failed to add domain');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="text-blue-500" size={24} />
        <h2 className="text-2xl font-bold text-gray-900">Domain Configuration</h2>
      </div>

      {/* Add New Domain */}
      <form onSubmit={handleAddDomain} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="yourdomain.com"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            pattern="[a-zA-Z0-9.-]+"
            title="Enter a valid domain name"
          />
          <button
            type="submit"
            disabled={loading || !newDomain.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus size={16} />
            {loading ? 'Adding...' : 'Add Domain'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>

      {/* Domains List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">Active Domains</h3>
        {currentDomains.length === 0 ? (
          <p className="text-gray-500">No domains configured yet.</p>
        ) : (
          <div className="space-y-2">
            {currentDomains.map((domain) => (
              <div
                key={domain.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{domain.domain}</p>
                  <p className="text-sm text-gray-500">
                    Added {new Date(domain.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      domain.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {domain.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    className="p-1 text-red-500 hover:text-red-700"
                    title="Remove domain"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Domain Setup Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Domain Setup Instructions</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Add your domain above</li>
          <li>2. Create an A record pointing to your server IP</li>
          <li>3. Or create a CNAME record pointing to your current domain</li>
          <li>4. Wait for DNS propagation (up to 48 hours)</li>
          <li>5. Configure SSL certificate for HTTPS</li>
        </ol>
      </div>
    </div>
  );
}
