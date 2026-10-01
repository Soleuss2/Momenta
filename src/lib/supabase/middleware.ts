import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { rateLimiter } from "@/lib/rate-limiter";

export async function updateSession(request: NextRequest) {
  // 1. Rate Limiting Check
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
  const isUsersRoute = request.nextUrl.pathname.startsWith("/users");

  // Apply stricter limits to auth routes (15 req/min) to prevent brute force; 90 req/min for general app
  const limit = isAuthRoute ? 15 : 90;
  const windowMs = 60 * 1000;
  const rateLimitResult = rateLimiter.check(`${ip}:${isAuthRoute ? "auth" : "app"}`, limit, windowMs);

  if (!rateLimitResult.allowed) {
    const retrySec = Math.ceil(rateLimitResult.resetInMs / 1000);
    return new NextResponse(
      JSON.stringify({
        error: "Too many requests. Please slow down.",
        retryAfter: retrySec,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retrySec),
        },
      }
    );
  }

  // 2. Supabase Session Management
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // If environment variables are missing during setup, pass through gracefully
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do not run getUser inside middleware on static files or assets.
  // Refresh the session token — this keeps auth cookies active
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Protected Route Gating for /users
  if (!user && isUsersRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 4. Redirect already logged-in users away from /auth to /users
  if (user && request.nextUrl.pathname === "/auth") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/users";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}