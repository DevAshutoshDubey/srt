import { NextRequest, NextResponse } from 'next/server';
import { queries } from '@/lib/db';
import sql from '@/lib/db';

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

    // Simulate DNS verification (in production, you'd actually check DNS records)
    const verified = await verifyDomainDNS(domain.domain);

    if (verified) {
      const verifiedDomain = await queries.verifyDomain(domainId, parseInt(organizationId));
      
      return NextResponse.json({
        success: true,
        message: 'Domain verified successfully',
        data: verifiedDomain
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Domain verification failed',
        message: 'Please ensure your DNS records are properly configured and try again.'
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

// Simulate DNS verification - in production, use actual DNS lookup
async function verifyDomainDNS(domain: string): Promise<boolean> {
  try {
    // For demo purposes, we'll simulate verification
    // In production, you would:
    // 1. Check DNS A record points to your server IP
    // 2. Check DNS CNAME points to your service
    // 3. Verify HTTP/HTTPS access works
    
    console.log(`Verifying domain: ${domain}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demo, randomly succeed/fail (or always succeed for testing)
    return true; // Change to Math.random() > 0.3 for random results
    
  } catch (error) {
    console.error('DNS verification failed:', error);
    return false;
  }
}
