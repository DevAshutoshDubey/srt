import { requireSuperAdmin } from '@/lib/adminAuth';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin(request);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Return the error response
  }

  const { user } = authResult;

  return NextResponse.json({
    success: true,
    adminLevel: user.admin_level,
    user: {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`
    }
  });
}
