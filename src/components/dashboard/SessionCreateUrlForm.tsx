'use client';

import { useState, useEffect } from 'react';
import { Copy, ExternalLink, Calendar } from 'lucide-react';

interface Domain {
  id: number;
  domain: string;
  is_active: boolean;
  verified_at: string | null;
}

interface SessionCreateUrlFormProps {
  onUrlCreated?: () => void;
}

export default function SessionCreateUrlForm({ onUrlCreated }: SessionCreateUrlFormProps) {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [expirationTime, setExpirationTime] = useState('');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [result, setResult] = useState<{
    shortUrl: string;
    shortCode: string;
    expiresAt?: string;
  } | null>(null);
  const [error, setError] = useState('');

  // Quick expiration options
  const quickExpirationOptions = [
    { label: '1 Hour', hours: 1 },
    { label: '1 Day', hours: 24 },
    { label: '1 Week', hours: 24 * 7 },
    { label: '1 Month', hours: 24 * 30 },
    { label: '1 Year', hours: 24 * 365 },
  ];

  // Fetch available domains when component mounts
  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      setLoadingDomains(true);
      const response = await fetch('/api/domains');
      const data = await response.json();
      
      if (data.success) {
        const verifiedDomains = data.data.filter((d: Domain) => d.verified_at);
        setDomains(verifiedDomains);
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    } finally {
      setLoadingDomains(false);
    }
  };

  const handleQuickExpiration = (hours: number) => {
    const now = new Date();
    const expirationDateTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
    
    const dateStr = expirationDateTime.toISOString().split('T')[0];
    const timeStr = expirationDateTime.toTimeString().split(' ')[0].substring(0, 5);
    
    setExpirationDate(dateStr);
    setExpirationTime(timeStr);
  };

  const clearExpiration = () => {
    setExpirationDate('');
    setExpirationTime('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);

    try {
      let expiresAt = null;
      if (expirationDate) {
        const dateTime = expirationTime 
          ? `${expirationDate}T${expirationTime}:00`
          : `${expirationDate}T23:59:59`;
        expiresAt = new Date(dateTime).toISOString();
      }

      const requestBody = {
        url: url,
        customCode: customCode || undefined,
        domain: selectedDomain || undefined,
        expiresAt: expiresAt
      };

      console.log('Creating URL with data:', requestBody);

      const response = await fetch('/api/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          shortUrl: data.data.shortUrl,
          shortCode: data.data.shortCode,
          expiresAt: data.data.expiresAt
        });
        setUrl('');
        setCustomCode('');
        setSelectedDomain('');
        setExpirationDate('');
        setExpirationTime('');
        onUrlCreated?.();
      } else {
        setError(data.error || 'Failed to create short URL');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getPreviewUrl = () => {
    const domain = selectedDomain || 'localhost:3000';
    const code = customCode || 'abc123';
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${domain}/${code}`;
  };

  const formatExpirationDateTime = () => {
    if (!expirationDate) return null;
    const dateTime = expirationTime 
      ? `${expirationDate}T${expirationTime}:00`
      : `${expirationDate}T23:59:59`;
    return new Date(dateTime).toLocaleString();
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Create Short URL</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">
            Original URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/very/long/url"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="customCode" className="block text-sm font-medium text-gray-700">
              Custom Code (optional)
            </label>
            <input
              type="text"
              id="customCode"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="my-custom-code"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
              Domain
            </label>
            {loadingDomains ? (
              <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                Loading domains...
              </div>
            ) : (
              <select
                id="domain"
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Default (localhost:3000)</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.domain}>
                    {domain.domain} ✓
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Expiration Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline mr-1" size={16} />
            URL Expiration (optional)
          </label>
          
          {/* Quick Options */}
          <div className="flex flex-wrap gap-2 mb-3">
            {quickExpirationOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => handleQuickExpiration(option.hours)}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                {option.label}
              </button>
            ))}
            {(expirationDate || expirationTime) && (
              <button
                type="button"
                onClick={clearExpiration}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Custom Date/Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Time (optional)</label>
              <input
                type="time"
                value={expirationTime}
                onChange={(e) => setExpirationTime(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {expirationDate && (
            <p className="mt-2 text-xs text-gray-500">
              URL will expire on: <strong>{formatExpirationDateTime()}</strong>
            </p>
          )}
        </div>

        {/* URL Preview */}
        {(customCode || selectedDomain) && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">Preview:</label>
            <code className="text-sm text-blue-600">{getPreviewUrl()}</code>
          </div>
        )}

        {/* Domain Management Link */}
        <div className="flex items-center justify-between">
          <div>
            {domains.length === 0 && !loadingDomains && (
              <p className="text-sm text-gray-600">
                💡 Want to use your own domain? 
                <a href="/dashboard/domains" className="text-blue-600 hover:underline ml-1">
                  Add a custom domain
                </a>
              </p>
            )}
            {domains.length > 0 && (
              <p className="text-sm text-green-600">
                ✅ {domains.length} verified domain{domains.length > 1 ? 's' : ''} available
              </p>
            )}
          </div>
          
          {domains.length > 0 && (
            <a 
              href="/dashboard/domains" 
              className="text-sm text-blue-600 hover:underline"
            >
              Manage domains
            </a>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
        >
          {loading ? 'Creating...' : 'Create Short URL'}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-2">URL Created Successfully!</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white p-3 rounded border">
              <span className="text-sm font-mono">{result.shortUrl}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(result.shortUrl)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <a
                  href={result.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
            {result.expiresAt && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <Calendar size={14} />
                <span>Expires: {new Date(result.expiresAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
