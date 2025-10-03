// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { queries } from './db';
import sql from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await queries.getUserByEmail(credentials.email);
          
          if (!user) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isValidPassword) {
            return null;
          }

          // Update last login timestamp
          await sql`
            UPDATE users 
            SET last_login = NOW() 
            WHERE id = ${user.id}
          `;

          return {
            id: user.id.toString(),
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            organizationId: user.organization_id,
            organizationSlug: user.organization_slug,
            organizationName: user.organization_name,
            apiKey: user.api_key,
            role: user.role,
            adminLevel: user.admin_level || 'user' // ADD THIS
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.organizationId = user.organizationId;
        token.organizationSlug = user.organizationSlug;
        token.organizationName = user.organizationName;
        token.apiKey = user.apiKey;
        token.role = user.role;
        token.adminLevel = user.adminLevel ?? ''; // ADD THIS
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.organizationId = token.organizationId as number;
        session.user.organizationSlug = token.organizationSlug as string;
        session.user.organizationName = token.organizationName as string;
        session.user.apiKey = token.apiKey as string;
        session.user.role = token.role as string;
        session.user.adminLevel = token.adminLevel as string; // ADD THIS
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
};
