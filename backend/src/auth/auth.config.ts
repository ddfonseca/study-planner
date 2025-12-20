import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Backend URL for OAuth callbacks
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
// Frontend URL for trusted origins and redirects
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${BACKEND_URL}/api/auth/callback/google`,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: BACKEND_URL,
  basePath: '/api/auth',
  trustedOrigins: [FRONTEND_URL, BACKEND_URL],
});
