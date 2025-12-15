# Khmer Aid - Next.js Setup

This project has been set up with Next.js 14 using the App Router.

## Project Structure

```
khmer-aid/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page route (/)
│   ├── admin/
│   │   └── page.tsx       # Admin page route (/admin)
│   ├── providers.tsx      # React Query provider
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── help/             # Help-related components
│   ├── forms/            # Form components
│   └── admin/            # Admin components
├── pages/                # Page components (used by app routes)
├── api/                  # API client
│   └── supabaseClient.ts   # API client (needs configuration)
└── lib/                  # Utilities
    └── utils.ts          # Utility functions
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure the API client:**
   - The current file is a placeholder and needs to be configured with your actual Supabase credentials

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000) for the home page
   - Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) for the admin page

## Key Features

- **Next.js 14 App Router**: Modern routing with server and client components
- **React Query**: Data fetching and caching
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui Components**: Accessible UI component library

## Routes

- `/` - Home page with map and listings
- `/admin` - Admin dashboard for managing listings

## Admin Authentication

The admin route (`/admin`) is protected with secure authentication and IP blocking.

### Setup

1. **Generate password hash:**
   ```bash
   node scripts/generate-password-hash.js your_secure_password
   ```

2. **Generate token secret:**
   ```bash
   node scripts/generate-token-secret.js
   ```

3. **Add to `.env.local`:**
   ```env
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD_HASH=<generated_hash>
   ADMIN_TOKEN_SECRET=<generated_secret>
   ```

### Security Features

- **IP Blocking**: All connections from set country are automatically blocked
- **Secure Tokens**: HMAC-SHA256 signed tokens with expiration (24 hours)
- **HTTP-Only Cookies**: Tokens stored in secure, HTTP-only cookies
- **Password Hashing**: SHA-256 hashed passwords (not stored in plain text)
- **Brute Force Protection**: 1-second delay on failed login attempts

### Access

- Navigate to `/admin/login` to access the admin panel
- Default credentials can be set via environment variables
- Logout button available in the admin header

## Next Steps

1. Set up environment variables (create `.env.local`)
2. Generate admin credentials using the scripts above
3. Customize the UI components as needed
4. Add any additional routes or features

## Notes

- All page components in `pages/` are client components (use hooks)
- The layout component handles navigation between pages
- React Query is set up for data fetching with auto-refresh
- The project uses path aliases (`@/`) for cleaner imports

