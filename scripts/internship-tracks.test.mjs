import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (name) => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const categories = read('lib/internships/categories.ts');
const field = read('components/admin/internship-category-field.tsx');
const create = read('app/admin/internships/new/page.tsx');
const edit = read('app/admin/internships/[id]/edit/page.tsx');
const publicCatalog = read('app/internships/page.tsx');

test('new non-technical tracks are defined in shared grouped taxonomy', () => {
  const trackNames = [
    'Business Analysis', 'Business Development', 'Project Management',
    'Human Resources', 'Entrepreneurship', 'Public Relations',
    'Content Writing', 'Social Media Management', 'Corporate Communication',
    'Digital Marketing', 'Graphic Design', 'Video Editing',
    'Creative Content Production', 'E-Learning', 'Educational Content Development',
    'Instructional Design', 'Training Coordination', 'Prompt Engineering',
    'Generative AI', 'AI Automation', 'AI Research',
  ];
  for (const category of trackNames) {
    assert.ok(categories.includes("'" + category + "'"), category);
  }
});

test('all existing category values stay usable without destructive DB changes', () => {
  const existing = [
    'Frontend', 'Backend', 'Data', 'AI', 'Automation',
    'Proqramlaşdırma və Veb', 'Məlumat Analitikası',
    'Məhsul İdarəetməsi', 'Kibertəhlükəsizlik',
    'UI/UX Dizayn', 'Rəqəmsal Marketinq',
  ];
  for (const category of existing) {
    assert.ok(categories.includes("'" + category + "'"), category);
  }
  const groupValues = [...categories.matchAll(/values:\s*\[([^\]]*)\]/g)]
    .flatMap((match) => [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1]));
  assert.equal(groupValues.length, new Set(groupValues).size, 'duplicate category values');
  assert.ok(categories.includes('INTERNSHIP_CATEGORY_VALUES'));
});

test('admin create and edit share the same category selector', () => {
  assert.ok(create.includes('<InternshipCategoryField value={category} onChange={setCategory} isAz={isAz} />'));
  assert.ok(edit.includes('<InternshipCategoryField value={category} onChange={setCategory} isAz={isAz} />'));
  assert.ok(field.includes('isKnownInternshipCategory(value)'));
  assert.ok(field.includes('manualEntry || customValue'));
  assert.ok(field.includes('onChange(selected)'));
  assert.ok(create.includes('category: category.trim()'));
  assert.ok(edit.includes('setCategory(item.category)'));
});

test('public page distinguishes planned tracks from published internships', () => {
  assert.ok(publicCatalog.includes("fetch('/api/internships/public'"));
  assert.ok(publicCatalog.includes('INTERNSHIP_CATEGORY_GROUPS.filter'));
  assert.ok(publicCatalog.includes('available === 0'));
  assert.ok(publicCatalog.includes("'Coming soon'"));
  assert.ok(publicCatalog.includes('setSelectedGroup('));
  assert.ok(publicCatalog.includes('selectedGroup !== null'));
  assert.ok(publicCatalog.includes('group.values.some'));
});

test('feature requires neither new course tables nor Supabase migrations', () => {
  assert.ok(create.includes('createInternship'));
  assert.ok(edit.includes('updateInternship'));
  assert.ok(!categories.includes('course_lessons'));
  assert.ok(!field.includes("from('categories')"));
});

test('bilingual internship descriptions use requested UI language', () => {
  const helper = read('lib/internships/localized-content.ts');
  const detail = read('app/internships/[slug]/page.tsx');
  assert.ok(helper.includes('[[AZ]]') && helper.includes('[[EN]]'));
  assert.ok(helper.includes("language === 'en'"));
  assert.ok(publicCatalog.includes('localizedInternshipText(internship.short_description'));
  assert.ok(detail.includes('localizedInternshipText(internship.short_description'));
  assert.ok(detail.includes('localizedInternshipText(internship.description'));
});
