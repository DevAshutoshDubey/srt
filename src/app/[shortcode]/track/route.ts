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
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Find the URL
    const urlData = await queries.getUrlByShortCode(shortcode);
    
    if (urlData) {
      // Update click count and log analytics
      await Promise.all([
        sql`UPDATE urls SET click_count = click_count + 1 WHERE short_code = ${shortcode}`,
        queries.logUrlClick({
          urlId: urlData.id,
          organizationId: urlData.organization_id,
          ipAddress: ip,
          userAgent: userAgent,
          referrer: referer,
          country: null // You could add IP-to-country lookup here
        })
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Click tracking error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
