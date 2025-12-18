# Security Guide

This document explains **how JongHelp handles security** and what you **must configure before running in development or production**.

## 1. Quick start: secure local setup

Create a `.env.local` file in the project root (do **not** commit it) with at least:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Admin authentication (required for /admin)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_strong_password
ADMIN_TOKEN_SECRET=long_random_secret_string

# Optional: enable IP-based restrictions for admin
ENABLE_IP_BLOCKING=false
```

- **Change the default admin password**: the code ships with a default password (`0123456789`) as a fallback; always override it using `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH`.
- For production, use a long, random `ADMIN_TOKEN_SECRET` and store all secrets only in your hosting provider’s environment settings (e.g. Netlify, Vercel).

## 2. Security architecture overview

### 2.1 Supabase access (`lib/supabase.ts`)

- **Client Supabase**:
  - Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Runs in the **browser** and is limited by Supabase Row Level Security (RLS) rules you configure in Supabase.
- **Server Supabase** (`getSupabaseServerClient`):
  - Uses `SUPABASE_SERVICE_ROLE_KEY` and bypasses RLS by design.
  - Must only be used in **server-side code** (API routes / server components), never in client components.
  - If `SUPABASE_SERVICE_ROLE_KEY` is missing in production, the app will throw on startup to avoid unsafe behavior.

### 2.2 Admin authentication (`app/api/admin/*`, `middleware.ts`)

- Login flow:
  - `POST /api/admin/login` validates `ADMIN_USERNAME` and password (hashed with SHA‑256).
  - On success, it issues a **signed token** (HMAC‑SHA256, using `ADMIN_TOKEN_SECRET`) encoded as base64.
  - The token is stored in an **HTTP‑only cookie** `admin_token` with `sameSite='strict'` and 24‑hour expiry.
- Middleware protection:
  - `middleware.ts` protects all `/admin/*` routes.
  - If there is no valid `admin_token`, the user is redirected to `/admin/login`.
  - Token signatures and expiry are validated in both middleware and `GET /api/admin/verify`.
- Logout:
  - `POST /api/admin/logout` clears the `admin_token` cookie.

### 2.3 Optional IP / country restrictions (admin)

- When `ENABLE_IP_BLOCKING=true`, `middleware.ts`:
  - Derives the real client IP from standard proxy headers (`x-nf-client-connection-ip`, `x-forwarded-for`, etc.).
  - Calls `http://ip-api.com` to obtain a country code.
  - **Blocks Thailand (`TH`)** for admin routes if confidently detected.
  - Uses a **fail-open policy**: if the geolocation API fails, access is allowed to avoid blocking legitimate users.
- You can bypass IP checks temporarily with `?bypass_ip_check=true` on admin URLs (intended only for debugging).

## 3. Security‑relevant environment variables

- **`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`**  
  Public values required for the browser Supabase client; still treat them as configuration, not as secrets.
- **`SUPABASE_SERVICE_ROLE_KEY`**  
  Highly privileged Supabase key; **must never be exposed to the browser**. Only used in `lib/supabase.ts` on the server.
- **`ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_PASSWORD_HASH`**  
  Admin credentials for `/admin`. Prefer `ADMIN_PASSWORD_HASH` (SHA‑256 hash) in production.
- **`ADMIN_TOKEN_SECRET`**  
  Secret used to sign admin tokens; use a long, random value (32+ bytes).
- **`ENABLE_IP_BLOCKING`**  
  Controls whether admin IP/country checks are enforced (`true` / `false`).
- **Third‑party keys** (Google Maps, AI, etc.)  
  Keep all API keys in environment variables and never hard‑code them in components.

See `README.md` for a full list of environment variables and how to generate hashes/secrets.

## 4. Production hardening checklist

Before putting this app in production, ensure you have:

- **Secrets configured only in the host environment** (Netlify/Vercel/etc.), not in the repo.
- **Unique, strong admin credentials** with `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH` set (never use the default password).
- A long, random **`ADMIN_TOKEN_SECRET`** and `NODE_ENV=production` so cookies are marked `secure`.
- **Supabase RLS policies** configured for `listings` and `help_seekers` tables, especially for any public‑facing reads/writes.
- Debug/test endpoints (`/api/debug`, `/api/test-db`, `/api/listings/test*`) reviewed, locked down, or disabled for production if they expose internal details.
- HTTPS enabled at the hosting layer so admin cookies are never sent over plain HTTP.
- Logging configured to **avoid storing sensitive data** (passwords, full tokens, or PII) in application logs.

## 5. Data privacy & third‑party services

- **Supabase** stores listings and help‑seeker data; review what fields are considered personal or sensitive in your deployment context.
- **IP geolocation (`ip-api.com`)** is only called during admin access checks when IP blocking is enabled; visitors’ IPs are sent to that service.
- **Google Maps** and **Google Analytics** (if configured) may collect usage/telemetry data according to their own policies; update your public privacy notice accordingly.

Use this guide as a starting point, and adapt it to your organization’s security and compliance requirements.


