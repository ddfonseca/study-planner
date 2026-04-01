# Cross-Domain Authentication Solution

## Problem

When deploying frontend and backend to different domains (e.g. Netlify and Fly.io), OAuth authentication fails due to **third-party cookie blocking** by modern browsers.

### The Problem

1. Frontend hosted at `shiphours.io` (via Netlify)
2. Backend hosted at `shiphours-api.fly.dev` (via Fly.io)
3. When the user authenticates via Google OAuth:
   - The session cookie is set on the backend domain (`fly.dev`)
   - When the frontend tries to read the session, the browser blocks the cookie as it comes from a different domain (third-party cookie)
4. Result: `getSession()` returns `null` even after a successful login

### Common Errors

- `state_mismatch` error during the OAuth callback
- `getSession()` returning `null` after a successful OAuth login
- Cookies not being sent in cross-origin requests

## Solution: Netlify Proxy

Instead of making cross-domain requests, we route all API calls through the Netlify proxy. This way:

- All requests appear to come from the same domain
- Cookies are set on the frontend domain
- No third-party cookie issues

### Architecture

```
Before (broken):
┌─────────────────┐    Direct API calls       ┌─────────────────┐
│    Frontend     │ ─────────────────────────▶│    Backend      │
│   (Netlify)     │  (cross-domain = blocked) │   (Fly.io)      │
│  shiphours.io   │                           │   *.fly.dev     │
└─────────────────┘                           └─────────────────┘

After (working):
┌─────────────────┐    /api/* requests        ┌─────────────────┐
│    Frontend     │ ─────────────────────────▶│ Netlify Proxy   │
│   (Netlify)     │  (same domain = ok)       │                 │
│  shiphours.io   │                           └────────┬────────┘
└─────────────────┘                                    │
                                                       │ Proxied to
                                                       ▼
                                              ┌─────────────────┐
                                              │    Backend      │
                                              │   (Fly.io)      │
                                              │   *.fly.dev     │
                                              └─────────────────┘
```

## Configuration

### 1. Netlify Configuration (`frontend/netlify.toml`)

```toml
[build]
  base = "frontend"
  command = "npm install && npm run build"
  publish = "dist"

[build.environment]
  # Empty string = use same domain (Netlify proxy)
  VITE_API_BASE_URL = ""
  VITE_FRONTEND_URL = "https://shiphours.io"

# Proxy API requests to the Fly.io backend (MUST come before the catch-all)
[[redirects]]
  from = "/api/*"
  to = "https://shiphours-api.fly.dev/api/:splat"
  status = 200
  force = true
  headers = {X-Forwarded-Host = "shiphours.io"}

# SPA fallback (catch-all for client-side routing)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. Frontend API Client (`frontend/src/lib/api/client.ts`)

```typescript
// In production: empty string (uses Netlify proxy on the same domain)
// In development: undefined, falls back to localhost
const envApiUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = envApiUrl !== undefined ? envApiUrl : 'http://localhost:3000';
```

### 3. Backend Auth Configuration (`backend/src/auth/auth.config.ts`)

```typescript
// Frontend URL — all requests go through the Netlify proxy (same domain)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const auth = betterAuth({
  // ...
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // OAuth callback goes through the Netlify proxy (same domain as frontend)
      redirectURI: `${FRONTEND_URL}/api/auth/callback/google`,
    },
  },
  // Use the frontend URL since all requests come through the Netlify proxy
  baseURL: FRONTEND_URL,
  basePath: '/api/auth',
  trustedOrigins: [FRONTEND_URL, BACKEND_URL],
});
```

### 4. Google Cloud Console

Add the redirect URI that goes through Netlify:

```
https://shiphours.io/api/auth/callback/google
```

## How It Works

1. **User clicks "Sign in with Google"**
   - Frontend calls `/api/auth/signin/google`
   - Netlify proxies to `https://shiphours-api.fly.dev/api/auth/signin/google`

2. **Google OAuth flow**
   - User authenticates with Google
   - Google redirects to `https://shiphours.io/api/auth/callback/google`
   - Netlify proxies to `https://shiphours-api.fly.dev/api/auth/callback/google`

3. **Session cookie is set**
   - Backend creates the session and sets the cookie
   - Because the request came through the Netlify proxy, the cookie domain is `shiphours.io`
   - Cookie is now first-party (same domain as the frontend)

4. **Subsequent requests**
   - Frontend calls `/api/auth/get-session`
   - Browser sends the cookie (same domain)
   - Netlify proxies to the backend
   - Backend reads the cookie and returns the session

## Development vs Production

| Environment | `VITE_API_BASE_URL` | API calls go to |
|-------------|---------------------|-----------------|
| Development | `undefined` (not set) | `http://localhost:3000` |
| Production  | `""` (empty string)   | Same domain (Netlify proxy) |

## Troubleshooting

### "state_mismatch" error
- Verify that the OAuth redirect URI in Google Cloud Console matches exactly:
  `https://shiphours.io/api/auth/callback/google`

### `getSession()` returns null
- Check DevTools > Application > Cookies
- Confirm the cookie domain matches the frontend domain
- Ensure `credentials: 'include'` is set in fetch options

### API calls going to the wrong URL
- Check the `VITE_API_BASE_URL` environment variable in the Netlify dashboard
- Confirm it is set to an empty string `""`, not absent

### Proxy not working
- Ensure the proxy redirect rule is BEFORE the SPA catch-all redirect
- Check the Netlify deploy logs for the redirects configuration
