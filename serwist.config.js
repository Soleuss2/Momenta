// @ts-check
import { spawnSync } from "node:child_process";
import { serwist } from "@serwist/next/config";

const revision = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout ?? crypto.randomUUID();

export default serwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [
    { url: "/", revision },
    { url: "/users/capture", revision },
    { url: "/users/memories", revision },
  ],
});