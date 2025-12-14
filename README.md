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
│   └── base44Client.ts   # Base44 API client (needs configuration)
└── lib/                  # Utilities
    └── utils.ts          # Utility functions
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure the Base44 API client:**
   - Edit `api/base44Client.ts` and add your Base44 SDK configuration
   - The current file is a placeholder and needs to be configured with your actual Base44 credentials

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

## Next Steps

1. Configure your Base44 API client in `api/base44Client.ts`
2. Set up environment variables if needed (create `.env.local`)
3. Customize the UI components as needed
4. Add any additional routes or features

## Notes

- All page components in `pages/` are client components (use hooks)
- The layout component handles navigation between pages
- React Query is set up for data fetching with auto-refresh
- The project uses path aliases (`@/`) for cleaner imports

