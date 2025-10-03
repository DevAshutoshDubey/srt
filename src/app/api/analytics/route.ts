// app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user and organization
    const userResult = await sql`
      SELECT u.*, u.organization_id 
      FROM users u
      WHERE u.email = ${session.user.email}
      LIMIT 1
    `;

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult[0];
    const organizationId = user.organization_id;

    // Get time range from query params
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Get analytics overview
    const overviewResult = await sql`
      SELECT * FROM get_analytics_overview(${organizationId}, ${days})
    `;

    // Get clicks by date
    const clicksByDateResult = await sql`
      SELECT * FROM get_clicks_by_date(${organizationId}, ${days})
    `;

    // Get top countries
    const topCountriesResult = await sql`
      SELECT * FROM get_top_countries(${organizationId}, ${days}, 5)
    `;

    // Get top referrers
    const topReferrersResult = await sql`
      SELECT * FROM get_top_referrers(${organizationId}, ${days}, 5)
    `;

    // Get top URLs
    const topUrlsResult = await sql`
      SELECT * FROM get_top_urls(${organizationId}, ${days}, 10)
    `;

    const analyticsData = {
      overview: overviewResult[0] || {
        total_clicks: 0,
        unique_visitors: 0,
        top_country: 'N/A',
        avg_clicks_per_day: 0
      },
      clicksByDate: clicksByDateResult.map(row => ({
        date: row.date,
        clicks: parseInt(row.clicks)
      })),
      topCountries: topCountriesResult.map(row => ({
        country: row.country,
        clicks: parseInt(row.clicks)
      })),
      topReferrers: topReferrersResult.map(row => ({
        referrer: row.referrer,
        clicks: parseInt(row.clicks)
      })),
      topUrls: topUrlsResult.map(row => ({
        id: row.id,
        short_code: row.short_code,
        original_url: row.original_url,
        clicks: parseInt(row.clicks)
      }))
    };

    return NextResponse.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
