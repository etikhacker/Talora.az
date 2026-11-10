/**
 * Navigation-only route gate for the private admin area.
 *
 * This is NOT the source of authority: the middleware verifies the Supabase
 * Auth user before passing signedIn/isAdmin. APIs and RLS must authorize
 * operations independently. Do not expose a separate admin login screen.
 */
export function isAdminRoute(pathname: string): boolean {
  const normalized = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  return normalized === '/admin' || normalized.startsWith('/admin/');
}

/** Returns a safe local destination, or null when the admin route is allowed. */
export function adminRouteDestination(
  pathname: string,
  signedIn: boolean,
  isAdmin: boolean
): '/' | '/dashboard' | '/admin' | null {
  if (!isAdminRoute(pathname)) return null;
  if (!signedIn) return '/';
  if (!isAdmin) return '/dashboard';

  const normalized = pathname.toLowerCase().replace(/\/+$/, '');
  return normalized === '/admin/login' ? '/admin' : null;
}
