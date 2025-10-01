import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queries } from '@/lib/db';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await queries.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get comprehensive stats
    const stats = await sql`
      SELECT 
        COUNT(*) as total_urls,
        COALESCE(SUM(click_count), 0) as total_clicks,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as urls_today,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as urls_this_week,
        COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 1 END) as expired_urls,
        COUNT(CASE WHEN domain_id IS NOT NULL THEN 1 END) as custom_domain_urls
      FROM urls 
      WHERE organization_id = ${user.organization_id}
    `;

    // Get top performing URLs
    const topUrls = await sql`
      SELECT short_code, original_url, click_count, created_at
      FROM urls 
      WHERE organization_id = ${user.organization_id}
      ORDER BY click_count DESC 
      LIMIT 5
    `;

    return NextResponse.json({
      success: true,
      data: {
        overview: stats[0],
        topUrls: topUrls
      }
    });
  } catch (error) {
    console.error('URL stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
