// app/api/urls/track/[shortcode]/route.ts
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

    console.log('🔍 Track API called for:', shortcode);

    // Get URL data
    const urlData = await queries.getUrlByShortCode(shortcode);

    if (!urlData) {
      console.log('❌ URL not found');
      return NextResponse.json(
        { success: false, error: 'URL not found' },
        { status: 404 }
      );
    }

    console.log('✅ URL found:', urlData.id);

    // Check if expired
    if (urlData.expires_at && new Date(urlData.expires_at) < new Date()) {
      console.log('⏰ URL expired');
      return NextResponse.json(
        { success: false, error: 'expired' },
        { status: 410 }
      );
    }

    // Check if active
    if (!urlData.is_active) {
      console.log('❌ URL inactive');
      return NextResponse.json(
        { success: false, error: 'URL inactive' },
        { status: 410 }
      );
    }

    // Get client info from headers
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referer = request.headers.get('referer') || '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';

    console.log('📡 Client data:', { ip, userAgent: userAgent.substring(0, 50) });

    // Parse user agent
    const deviceType = /mobile/i.test(userAgent) ? 'Mobile' : 
                       /tablet|ipad/i.test(userAgent) ? 'Tablet' : 'Desktop';
    const browser = /edg/i.test(userAgent) ? 'Edge' :
                    /chrome/i.test(userAgent) ? 'Chrome' :
                    /firefox/i.test(userAgent) ? 'Firefox' :
                    /safari/i.test(userAgent) ? 'Safari' : 'Other';
    const os = /windows/i.test(userAgent) ? 'Windows' :
               /mac/i.test(userAgent) ? 'macOS' :
               /linux/i.test(userAgent) ? 'Linux' :
               /android/i.test(userAgent) ? 'Android' :
               /ios|iphone|ipad/i.test(userAgent) ? 'iOS' : 'Other';

    console.log('💻 Parsed:', { deviceType, browser, os });

    try {
      // Update click count
      console.log('📝 Updating click count...');
      await sql`
        UPDATE urls 
        SET click_count = click_count + 1 
        WHERE id = ${urlData.id}
      `;
      console.log('✅ Click count updated');

      // Insert analytics
      console.log('📝 Inserting analytics...');
      await sql`
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
          'Unknown',
          'Unknown',
          ${deviceType},
          ${browser},
          ${os}
        )
      `;
      console.log('✅ Analytics inserted');

    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      // Still return success with URL even if tracking fails
    }

    // Return the URL for redirect
    return NextResponse.json({
      success: true,
      url: urlData.original_url
    });

  } catch (error) {
    console.error('❌ Track API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
