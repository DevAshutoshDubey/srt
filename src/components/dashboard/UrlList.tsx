'use client';

import { Copy, ExternalLink, BarChart3 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Url {
  id: number;
  short_code: string;
  original_url: string;
  click_count: number;
  created_at: string;
  domain?: string;
}

interface UrlListProps {
  urls: Url[];
}

export default function UrlList({ urls }: UrlListProps) {
  console.log('UrlList received urls:', urls); // Debug log
  console.log('urls is array:', Array.isArray(urls)); // Debug log

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getShortUrl = (shortCode: string, domain?: string) => {
    const baseUrl = domain || 'localhost:3000';
    return `http://${baseUrl}/${shortCode}`;
  };

  // Safety check - make sure urls is an array
  if (!Array.isArray(urls)) {
    console.error('UrlList: urls prop is not an array:', urls);
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-red-500">Error: Unable to load URLs</p>
          <p className="text-sm text-gray-400 mt-2">Please refresh the page</p>
        </div>
      </div>
    );
  }

  if (urls.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">No URLs created yet.</p>
          <p className="text-sm text-gray-400 mt-2">Create your first short URL above!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Recent URLs</h2>
      </div>
      
      <div className="divide-y divide-gray-200">
        {urls.map((url) => (
          <div key={url.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 font-mono">
                      {getShortUrl(url.short_code, url.domain)}
                    </p>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {url.original_url}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-400">
                        Created {formatDate(url.created_at)}
                      </span>
                      <span className="flex items-center text-xs text-gray-400">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        {url.click_count} clicks
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyToClipboard(getShortUrl(url.short_code, url.domain))}
                  className="text-gray-400 hover:text-gray-600"
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <a
                  href={getShortUrl(url.short_code, url.domain)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600"
                  title="Open URL"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
