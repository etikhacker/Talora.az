import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { InternshipSeatAvailability } from '@/lib/internships/seats';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createServerClient();

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('internships')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch public internships:', error.message);
    return NextResponse.json({ error: 'Failed to load internships.' }, { status: 500 });
  }

  // One aggregate RPC for all published internships. Never SELECT student
  // enrollments here: anon has no permission to inspect enrollment records.
  const { data: seatRows, error: seatError } = await supabase
    .rpc('get_public_internship_seats');
  if (seatError) {
    console.warn('Seat availability temporarily unavailable:', seatError.code);
  }
  const seats = new Map<string, InternshipSeatAvailability>(
    ((seatRows ?? []) as Array<{
      internship_id: string;
      capacity: number | null;
      active_enrollments: number;
      remaining_seats: number | null;
    }>).map((seat) => [
      seat.internship_id,
      {
        capacity: seat.capacity,
        active_enrollments: seat.active_enrollments,
        remaining_seats: seat.remaining_seats,
      },
    ]),
  );

  return NextResponse.json((data ?? []).map((internship) => ({
    ...internship,
    // null means unavailable, NOT zero seats; UI never invents counts.
    seat_availability: seats.get(internship.id) ?? null,
  })), {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
