import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isSoleAdminEmail } from '@/lib/auth/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: NextRequest) {
  const session = await createClient();
  if (!session) return NextResponse.json({ error: 'Konfiqurasiya xətası.' }, { status: 503, headers });
  const { data, error } = await session.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: 'Sessiya tələb olunur.' }, { status: 401, headers });
  if (!isSoleAdminEmail(data.user.email)) {
    return NextResponse.json({ error: 'İcazə yoxdur.' }, { status: 403, headers });
  }
  const admin = await createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Konfiqurasiya xətası.' }, { status: 503, headers });

  const search = (request.nextUrl.searchParams.get('search') || '').trim();
  if (search.length > 80) {
    return NextResponse.json({ error: 'Axtarış çox uzundur.' }, { status: 400, headers });
  }

  const base = () => admin.from('profiles').select('id,full_name,email')
    .eq('role', 'student').order('full_name', { ascending: true }).limit(40);
  if (!search) {
    const { data: students, error: readError } = await base();
    if (readError) return NextResponse.json({ error: 'Tələbə siyahısı yüklənmədi.' }, { status: 500, headers });
    return NextResponse.json({ students: students || [] }, { headers });
  }

  // Two bound PostgREST filters; never interpolate user input into a raw .or expression.
  const escaped = search.replace(/[%_\\]/g, '\\$&');
  const pattern = `%${escaped}%`;
  const [names, emails] = await Promise.all([
    base().ilike('full_name', pattern),
    base().ilike('email', pattern),
  ]);
  if (names.error || emails.error) {
    return NextResponse.json({ error: 'Tələbə axtarışı alınmadı.' }, { status: 500, headers });
  }
  const students = Array.from(new Map(
    [...(names.data || []), ...(emails.data || [])].map(student => [student.id, student])
  ).values()).sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'az')).slice(0, 40);
  return NextResponse.json({ students }, { headers });
}
