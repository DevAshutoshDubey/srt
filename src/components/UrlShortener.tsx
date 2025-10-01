'use client';

import { useState } from 'react';
import { Copy, Link, Settings } from 'lucide-react';
import { CustomDomain } from '@/types';

interface UrlShortenerProps {
  domains: CustomDomain[];
}

export default function UrlShortener({ domains }: UrlShortenerProps) {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(domains[0]?.domain || '');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'ashutosh', // In production, get from auth
        },
        body: JSON.stringify({
          url,
          domain: selectedDomain,
          customCode: customCode || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setUrl('');
        setCustomCode('');
      } else {
        setError(data.error || 'Failed to shorten URL');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <Link className="text-blue-500" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">URL Shortener</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL Input */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Enter URL to shorten
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/very/long/url"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Domain Selection */}
          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
              Select Domain
            </label>
            <select
              id="domain"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {domains.map((domain) => (
                <option key={domain.id} value={domain.domain}>
                  {domain.domain}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Code */}
          <div>
            <label htmlFor="customCode" className="block text-sm font-medium text-gray-700 mb-2">
              Custom Short Code (Optional)
            </label>
            <input
              id="customCode"
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="my-custom-code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              pattern="[a-zA-Z0-9-_]+"
              title="Only letters, numbers, hyphens, and underscores allowed"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !url}
            className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Shortening...' : 'Shorten URL'}
          </button>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-3">URL Shortened Successfully!</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">Short URL:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={result.shortUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-green-800"
                  />
                  <button
                    onClick={() => copyToClipboard(result.shortUrl)}
                    className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">Original URL:</label>
                <p className="text-sm text-green-600 break-all">{result.originalUrl}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
