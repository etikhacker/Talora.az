import { NextResponse, type NextRequest } from 'next/server';
import { isCoursesEnabled } from './lib/features/courses';
import { updateSession } from './lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Keep unlaunched Courses pages inaccessible if preview points to production DB.
  if (!isCoursesEnabled) {
    const path = request.nextUrl.pathname;
    if (/^\/admin\/courses(?:\/|$)/.test(path)) {
      return NextResponse.redirect(new URL('/admin', request.url), 307);
    }
    if (/^\/dashboard\/courses(?:\/|$)/.test(path)) {
      return NextResponse.redirect(new URL('/dashboard', request.url), 307);
    }
    if (/^\/(?:courses|learn)(?:\/|$)/.test(path)) {
      return NextResponse.redirect(new URL('/internships', request.url), 307);
    }
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, svg, icons
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
