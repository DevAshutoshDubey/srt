// app/api/admin/organizations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireSuperAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const organizations = await sql`
      SELECT 
        o.id,
        o.name,
        o.slug,
        o.subscription_tier,
        o.subscription_status,
        o.monthly_urls_limit,
        o.monthly_urls_used,
        o.created_at,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT url.id) as url_count,
        COALESCE(SUM(url.click_count), 0) as total_clicks
      FROM organizations o
      LEFT JOIN users u ON o.id = u.organization_id
      LEFT JOIN urls url ON o.id = url.organization_id
      GROUP BY o.id, o.name, o.slug, o.subscription_tier, o.subscription_status, 
               o.monthly_urls_limit, o.monthly_urls_used, o.created_at
      ORDER BY o.created_at DESC
    `;

    return NextResponse.json({
      success: true,
      data: organizations.map(org => ({
        ...org,
        user_count: parseInt(org.user_count),
        url_count: parseInt(org.url_count),
        total_clicks: parseInt(org.total_clicks)
      }))
    });

  } catch (error) {
    console.error('Admin organizations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}
