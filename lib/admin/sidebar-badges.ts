export const ADMIN_BADGE_SECTIONS = {
  '/admin/internships': 'internships',
  '/admin/applications': 'applications',
  '/admin/tasks': 'tasks',
  '/admin/submissions': 'submissions',
  '/admin/students': 'students',
  '/admin/completed': 'completed',
  '/admin/certificate-orders': 'certificate-orders',
  '/admin/certificates': 'certificates',
  '/admin/contact-messages': 'contact-messages',
} as const;

export type AdminBadgeSection = (typeof ADMIN_BADGE_SECTIONS)[keyof typeof ADMIN_BADGE_SECTIONS];
export type AdminBadgeCounts = Record<AdminBadgeSection, number>;

export const EMPTY_ADMIN_BADGES: AdminBadgeCounts = {
  internships: 0,
  applications: 0,
  tasks: 0,
  submissions: 0,
  students: 0,
  completed: 0,
  'certificate-orders': 0,
  certificates: 0,
  'contact-messages': 0,
};

export function adminBadgeSectionForPath(pathname: string): AdminBadgeSection | null {
  const matching = Object.entries(ADMIN_BADGE_SECTIONS).find(
    ([href]) => pathname === href || pathname.startsWith(href + '/'),
  );
  return (matching?.[1] as AdminBadgeSection | undefined) ?? null;
}

export function normalizeAdminBadgeCounts(value: unknown): AdminBadgeCounts {
  const record = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const result = { ...EMPTY_ADMIN_BADGES };
  for (const section of Object.keys(result) as AdminBadgeSection[]) {
    const raw = Number(record[section]);
    result[section] = Number.isSafeInteger(raw) && raw > 0 ? Math.min(raw, 9999) : 0;
  }
  return result;
}
