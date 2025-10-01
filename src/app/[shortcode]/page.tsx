import { queries } from '@/lib/db';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';
import Link from 'next/link';

interface Props {
  params: Promise<{
    shortcode: string;
  }>;
}

export default async function RedirectPage({ params }: Props) {
  try {
    const resolvedParams = await params;
    const { shortcode } = resolvedParams;

    console.log('🔍 Looking up shortcode:', shortcode);

    if (!shortcode || shortcode.length < 3) {
      console.log('❌ Invalid shortcode');
      return <NotFoundComponent message="Invalid short URL format" />;
    }

    // Find the URL by short code
    const urlData = await queries.getUrlByShortCode(shortcode);
    
    console.log('📄 URL data found:', urlData ? 'Yes' : 'No');
    
    if (!urlData) {
      console.log('❌ URL not found in database');
      return <NotFoundComponent message="Short URL not found" />;
    }

    // Check if URL has expired
    if (urlData.expires_at && new Date(urlData.expires_at) < new Date()) {
      console.log('⏰ URL has expired');
      return <ExpiredComponent />;
    }

    console.log('✅ Redirecting to:', urlData.original_url);

    // Log the click asynchronously (don't await it)
    logClick(shortcode, urlData.id, urlData.organization_id);

    // Redirect (this will throw NEXT_REDIRECT - that's normal!)
    redirect(urlData.original_url);

  } catch (error) {
    // Only log if it's NOT the NEXT_REDIRECT error
    if (error.message !== 'NEXT_REDIRECT') {
      console.error('🚨 Actual error in redirect handler:', error);
      return <ErrorComponent />;
    }
    // Re-throw NEXT_REDIRECT so Next.js can handle it
    throw error;
  }
}

// Async function to log clicks without blocking redirect
async function logClick(shortCode: string, urlId: number, organizationId: number) {
  try {
    await Promise.all([
      sql`UPDATE urls SET click_count = click_count + 1 WHERE short_code = ${shortCode}`,
      queries.logUrlClick({
        urlId: urlId,
        organizationId: organizationId,
        ipAddress: '127.0.0.1',
        userAgent: 'Server-Side',
        referrer: null,
        country: null
      })
    ]);
    console.log('📊 Click logged successfully');
  } catch (error) {
    console.error('❌ Failed to log click:', error);
  }
}

// Server Component for not found URLs
function NotFoundComponent({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🔗</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">{message}</p>
        <p className="text-gray-500 mb-8">The link you're looking for doesn't exist or may have been removed.</p>
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

// Server Component for expired URLs
function ExpiredComponent() {
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

// Server Component for server errors  
function ErrorComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Something went wrong</h1>
        <p className="text-xl text-gray-600 mb-6">We're having trouble processing this link.</p>
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
