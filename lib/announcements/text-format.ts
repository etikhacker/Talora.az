export type AnnouncementTextBlock =
  | { kind: 'paragraph'; lines: string[] }
  | { kind: 'ordered' | 'unordered'; items: string[] };

/**
 * Preserve deliberate paragraph breaks and signature lines.
 * Visual wrapping must be performed by the recipient's email client, not
 * by injecting newlines at a fixed column width.
 */
export function parseAnnouncementText(body: string): AnnouncementTextBlock[] {
  const result: AnnouncementTextBlock[] = [];
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  let current: AnnouncementTextBlock | null = null;

  function flush() {
    if (current) result.push(current);
    current = null;
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }

    const orderedMatch = /^([0-9]{1,2})[.)]\s+(.+)$/u.exec(line);
    const unorderedMatch = /^[-*•]\s+(.+)$/u.exec(line);
    const kind: AnnouncementTextBlock['kind'] =
      orderedMatch ? 'ordered' : unorderedMatch ? 'unordered' : 'paragraph';

    if (!current || current.kind !== kind) {
      flush();
      current = kind === 'paragraph'
        ? { kind, lines: [] }
        : { kind, items: [] };
    }

    if (current.kind === 'paragraph') {
      current.lines.push(line);
    } else {
      current.items.push(orderedMatch?.[2] ?? unorderedMatch?.[1] ?? line);
    }
  }
  flush();
  return result;
}
