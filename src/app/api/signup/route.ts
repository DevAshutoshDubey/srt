import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queries } from '@/lib/db';
import { generateApiKey, createSlug } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const {
      organizationName,
      firstName,
      lastName,
      email,
      password
    } = await request.json();

    // Validation
    if (!organizationName || !firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await queries.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create organization
    const orgSlug = createSlug(organizationName);
    const apiKey = generateApiKey();
    
    const organization = await queries.createOrganization({
      name: organizationName,
      slug: orgSlug,
      email: email,
      apiKey: apiKey
    });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await queries.createUser({
      organizationId: organization.id,
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'owner'
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      data: {
        userId: user.id,
        organizationId: organization.id,
        organizationName: organization.name,
        apiKey: organization.api_key
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
