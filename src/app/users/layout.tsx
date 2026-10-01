"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UsersLayout({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setIsAuthenticated(false);
        router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
      } else {
        setIsAuthenticated(true);
      }
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAuthenticated(false);
        router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [pathname, router, supabase]);

  // While checking auth, display a minimal loading state to avoid flashing protected content
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rose-50/50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-rose-900/60">Verifying your session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
