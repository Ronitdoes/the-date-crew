import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Safe fallbacks to prevent build-time crashes if environment variables are not yet loaded
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedPath =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/customer");

  const isAuthPath = request.nextUrl.pathname === "/login";

  // Redirect registration routes to login page
  if (
    request.nextUrl.pathname === "/register" ||
    request.nextUrl.pathname === "/register/verify"
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect to login if accessing protected pages without auth
  if (!user && isProtectedPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect to dashboard if logged in and trying to access auth pages
  if (user && isAuthPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  // Intercept all routes except static assets
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|hero.avif|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
