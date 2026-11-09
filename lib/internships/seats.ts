import type { Internship } from '@/types/database';

/** Safe public aggregate; no student or enrollment identifiers are exposed. */
export interface InternshipSeatAvailability {
  capacity: number | null;
  active_enrollments: number;
  remaining_seats: number | null;
}

export interface PublicInternship extends Internship {
  seat_availability?: InternshipSeatAvailability | null;
}

export function availableSeatLabel(
  seat: InternshipSeatAvailability | null | undefined,
  isAz: boolean,
): string | null {
  if (!seat) return null;
  if (seat.capacity === null) {
    return isAz ? 'Yer məhdudiyyəti yoxdur' : 'Unlimited seats';
  }
  if (seat.remaining_seats === null) return null;
  if (seat.remaining_seats === 0) return isAz ? 'Yer qalmayıb' : 'No seats left';
  return isAz
    ? `${seat.remaining_seats} yer qalıb / ${seat.capacity}`
    : `${seat.remaining_seats} of ${seat.capacity} seats left`;
}
