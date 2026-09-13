# Momenta

Momenta is a private digital journal for couples to capture, organize, and revisit the moments that make their story unique.

The experience is designed around shared memories rather than metrics, with calm visual storytelling, responsive layouts, and small interactive details throughout the journal.

## Features

- Public landing page with animated sections and a click-to-open surprise envelope
- Memory highlights with filters and detail modals
- Photo and video capture workspace
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
- `/users/studio` - Compilation studio
- `/users/calendar` - Shared calendar
- `/users/diary` - Private diary
- `/users/settings` - Journal settings

## Project Status

Momenta is currently a front-end design preview. The journal interactions and content are local UI demonstrations; authentication, persistence, media uploads, and video generation can be connected as the product evolves.

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
