import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/database.types";

const AUTH_ROUTES = ["/login", "/signup"];
const PROTECTED_ROUTES = ["/dashboard", "/onboarding", "/settings"];

/**
 * Refreshes the Supabase auth session on every request and enforces route
 * protection. Unauthenticated users hitting a protected route are sent to
 * /login (preserving the intended destination); authenticated users hitting an
 * auth route are sent to /dashboard.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run logic between createServerClient and getUser — it keeps the
  // session fresh and avoids hard-to-debug logout bugs.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));
  const isProtected = PROTECTED_ROUTES.some((p) => pathname.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
