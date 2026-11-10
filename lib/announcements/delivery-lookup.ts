/** A delivery may be resumed by its announcement ID or publish request ID.
 * Both identifiers are server-validated and resolved against the same
 * admin-only announcement record before any email jobs are claimed.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export type AnnouncementDeliveryLookup =
  | { column: 'id'; value: string; expectedId: string | null }
  | { column: 'request_id'; value: string; expectedId: string | null };

export function parseAnnouncementDeliveryLookup(value: unknown): AnnouncementDeliveryLookup | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const id = typeof input.id === 'string' && UUID_PATTERN.test(input.id.trim())
    ? input.id.trim().toLowerCase()
    : null;
  const requestId = typeof input.requestId === 'string' && UUID_PATTERN.test(input.requestId.trim())
    ? input.requestId.trim().toLowerCase()
    : null;
  // An announcement's unique request ID is the authoritative fallback when
  // the client receives an unexpected/missing announcement ID.
  if (requestId) return { column: 'request_id', value: requestId, expectedId: id };
  if (id) return { column: 'id', value: id, expectedId: id };
  return null;
}
