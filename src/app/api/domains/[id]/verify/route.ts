// api/domains/[id]/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyDomainDNS } from '@/lib/domain-verification';

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

    // Get domain info
    const domainResult = await sql`
      SELECT * FROM domains 
      WHERE id = ${domainId} AND organization_id = ${organizationId}
      LIMIT 1
    `;

    if (domainResult.length === 0) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    const domain = domainResult[0];

    // Update verification attempts
    await sql`
      UPDATE domains 
      SET verification_attempts = verification_attempts + 1,
          last_verification_attempt = NOW()
      WHERE id = ${domainId}
    `;

    // Perform actual DNS verification
    const verificationResult = await verifyDomainDNS(domain.domain);

    if (verificationResult.isVerified) {
      // Update domain as verified
      const verifiedDomain = await sql`
        UPDATE domains 
        SET verified_at = NOW(), 
            is_active = true,
            verification_method = ${verificationResult.method}
        WHERE id = ${domainId}
        RETURNING *
      `;
      
      return NextResponse.json({
        success: true,
        message: `Domain verified successfully via ${verificationResult.method}`,
        data: {
          domain: verifiedDomain[0],
          verification: verificationResult
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Domain verification failed',
        message: verificationResult.details.error || 'DNS configuration not found',
        details: verificationResult.details
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Domain verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
