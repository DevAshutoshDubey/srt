import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/adminAuth';
import { queries } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const stats = await queries.getSystemStats();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system stats' },
      { status: 500 }
    );
  }
}
