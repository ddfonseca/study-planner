import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Frontend URL - all requests go through Netlify proxy (same domain)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
// Backend URL for internal reference
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  // Email/password auth - enabled for all environments
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // OAuth callback goes through Netlify proxy (same domain as frontend)
      redirectURI: `${FRONTEND_URL}/api/auth/callback/google`,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: FRONTEND_URL,
  basePath: '/api/auth',
  trustedOrigins: [FRONTEND_URL, BACKEND_URL],
});
