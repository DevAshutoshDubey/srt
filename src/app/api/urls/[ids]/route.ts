import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queries } from '@/lib/db';
import sql from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const resolvedParams = await params;
    const urlId = parseInt(resolvedParams.id);
    
    const user = await queries.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get URL with analytics
    const urlData = await queries.getUrlAnalytics(urlId, user.organization_id);
    
    if (!urlData) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: urlData });
  } catch (error) {
    console.error('URL fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const resolvedParams = await params;
    const urlId = parseInt(resolvedParams.id);
    
    const user = await queries.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete URL (only if it belongs to the organization)
    await sql`
      DELETE FROM urls 
      WHERE id = ${urlId} AND organization_id = ${user.organization_id}
    `;

    return NextResponse.json({ success: true, message: 'URL deleted successfully' });
  } catch (error) {
    console.error('URL deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const resolvedParams = await params;
    const urlId = parseInt(resolvedParams.id);
    const { original_url, expires_at } = await request.json();
    
    const user = await queries.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update URL (only if it belongs to the organization)
    const result = await sql`
      UPDATE urls 
      SET 
        original_url = ${original_url || null},
        expires_at = ${expires_at || null}
      WHERE id = ${urlId} AND organization_id = ${user.organization_id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('URL update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
