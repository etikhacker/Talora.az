import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabasePublicKey, getSupabaseUrl, isSupabaseConfigured } from './config';
import { isSoleAdminEmail } from '@/lib/auth/admin';
import { adminRouteDestination, isAdminRoute } from '@/lib/auth/admin-route-gate';

/**
 * Route helpers.
 *
 * Everything is matched case-insensitively and with a trailing-slash tolerant
 * prefix test, so `/Admin`, `/ADMIN/students` and `/admin/./students` cannot be
 * used to slip past a check that only looks for the lowercase `/admin`.
 * Next.js matches routes case-sensitively on Linux, but a proxy, a CDN or a
 * future `trailingSlash` change must not be what keeps the admin area closed.
 */
function isArea(pathname: string, area: string): boolean {
  const p = pathname.toLowerCase();
  return p === area || p.startsWith(`${area}/`);
}

function redirectTo(request: NextRequest, pathname: string, extra?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      url.searchParams.set(key, value);
    }
  }
  const response = NextResponse.redirect(url);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const isAdminArea = isAdminRoute(pathname);
  const isDashboardArea = isArea(pathname, '/dashboard');
  const isStudentAuthPage =
    pathname.toLowerCase() === '/login' || pathname.toLowerCase() === '/register';
  // Every /admin path, including the legacy /admin/login URL, is private.
  // Admins authenticate through the shared /login page instead.
  const isProtectedArea = isAdminArea || isDashboardArea;

  /* ---------------------------------------------------------------------
   * Fail CLOSED.
   *
   * The previous version returned the response untouched whenever Supabase
   * was not configured ("let requests pass through"). That made /admin and
   * /dashboard render for anonymous visitors on any deployment missing the
   * env vars: the client guard then only had a session to look at, and the
   * page shell was served. A misconfigured deployment must show the login
   * screen, never the console.
   * ------------------------------------------------------------------- */
  if (!isSupabaseConfigured()) {
    if (isAdminArea) {
      return redirectTo(request, '/');
    }
    if (isDashboardArea) {
      return redirectTo(request, '/login', { reason: 'setup' });
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    getSupabaseUrl()!,
    getSupabasePublicKey()!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() validates the JWT against the auth server on every request. It is
  // never derived from a client-supplied cookie value or from the profiles
  // table, both of which a signed-in student can write to.
  let user: { email?: string | null } | null = null;
  let authUnavailable = false;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // An invalid/expired token is an ordinary anonymous visit. A transport
      // failure is not: we cannot tell a real admin from an impostor, so we
      // treat the protected areas as closed instead of open.
      authUnavailable = !/invalid|expired|not found|jwt/i.test(error.message);
    }
    user = data?.user ?? null;
  } catch {
    authUnavailable = true;
  }

  if (isProtectedArea && authUnavailable) {
    // Don't reveal a separate admin entry point on auth outages.
    if (isAdminArea) return redirectTo(request, '/');
    return redirectTo(request, '/login', { reason: 'unavailable' });
  }

  const isAdmin = Boolean(user) && isSoleAdminEmail(user?.email);

  // Protect /dashboard
  if (isDashboardArea && !user) {
    return redirectTo(request, '/login', { redirect: pathname });
  }

  // Identity is verified through Auth.getUser(), not browser-supplied profile
  // metadata. Unauthenticated visitors see the public homepage, students
  // return to their dashboard, and only the admin reaches the private console.
  const adminDestination = adminRouteDestination(pathname, Boolean(user), isAdmin);
  if (adminDestination) return redirectTo(request, adminDestination);

  // An authenticated user has no need for the public login/register pages.
  if (isStudentAuthPage && user) {
    return redirectTo(request, isAdmin ? '/admin' : '/dashboard');
  }

  return supabaseResponse;
}
