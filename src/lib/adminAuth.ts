// lib/adminAuth.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function requireSuperAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  // Get user with admin level
  const userResult = await sql`
    SELECT id, email, admin_level, first_name, last_name
    FROM users 
    WHERE email = ${session.user.email}
    LIMIT 1
  `;

  if (userResult.length === 0) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  const user = userResult[0];

  if (user.admin_level !== 'super_admin') {
    return NextResponse.json(
      { error: 'Insufficient permissions. Super admin access required.' },
      { status: 403 }
    );
  }

  return user;
}

export async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  // Get user with admin level
  const userResult = await sql`
    SELECT id, email, admin_level, first_name, last_name
    FROM users 
    WHERE email = ${session.user.email}
    LIMIT 1
  `;

  if (userResult.length === 0) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  const user = userResult[0];

  // Allow both admin and super_admin
  if (user.admin_level !== 'admin' && user.admin_level !== 'super_admin') {
    return NextResponse.json(
      { error: 'Insufficient permissions. Admin access required.' },
      { status: 403 }
    );
  }

  return user;
}
