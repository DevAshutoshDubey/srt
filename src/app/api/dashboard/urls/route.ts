import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // For now, we'll get organizationId from header (in real app, use session)
    const organizationId = request.headers.get('x-organization-id');
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 401 }
      );
    }

    // Get organization info
    const orgResult = await sql`
      SELECT monthly_urls_used, monthly_url_limit 
      FROM organizations 
      WHERE id = ${organizationId}
    `;
    
    if (orgResult.length === 0) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const org = orgResult[0];

    // Get total URLs count
    const totalUrlsResult = await sql`
      SELECT COUNT(*) as count FROM urls WHERE organization_id = ${organizationId}
    `;

    // Get total clicks
    const totalClicksResult = await sql`
      SELECT COALESCE(SUM(click_count), 0) as total_clicks 
      FROM urls 
      WHERE organization_id = ${organizationId}
    `;

    // Get URLs created today
    const urlsTodayResult = await sql`
      SELECT COUNT(*) as count 
      FROM urls 
      WHERE organization_id = ${organizationId} 
      AND DATE(created_at) = CURRENT_DATE
    `;

    // Get clicks today (would need url_clicks table for accurate count)
    const clicksTodayResult = await sql`
      SELECT COUNT(*) as count 
      FROM url_clicks uc
      JOIN urls u ON uc.url_id = u.id
      WHERE u.organization_id = ${organizationId} 
      AND DATE(uc.clicked_at) = CURRENT_DATE
    `;

    const stats = {
      totalUrls: parseInt(totalUrlsResult[0].count),
      totalClicks: parseInt(totalClicksResult[0].total_clicks),
      urlsToday: parseInt(urlsTodayResult[0].count),
      clicksToday: parseInt(clicksTodayResult[0].count),
      monthlyUsage: org.monthly_urls_used,
      monthlyLimit: org.monthly_url_limit
    };

    return NextResponse.json({ success: true, data: stats });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
