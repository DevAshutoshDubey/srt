import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (session) {
      // Log the sign out for security purposes
      console.log(`User ${session.user.email} signed out at ${new Date().toISOString()}`);
      
      // You could add additional cleanup here if needed
      // For example, invalidate API tokens, log audit events, etc.
    }

    return NextResponse.json({
      success: true,
      message: 'Signed out successfully'
    });

  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { error: 'Sign out failed' },
      { status: 500 }
    );
  }
}
