// app/[shortcode]/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queries } from '@/lib/db';
import sql from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shortcode: string }> }
) {
  try {
    const resolvedParams = await params;
    const { shortcode } = resolvedParams;
    
    // Get client info
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Find the URL
    const urlData = await queries.getUrlByShortCode(shortcode);
    
    if (urlData) {
      // Parse user agent for device info
      const deviceType = getDeviceType(userAgent);
      const browser = getBrowser(userAgent);
      const os = getOS(userAgent);

      // Get geolocation (basic version)
      const { country, city } = await getGeolocation(ip);

      // Update click count and insert analytics
      await Promise.all([
        // Update click count
        sql`
          UPDATE urls 
          SET click_count = click_count + 1 
          WHERE short_code = ${shortcode}
        `,
        // Insert analytics record
        sql`
          INSERT INTO analytics (
            url_id, 
            ip_address, 
            user_agent, 
            referrer, 
            country, 
            city, 
            device_type, 
            browser, 
            os
          ) VALUES (
            ${urlData.id},
            ${ip},
            ${userAgent},
            ${referer},
            ${country},
            ${city},
            ${deviceType},
            ${browser},
            ${os}
          )
        `
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Click tracking error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// Helper functions
function getDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'Mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'Tablet';
  return 'Desktop';
}

function getBrowser(userAgent: string): string {
  if (/edg/i.test(userAgent)) return 'Edge';
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/opera/i.test(userAgent)) return 'Opera';
  return 'Other';
}

function getOS(userAgent: string): string {
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/ios|iphone|ipad/i.test(userAgent)) return 'iOS';
  return 'Other';
}

// Simple geolocation - returns Unknown for localhost
async function getGeolocation(ip: string): Promise<{ country: string; city: string }> {
  // Skip geolocation for localhost/unknown IPs
  if (ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168')) {
    return { country: 'Unknown', city: 'Unknown' };
  }

  try {
    // Free IP geolocation API (100 requests/day limit)
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'nodejs' }
    });
    
    if (!response.ok) {
      return { country: 'Unknown', city: 'Unknown' };
    }

    const data = await response.json();
    return {
      country: data.country_name || 'Unknown',
      city: data.city || 'Unknown'
    };
  } catch (error) {
    console.error('Geolocation error:', error);
    return { country: 'Unknown', city: 'Unknown' };
  }
}
