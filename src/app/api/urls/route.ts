import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queries } from "@/lib/db";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user and organization from session
    const user = await queries.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const organization = await queries.getOrganizationById(user.organization_id);
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check usage limits
    if (
      organization.monthly_urls_used >= organization.monthly_url_limit &&
      organization.monthly_url_limit > 0
    ) {
      return NextResponse.json(
        {
          error: "Monthly URL limit exceeded",
          code: "LIMIT_EXCEEDED",
          message: `You have reached your monthly limit of ${organization.monthly_url_limit} URLs. Please upgrade your plan.`,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { url, customCode, domain, expiresAt  } = body;

    console.log("Creating URL with:", { url, customCode, domain, expiresAt });

    // Validation
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      const urlObj = new URL(url);
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Handle domain selection
    let domainId = null;
    let finalDomain = process.env.DEFAULT_DOMAIN || "localhost:3000";

    if (domain) {
      console.log("Looking for domain:", domain);
      // Check if domain belongs to organization and is verified
      const domainRecords = await queries.getDomainsByOrganization(organization.id);
      const selectedDomain = domainRecords.find((d) => d.domain === domain && d.verified_at);

      console.log("Available domains:", domainRecords);
      console.log("Selected domain found:", selectedDomain);

      if (selectedDomain) {
        domainId = selectedDomain.id;
        finalDomain = domain;
        console.log("Using custom domain:", finalDomain);
      } else {
        return NextResponse.json(
          {
            error: "Invalid domain",
            code: "INVALID_DOMAIN",
            message: "Domain not found or not verified for your organization",
          },
          { status: 400 }
        );
      }
    }

    // Generate short code
    let shortCode = customCode || nanoid(6);

    // Check if short code already exists
    const existingUrl = await queries.getUrlByShortCode(shortCode, organization.id);
    if (existingUrl) {
      if (customCode) {
        return NextResponse.json({ error: "Custom code already exists" }, { status: 409 });
      }
      shortCode = nanoid(8);
    }

    // Create URL record
    const newUrl = await queries.createUrl({
      organizationId: organization.id,
      originalUrl: url,
      shortCode,
      createdBy: user.id,
      domainId: domainId,
      expiresAt: expiresAt, // This should pass the expiration date
    });
    console.log("URL created:", newUrl);

    // Update usage counter
    await queries.incrementUrlUsage(organization.id);

    // Construct short URL
    const protocol = finalDomain.includes("localhost") ? "http" : "https";
    const shortUrl = `${protocol}://${finalDomain}/${shortCode}`;

    console.log("Final short URL:", shortUrl);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newUrl.id,
          originalUrl: url,
          shortCode,
          shortUrl,
          domain: finalDomain,
          createdAt: newUrl.created_at,
          clickCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("URL creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ... rest of your GET method stays the same
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await queries.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get URLs for this organization
    const urls = await queries.getUrlsByOrganization(user.organization_id, 20);

    return NextResponse.json({
      success: true,
      data: urls,
    });
  } catch (error) {
    console.error("URLs fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
