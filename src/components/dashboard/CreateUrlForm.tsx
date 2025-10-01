'use client';

import { useState, useEffect } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Domain {
  id: number;
  domain: string;
  is_active: boolean;
  verified_at: string | null;
}

interface CreateUrlFormProps {
  apiKey: string;
  organizationId: number;
  onUrlCreated?: () => void;
}

export default function CreateUrlForm({ apiKey, organizationId, onUrlCreated }: CreateUrlFormProps) {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    shortUrl: string;
    shortCode: string;
  } | null>(null);
  const [error, setError] = useState('');

  // Fetch available domains
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await fetch('/api/domains', {
          headers: {
            'x-organization-id': organizationId.toString()
          }
        });
        const data = await response.json();
        if (data.success) {
          // Only show verified domains
          const verifiedDomains = data.data.filter((d: Domain) => d.verified_at);
          setDomains(verifiedDomains);
        }
      } catch (error) {
        console.error('Failed to fetch domains:', error);
      }
    };

    fetchDomains();
  }, [organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/v1/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          url: url,
          customCode: customCode || undefined,
          domain: selectedDomain || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          shortUrl: data.data.shortUrl,
          shortCode: data.data.shortCode
        });
        setUrl('');
        setCustomCode('');
        setSelectedDomain('');
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
    return `https://${domain}/${code}`;
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
            <select
              id="domain"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Default (localhost:3000)</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.domain}>
                  {domain.domain}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* URL Preview */}
        {(customCode || selectedDomain) && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">Preview:</label>
            <code className="text-sm text-blue-600">{getPreviewUrl()}</code>
          </div>
        )}

        {domains.length === 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              💡 Want to use your own domain? 
              <Link href="/dashboard/domains" className="underline ml-1">Add a custom domain</Link>
            </p>
          </div>
        )}

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
        </div>
      )}
    </div>
  );
}
