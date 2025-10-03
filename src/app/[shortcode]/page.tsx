// app/[shortcode]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function RedirectPage() {
  const params = useParams();
  const shortcode = params.shortcode as string;
  const [error, setError] = useState('');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    async function handleRedirect() {
      try {
        console.log('🔍 Fetching URL for:', shortcode);

        // Call API to get URL and track click
        const response = await fetch(`/api/urls/track/${shortcode}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        console.log('📊 Response:', data);

        if (data.success && data.url) {
          console.log('✅ Redirecting to:', data.url);
          // Redirect after short delay
          setTimeout(() => {
            window.location.href = data.url;
          }, 100);
        } else if (data.error === 'expired') {
          setStatus('expired');
        } else {
          setStatus('notfound');
          setError(data.error || 'URL not found');
        }
      } catch (err) {
        console.error('❌ Error:', err);
        setStatus('error');
        setError('Failed to load URL');
      }
    }

    if (shortcode) {
      handleRedirect();
    }
  }, [shortcode]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Link Expired</h1>
          <p className="text-xl text-gray-600 mb-6">This short URL has expired and is no longer valid.</p>
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'notfound') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-6">{error}</p>
          <p className="text-gray-500 mb-8">The link you&apos;re looking for doesn&apos;t exist or may have been removed.</p>
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Something went wrong</h1>
        <p className="text-xl text-gray-600 mb-6">{error}</p>
        <Link 
          href="/" 
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
