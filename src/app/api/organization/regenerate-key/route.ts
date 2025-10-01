import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queries } from '@/lib/db';
import { generateApiKey } from '@/lib/utils';
import sql from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await queries.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new API key
    const newApiKey = generateApiKey();

    // Update organization with new API key
    const result = await sql`
      UPDATE organizations 
      SET api_key = ${newApiKey}, updated_at = NOW()
      WHERE id = ${user.organization_id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { apiKey: newApiKey },
      message: 'API key regenerated successfully'
    });

  } catch (error) {
    console.error('API key regeneration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
