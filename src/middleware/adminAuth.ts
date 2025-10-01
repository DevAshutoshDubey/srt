import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queries } from '@/lib/db';

export async function requireSuperAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const user = await queries.getUserByEmail(session.user.email);
  
  if (!user || user.admin_level !== 'super_admin') {
    return NextResponse.json(
      { error: 'Super admin access required' },
      { status: 403 }
    );
  }

  return { user, session };
}

export async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const user = await queries.getUserByEmail(session.user.email);
  
  if (!user || !['admin', 'super_admin'].includes(user.admin_level)) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  return { user, session };
}
