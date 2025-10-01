import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Simple admin check (in production, use proper admin authentication)
    const adminKey = request.headers.get('admin-key');
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find expired URLs
    const expiredUrls = await sql`
      SELECT id, short_code, organization_id, expires_at
      FROM urls 
      WHERE expires_at IS NOT NULL 
      AND expires_at < NOW()
      AND is_active = true
    `;

    if (expiredUrls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired URLs found',
        cleaned: 0
      });
    }

    // Mark expired URLs as inactive (don't delete, keep for analytics)
    const result = await sql`
      UPDATE urls 
      SET is_active = false, updated_at = NOW()
      WHERE expires_at IS NOT NULL 
      AND expires_at < NOW()
      AND is_active = true
    `;

    // Log the cleanup
    console.log(`Marked ${result.length} URLs as inactive due to expiration`);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${result.length} expired URLs`,
      cleaned: result.length,
      expiredUrls: expiredUrls.map(url => ({
        id: url.id,
        shortCode: url.short_code,
        organizationId: url.organization_id,
        expiredAt: url.expires_at
      }))
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET method to see expired URLs without cleaning
export async function GET() {
  try {
    const expiredUrls = await sql`
      SELECT 
        id, 
        short_code, 
        original_url,
        organization_id, 
        expires_at,
        is_active,
        created_at
      FROM urls 
      WHERE expires_at IS NOT NULL 
      AND expires_at < NOW()
      ORDER BY expires_at DESC
      LIMIT 100
    `;

    return NextResponse.json({
      success: true,
      count: expiredUrls.length,
      expiredUrls
    });

  } catch (error) {
    console.error('Expired URLs fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
