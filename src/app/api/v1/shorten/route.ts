import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { queries } from '@/lib/db';

// Rate limiting helper (simple in-memory store for demo)
const requestCounts = new Map<string, { count: number, resetTime: number }>();

function checkRateLimit(apiKey: string, maxRequests = 100, windowMs = 3600000): boolean {
  const now = Date.now();
  const key = `rate_limit_${apiKey}`;
  const current = requestCounts.get(key);

  if (!current || now > current.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

export async function POST(request: NextRequest) {
     console.log('Test route hit!');
  try {
    // Authentication
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
    console.log('=== API Debug Info ===');
    console.log('Received API Key:', apiKey);
    console.log('API Key length:', apiKey?.length);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'API key required', 
          code: 'MISSING_API_KEY',
          message: 'Include your API key in the x-api-key header'
        },
        { status: 401 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(apiKey)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.'
        },
        { status: 429 }
      );
    }

    const organization = await queries.getOrganizationByApiKey(apiKey);
    
    if (!organization) {
      return NextResponse.json(
        { 
          error: 'Invalid API key', 
          code: 'INVALID_API_KEY',
          message: 'The provided API key is not valid'
        },
        { status: 401 }
      );
    }

    // Check subscription status
    if (organization.subscription_status !== 'active') {
      return NextResponse.json(
        { 
          error: 'Subscription inactive', 
          code: 'SUBSCRIPTION_INACTIVE',
          message: 'Your subscription is not active. Please update your billing.'
        },
        { status: 403 }
      );
    }

    // Check usage limits
    if (organization.monthly_urls_used >= organization.monthly_url_limit && organization.monthly_url_limit > 0) {
      return NextResponse.json(
        { 
          error: 'Monthly URL limit exceeded', 
          code: 'LIMIT_EXCEEDED',
          message: `You have reached your monthly limit of ${organization.monthly_url_limit} URLs. Please upgrade your plan.`
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { url, customCode, domain, expiresAt } = body;

    // Validation
    if (!url) {
      return NextResponse.json(
        { 
          error: 'URL is required', 
          code: 'MISSING_URL',
          message: 'Please provide a valid URL to shorten'
        },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { 
          error: 'Invalid URL format', 
          code: 'INVALID_URL',
          message: 'Please provide a valid HTTP or HTTPS URL'
        },
        { status: 400 }
      );
    }

    // Validate custom code if provided
    if (customCode && (customCode.length < 3 || customCode.length > 20 || !/^[a-zA-Z0-9-_]+$/.test(customCode))) {
      return NextResponse.json(
        { 
          error: 'Invalid custom code', 
          code: 'INVALID_CUSTOM_CODE',
          message: 'Custom code must be 3-20 characters long and contain only letters, numbers, hyphens, and underscores'
        },
        { status: 400 }
      );
    }

    // Handle domain selection
    let domainId = null;
    let finalDomain = process.env.DEFAULT_DOMAIN || 'localhost:3000';

    if (domain) {
      // Check if domain belongs to organization and is verified
      const domainRecord = await queries.getDomainsByOrganization(organization.id);
      const selectedDomain = domainRecord.find(d => d.domain === domain && d.verified_at);
      
      if (selectedDomain) {
        domainId = selectedDomain.id;
        finalDomain = domain;
      } else {
        return NextResponse.json(
          { 
            error: 'Invalid domain', 
            code: 'INVALID_DOMAIN',
            message: 'Domain not found or not verified for your organization'
          },
          { status: 400 }
        );
      }
    }

    // Generate short code
    let shortCode = customCode || nanoid(6);

    // Check if short code already exists for this organization/domain
    const existingUrl = await queries.getUrlByShortCode(shortCode, organization.id);
    if (existingUrl) {
      if (customCode) {
        return NextResponse.json(
          { 
            error: 'Custom code already exists', 
            code: 'CODE_EXISTS',
            message: `The custom code "${customCode}" is already in use. Please choose a different one.`
          },
          { status: 409 }
        );
      }
      // Generate a longer code if random code conflicts
      shortCode = nanoid(8);
    }

    // Create URL record
    const newUrl = await queries.createUrl({
      organizationId: organization.id,
      originalUrl: url,
      shortCode,
      domainId: domainId,
      expiresAt: expiresAt || null
    });

    // Update usage counter
    await queries.incrementUrlUsage(organization.id);

    // Construct short URL
    const protocol = finalDomain.includes('localhost') ? 'http' : 'https';
    const shortUrl = `${protocol}://${finalDomain}/${shortCode}`;

    return NextResponse.json({
      success: true,
      data: {
        id: newUrl.id,
        originalUrl: url,
        shortCode,
        shortUrl,
        domain: finalDomain,
        createdAt: newUrl.created_at,
        expiresAt: newUrl.expires_at,
        clickCount: 0
      }
    }, { status: 201 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again later.'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve URL info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shortCode = searchParams.get('code');
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required', code: 'MISSING_API_KEY' },
        { status: 401 }
      );
    }

    if (!shortCode) {
      return NextResponse.json(
        { error: 'Short code required', code: 'MISSING_CODE' },
        { status: 400 }
      );
    }

    const organization = await queries.getOrganizationByApiKey(apiKey);
    if (!organization) {
      return NextResponse.json(
        { error: 'Invalid API key', code: 'INVALID_API_KEY' },
        { status: 401 }
      );
    }

    const url = await queries.getUrlByShortCode(shortCode, organization.id);
    if (!url) {
      return NextResponse.json(
        { error: 'Short URL not found', code: 'URL_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: url.id,
        originalUrl: url.original_url,
        shortCode: url.short_code,
        clickCount: url.click_count,
        createdAt: url.created_at,
        expiresAt: url.expires_at
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
