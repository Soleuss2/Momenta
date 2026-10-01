# Momenta

Momenta is a private digital journal for couples to capture, organize, and revisit the moments that make their story unique.

The experience is designed around shared memories rather than metrics, with calm visual storytelling, responsive layouts, and small interactive details throughout the journal.

## Features

- Public landing page with animated sections and a click-to-open surprise envelope
- Memory highlights with filters and detail modals
- Photo and video capture workspace
- Confirmed photo and video uploads with a personal, date-sorted gallery
- Offline gallery snapshots with full photos and video previews
- Compilation studio for turning moments into a replayable story
- Shared calendar for plans and important dates
- Private diary with mood selection and editable past entries
- Weekly compilation preview
- Interactive constellation of shared memories
- Light and night themes
- Responsive layouts for desktop and mobile

## Tech Stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Framer Motion
- Lucide React
- Supabase Auth and Storage
- Exifr for embedded image capture dates

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

```bash
pnpm dev       # Start the development server
pnpm lint      # Run ESLint
pnpm build     # Create a production build
pnpm start     # Start the production server
```

## Main Routes

- `/public` - Public introduction and product experience
- `/public/auth` - Sign-in and registration preview
- `/users` - Shared memory journal
- `/users/capture` - Capture workspace
- `/users/memories` - Uploaded media gallery and offline snapshot
- `/users/studio` - Compilation studio
- `/users/calendar` - Shared calendar
- `/users/diary` - Private diary
- `/users/settings` - Journal settings

## Project Status

The capture flow uses Supabase Auth and Storage. Apply `supabase/migrations/20261001000000_captured_media.sql` to create the private `memories` bucket, per-user media table, and access policies. The browser client requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the local environment.

The offline worker is registered in production builds only. To test offline behavior locally, build and start the production app with `pnpm build` and `pnpm start` on localhost (or serve it over HTTPS). Gallery snapshots are stored per account in IndexedDB, limited to 250 MB per browser, and cleared when the user signs out. The journal highlights, compilation studio, calendar, and diary remain design previews.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.




The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
