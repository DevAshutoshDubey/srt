import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      organizationId: number;
      organizationSlug: string;
      organizationName: string;
      apiKey: string;
      role: string;
    };
  }

  interface User {
    organizationId: number;
    organizationSlug: string;
    organizationName: string;
    apiKey: string;
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    organizationId: number;
    organizationSlug: string;
    organizationName: string;
    apiKey: string;
    role: string;
  }
}
