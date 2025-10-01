'use client';

import { useState, useEffect } from 'react';
import { Globe, Plus, Check, X, AlertCircle, ExternalLink, Copy } from 'lucide-react';

interface Domain {
  id: number;
  domain: string;
  is_active: boolean;
  verified_at: string | null;
  created_at: string;
}

export default function DomainManagement() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifyingDomain, setVerifyingDomain] = useState<number | null>(null);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/domains');
      const data = await response.json();
      if (data.success) {
        setDomains(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

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
        },
        body: JSON.stringify({ domain: newDomain.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setNewDomain('');
        await fetchDomains();
      } else {
        setError(data.error || 'Failed to add domain');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDomain = async (domainId: number) => {
    setVerifyingDomain(domainId);
    setError('');

    try {
      const response = await fetch(`/api/domains/${domainId}/verify`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        await fetchDomains();
      } else {
        setError(data.error || 'Domain verification failed');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setVerifyingDomain(null);
    }
  };

  // ... rest of the component stays the same ...

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getDomainStatus = (domain: Domain) => {
    if (domain.verified_at) {
      return { status: 'verified', color: 'green', icon: Check, text: 'Verified' };
    }
    return { status: 'pending', color: 'yellow', icon: AlertCircle, text: 'Pending Verification' };
  };

  return (
    <div className="space-y-6">
      {/* Add Domain Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="text-blue-500" size={24} />
          <h2 className="text-xl font-bold text-gray-900">Custom Domains</h2>
        </div>

        <form onSubmit={handleAddDomain} className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="yourdomain.com"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              pattern="[a-zA-Z0-9.-]+"
              title="Enter a valid domain name (e.g., yourdomain.com)"
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

        {/* Domain Setup Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Domain Setup Instructions</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Add your domain above</li>
            <li>2. Create an A record pointing to: <code className="bg-blue-100 px-1 rounded">123.45.67.89</code></li>
            <li>3. Or create a CNAME record pointing to: <code className="bg-blue-100 px-1 rounded">app.urlshortener.com</code></li>
            <li>4. Wait for DNS propagation (up to 48 hours)</li>
            <li>5. Click &quot;Verify Domain&quot; to activate</li>
          </ol>
        </div>
      </div>

      {/* Rest of the component stays the same... */}
      {/* Domains List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Your Domains</h3>
        </div>

        {domains.length === 0 ? (
          <div className="p-6 text-center">
            <Globe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No domains configured yet.</p>
            <p className="text-sm text-gray-400 mt-1">Add your first custom domain above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {domains.map((domain) => {
              const status = getDomainStatus(domain);
              const StatusIcon = status.icon;
              
              return (
                <div key={domain.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-medium text-gray-900">{domain.domain}</h4>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-${status.color}-100 text-${status.color}-800`}>
                          <StatusIcon size={12} />
                          {status.text}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-500">
                        Added {new Date(domain.created_at).toLocaleDateString()}
                        {domain.verified_at && (
                          <span className="ml-4">
                            Verified {new Date(domain.verified_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* DNS Configuration */}
                      {!domain.verified_at && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border">
                          <p className="text-sm font-medium text-gray-700 mb-2">DNS Configuration:</p>
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">A Record:</span>
                              <div className="flex items-center gap-2">
                                <code className="bg-gray-200 px-2 py-1 rounded">@ → 123.45.67.89</code>
                                <button
                                  onClick={() => copyToClipboard('123.45.67.89')}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">CNAME:</span>
                              <div className="flex items-center gap-2">
                                <code className="bg-gray-200 px-2 py-1 rounded">@ → app.urlshortener.com</code>
                                <button
                                  onClick={() => copyToClipboard('app.urlshortener.com')}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!domain.verified_at && (
                        <button
                          onClick={() => handleVerifyDomain(domain.id)}
                          disabled={verifyingDomain === domain.id}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 text-sm"
                        >
                          {verifyingDomain === domain.id ? 'Verifying...' : 'Verify Domain'}
                        </button>
                      )}

                      {domain.verified_at && (
                        <a
                          href={`http://${domain.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                          title="Test domain"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}

                      <button className="text-red-500 hover:text-red-700 p-1" title="Delete domain">
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Usage Examples */}
                  {domain.verified_at && (
                    <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                      <p className="text-sm font-medium text-green-800 mb-2">✅ Domain Active</p>
                      <p className="text-sm text-green-700">
                        Your short URLs will now use: <code className="bg-green-100 px-1 rounded">https://{domain.domain}/shortcode</code>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Domain Benefits */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Why Use Custom Domains?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded">
              <Globe className="text-blue-600" size={16} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Brand Recognition</h4>
              <p className="text-sm text-gray-600">Use your own domain to maintain brand consistency</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded">
              <Check className="text-green-600" size={16} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Trust & Credibility</h4>
              <p className="text-sm text-gray-600">Users are more likely to click familiar domains</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 p-2 rounded">
              <ExternalLink className="text-purple-600" size={16} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Better Analytics</h4>
              <p className="text-sm text-gray-600">Track performance with your own domain metrics</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-orange-100 p-2 rounded">
              <AlertCircle className="text-orange-600" size={16} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">No Dependencies</h4>
              <p className="text-sm text-gray-600">Your links work even if our service changes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
