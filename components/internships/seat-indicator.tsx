import { Users } from 'lucide-react';
import { availableSeatLabel, type InternshipSeatAvailability } from '@/lib/internships/seats';

export function InternshipSeatIndicator({
  availability,
  isAz,
  compact = false,
}: {
  availability: InternshipSeatAvailability | null | undefined;
  isAz: boolean;
  compact?: boolean;
}) {
  const label = availableSeatLabel(availability, isAz);
  if (!label) return null;
  const full = availability?.remaining_seats === 0;
  return (
    <span
      role="status"
      aria-label={isAz ? 'Qalan yerlər: ' + label : 'Available seats: ' + label}
      className={`inline-flex items-center gap-1.5 font-semibold ${compact ? 'text-xs' : 'text-sm'} ${
        full ? 'text-rose-700' : 'text-emerald-700'
      }`}
    >
      <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}
