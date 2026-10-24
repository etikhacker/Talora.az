import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabasePublicKey, getSupabaseUrl, isSupabaseConfigured } from './config';
import { isSoleAdminEmail } from '@/lib/auth/admin';

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
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const isAdminArea = isArea(pathname, '/admin');
  const isAdminLogin = pathname.toLowerCase() === '/admin/login';
  const isDashboardArea = isArea(pathname, '/dashboard');
  const isStudentAuthPage =
    pathname.toLowerCase() === '/login' || pathname.toLowerCase() === '/register';
  // The public sign-in screen must remain reachable even when auth is unavailable.
  // Redirecting /admin/login to itself otherwise causes an infinite redirect loop.
  const isProtectedArea = (isAdminArea && !isAdminLogin) || isDashboardArea;

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
    if (isAdminArea && !isAdminLogin) {
      return redirectTo(request, '/admin/login', { reason: 'setup' });
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
    return redirectTo(request, isAdminArea ? '/admin/login' : '/login', {
      reason: 'unavailable',
    });
  }

  const isAdmin = Boolean(user) && isSoleAdminEmail(user?.email);

  // Protect /dashboard
  if (isDashboardArea && !user) {
    return redirectTo(request, '/login', { redirect: pathname });
  }

  // Protect /admin (only admins can access)
  if (isAdminArea && !isAdminLogin) {
    if (!user) {
      return redirectTo(request, '/admin/login');
    }

    // The sole admin identity is checked from the verified Supabase Auth user.
    // Do not rely on a client-editable profile role for route protection.
    if (!isSoleAdminEmail(user.email)) {
      return redirectTo(request, '/dashboard', { denied: 'admin' });
    }
  }

  // An admin has no business on the student login/register screens, and a
  // signed-in student has no business on the admin login screen.
  if (isAdminLogin && user && !isAdmin) {
    return redirectTo(request, '/dashboard');
  }
  if (isStudentAuthPage && user) {
    return redirectTo(request, isAdmin ? '/admin' : '/dashboard');
  }

  return supabaseResponse;
}
