// Configure global proxy agent for all HTTP/HTTPS requests
// This must be done before importing NextAuth to ensure proxy is active
// @ts-ignore - global-agent doesn't have TypeScript types
import { bootstrap } from 'global-agent';

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;

if (proxyUrl) {
  // Set environment variables for global-agent
  process.env.GLOBAL_AGENT_HTTP_PROXY = proxyUrl;
  process.env.GLOBAL_AGENT_HTTPS_PROXY = proxyUrl;
  // Bootstrap global-agent to enable proxy for all HTTP/HTTPS requests
  bootstrap();
}

import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // Note: Proxy is handled automatically via HTTPS_PROXY/HTTP_PROXY environment variables
      // Node.js and the underlying HTTP libraries will use these automatically
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Add user ID to session
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // After sign in, redirect to dashboard
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard`;
      }
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'development-secret-change-in-production'),
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

