import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queries } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user details from database
    const user = await queries.getUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get organization details
    const organization = await queries.getOrganizationById(user.organization_id);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          adminLevel: user.admin_level,
          createdAt: user.created_at,
        },
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          subscriptionTier: organization.subscription_tier,
          subscriptionStatus: organization.subscription_status,
          monthlyUrlsUsed: organization.monthly_urls_used,
          monthlyUrlLimit: organization.monthly_url_limit,
          apiKey: organization.api_key,
          createdAt: organization.created_at,
        },
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { firstName, lastName } = await request.json();

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
    }

    // Update user profile
    const updatedUser = await queries.updateUserProfile(session.user.email, {
      firstName,
      lastName,
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
