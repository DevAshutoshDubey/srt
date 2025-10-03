// api/domains/[id]/generate-txt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { generateVerificationCode } from '@/lib/domain-verification';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const domainId = parseInt(resolvedParams.id);
    const organizationId = request.headers.get('x-organization-id');
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 401 }
      );
    }

    if (!domainId || isNaN(domainId)) {
      return NextResponse.json(
        { error: 'Invalid domain ID' },
        { status: 400 }
      );
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Update domain with verification code
    const updatedDomain = await sql`
      UPDATE domains 
      SET verification_code = ${verificationCode},
          verification_method = 'TXT'
      WHERE id = ${domainId} AND organization_id = ${organizationId}
      RETURNING *
    `;

    if (updatedDomain.length === 0) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        domain: updatedDomain[0].domain,
        verificationCode,
        txtRecord: {
          host: `_verification.${updatedDomain[0].domain}`,
          value: `shortener-verification=${verificationCode}`
        }
      }
    });

  } catch (error) {
    console.error('TXT generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
