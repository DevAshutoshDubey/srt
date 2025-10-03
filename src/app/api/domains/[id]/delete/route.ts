// app/api/domains/[id]/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const domainId = parseInt(resolvedParams.id);

    if (!domainId || isNaN(domainId)) {
      return NextResponse.json(
        { error: 'Invalid domain ID' },
        { status: 400 }
      );
    }

    // Get user
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

    // Check if domain exists and belongs to user's organization
    const domainResult = await sql`
      SELECT * FROM domains 
      WHERE id = ${domainId} AND organization_id = ${user.organization_id}
      LIMIT 1
    `;

    if (domainResult.length === 0) {
      return NextResponse.json(
        { error: 'Domain not found or access denied' },
        { status: 404 }
      );
    }

    const domain = domainResult[0];

    // Check if domain is being used by any URLs (using correct column name)
    const urlCountResult = await sql`
      SELECT COUNT(*) as count FROM urls 
      WHERE domain_id = ${domainId} AND organization_id = ${user.organization_id}
    `;

    const urlCount = parseInt(urlCountResult[0].count);

    if (urlCount > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete domain',
        message: `This domain is being used by ${urlCount} short URL(s). Please update or delete those URLs first.`,
        urlCount: urlCount
      }, { status: 400 });
    }

    // Delete the domain
    const deleteResult = await sql`
      DELETE FROM domains 
      WHERE id = ${domainId} AND organization_id = ${user.organization_id}
      RETURNING *
    `;

    if (deleteResult.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete domain' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Domain deleted successfully',
      data: { 
        deletedDomain: deleteResult[0].domain,
        domainId: domainId
      }
    });

  } catch (error) {
    console.error('Domain deletion error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
