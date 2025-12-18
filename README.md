# jonghelp - Next.js Application

A Next.js application for managing and sharing aid resources in Cambodia, built with RESTAPIs for database operations.

## Project Structure

```
khmer-aid/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page route (/)
│   ├── api/              # API routes
│   │   ├── listings/     # Listings API endpoints
│   │   └── help-seekers/ # Help seekers API endpoints
│   ├── admin/
│   │   └── page.tsx       # Admin page route (/admin)
│   ├── providers.tsx      # React Query provider
│   └── globals.css        # Global styles
├── app/components/        # React components
│   ├── ui/               # shadcn/ui components
│   ├── help/             # Help-related components
│   ├── forms/            # Form components
│   └── admin/            # Admin components
├── lib/                  # Utilities
│   ├── supabase.ts       # Supabase client configuration
│   └── utils.ts          # Utility functions
├── entities/              # JSON schema definitions
│   ├── listing.json      # Listing entity schema
│   └── helpseeker.json   # Help seeker entity schema
└── api/                  # Legacy API client (if needed)
    └── supabaseClient.ts # API client
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env.local
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DIRECT_URL=your_secret_token
DATABASE_URL=your_secret_token

# Google Maps API (Optional - for map features)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Admin Configuration (Optional)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
ADMIN_PASSWORD_HASH=your_password_hash
ADMIN_TOKEN_SECRET=your_secret_token

# AI/Hugging Face (Optional - if using AI features)
HUGGINGFACE_API_KEY=your_huggingface_key
```

See `ENVIRONMENT_VARIABLES.md` for detailed setup instructions, and `SECURITY.md` for how authentication, IP blocking, and production hardening work.

### 3. Run the Development Server

```bash
npm run dev
```

### 4. Open Your Browser

- Navigate to [http://localhost:3000](http://localhost:3000) for the home page
- Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) for the admin page

## Key Features

- **Next.js 14 App Router**: Modern routing with server and client components
- **Supabase**: PostgreSQL database with real-time capabilities
- **React Query**: Data fetching and caching
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui Components**: Accessible UI component library
- **Google Maps Integration**: Interactive map for listings and help seekers

## API Endpoints

### Listings
- `GET /api/listings` - Get all listings (with filters, sorting, pagination)
- `GET /api/listings/[id]` - Get single listing
- `POST /api/listings` - Create new listing
- `PUT /api/listings/[id]` - Update listing
- `DELETE /api/listings/[id]` - Delete listing

### Help Seekers
- `GET /api/help-seekers` - Get all help seekers (with filters)
- `GET /api/help-seekers/[id]` - Get single help seeker
- `POST /api/help-seekers` - Create new help seeker
- `PUT /api/help-seekers/[id]` - Update help seeker

### Utility Endpoints
- `GET /api/debug` - Debug information and connection status
- `GET /api/health` - Health check endpoint
- `GET /api/test-db` - Database connection test

## Database Schema

The application uses Supabase (PostgreSQL) with the following tables:

- **listings**: Stores help offerings (accommodation, services, etc.)
- **help_seekers**: Stores people seeking help

See `entities/` folder for JSON schema definitions.

## Admin Authentication

The admin route (`/admin`) is protected with secure authentication.

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

- **Secure Tokens**: HMAC-SHA256 signed tokens with expiration (24 hours)
- **HTTP-Only Cookies**: Tokens stored in secure, HTTP-only cookies
- **Password Hashing**: SHA-256 hashed passwords
- **Brute Force Protection**: Delays on failed login attempts

### Access

- Navigate to `/admin/login` to access the admin panel
- Default credentials can be set via environment variables
- Logout button available in the admin header

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Data Fetching**: React Query (@tanstack/react-query)
- **Maps**: Google Maps API, Leaflet
- **Animations**: Framer Motion

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Notes

- All API routes are server-side (Next.js API routes)
- Client components use React Query for data fetching
- Supabase handles database operations and real-time updates
- The project uses path aliases (`@/`) for cleaner imports

## Migration Notes

This project has been migrated from Prisma to Supabase. See `PRISMA_TO_SUPABASE_MIGRATION.md` for migration details.

## Documentation

- `ENVIRONMENT_VARIABLES.md` - Environment variables setup guide
- `PRISMA_TO_SUPABASE_MIGRATION.md` - Migration documentation
- `entities/` - JSON schema definitions for data models
-. `SECURITY.md` - Overview of security architecture and hardening checklist

## Support

For issues or questions, please check the documentation files or create an issue in the repository.
