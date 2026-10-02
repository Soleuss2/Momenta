/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const offlineShellPaths = new Set(["/users/capture", "/users/memories"]);

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ request, sameOrigin, url: { pathname } }) =>
        sameOrigin && offlineShellPaths.has(pathname) && request.headers.get("RSC") === "1",
      handler: new NetworkFirst({
        cacheName: "momenta-offline-route-shells",
        plugins: [new ExpirationPlugin({ maxEntries: 8, maxAgeSeconds: 7 * 24 * 60 * 60 })],
      }),
    },
    {
      matcher: ({ url }) => url.origin === new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://invalid.local").origin,
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ sameOrigin, url: { pathname } }) => sameOrigin && /^\/users(?:\/|$)/.test(pathname),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();