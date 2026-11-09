import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { InternshipSeatAvailability } from '@/lib/internships/seats';

export const dynamic = 'force-dynamic';

/** No service-role key or student identity is exposed in the public response. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid internship id' }, { status: 400 });
  }

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const { data, error } = await supabase.rpc('get_public_internship_seats', {
    p_internship_id: id,
  });
  if (error) {
    console.error('Seat availability failed:', error.code);
    return NextResponse.json({ error: 'Seat availability unavailable' }, { status: 503 });
  }

  const record = ((data ?? []) as Array<{
    internship_id: string;
    capacity: number | null;
    active_enrollments: number;
    remaining_seats: number | null;
  }>)[0];
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const availability: InternshipSeatAvailability = {
    capacity: record.capacity,
    active_enrollments: record.active_enrollments,
    remaining_seats: record.remaining_seats,
  };
  return NextResponse.json(availability, { headers: { 'Cache-Control': 'no-store' } });
}
