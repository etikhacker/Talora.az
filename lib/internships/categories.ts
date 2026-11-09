/**
 * Internship tracks are intentionally stored in the existing internships.category
 * TEXT column for the Free-plan-compatible rollout. No database migration is
 * required. The values (not display labels) are stable category identifiers.
 */
export const INTERNSHIP_CATEGORY_GROUPS = [
  {
    key: 'technology',
    az: 'Proqramlaşdırma və texnologiya',
    en: 'Software & Technology',
    values: [
      'Frontend', 'Backend', 'Data', 'AI', 'Automation',
      'Proqramlaşdırma və Veb', 'Məlumat Analitikası',
      'Kibertəhlükəsizlik', 'UI/UX Dizayn', 'Məhsul İdarəetməsi',
      'Rəqəmsal Marketinq', 'Cybersecurity', 'Mobile Development',
    ],
  },
  {
    key: 'ai-prompt',
    az: 'Süni intellekt və Prompt Engineering',
    en: 'AI & Prompt Engineering',
    values: [
      'AI Engineering', 'Prompt Engineering', 'Generative AI',
      'AI Automation', 'AI Research', 'AI Content Evaluation',
    ],
  },
  {
    key: 'business',
    az: 'Biznes və idarəetmə',
    en: 'Business & Management',
    values: [
      'Business Analysis', 'Business Development', 'Project Management',
      'Human Resources', 'Entrepreneurship',
    ],
  },
  {
    key: 'communication',
    az: 'Kommunikasiya və marketinq',
    en: 'Communication & Marketing',
    values: [
      'Public Relations', 'Content Writing', 'Social Media Management',
      'Corporate Communication', 'Digital Marketing',
    ],
  },
  {
    key: 'creativity',
    az: 'Dizayn və yaradıcılıq',
    en: 'Design & Creativity',
    values: [
      'UI/UX Design', 'Graphic Design', 'Video Editing',
      'Creative Content Production',
    ],
  },
  {
    key: 'education',
    az: 'Təhsil və öyrənmə',
    en: 'Education & Learning',
    values: [
      'E-Learning', 'Educational Content Development', 'Instructional Design',
      'Training Coordination',
    ],
  },
] as const;

export const INTERNSHIP_CATEGORY_VALUES = INTERNSHIP_CATEGORY_GROUPS.flatMap(
  (group) => [...group.values],
);

export function isKnownInternshipCategory(value: string): boolean {
  return INTERNSHIP_CATEGORY_VALUES.includes(value as (typeof INTERNSHIP_CATEGORY_VALUES)[number]);
}
