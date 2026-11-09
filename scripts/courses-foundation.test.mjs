import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

function source(path) {
  return readFileSync(new URL('../' + path, import.meta.url), 'utf8');
}
const sql = source('supabase/migrations/20261109000000_courses_foundation.sql');
const tables = ['categories', 'courses', 'course_modules', 'course_lessons', 'course_enrollments', 'lesson_progress'];

test('migration adds all six new tables with RLS', () => {
  for (const table of tables) {
    assert.match(sql, new RegExp('CREATE TABLE public\\.' + table + '\\s*\\('));
    assert.ok(sql.includes('ALTER TABLE public.' + table + ' ENABLE ROW LEVEL SECURITY;'));
  }
  assert.equal((sql.match(/CREATE TABLE public\./g) ?? []).length, 6);
});

test('migration preserves existing internship category column', () => {
  assert.ok(sql.includes('ADD COLUMN category_id uuid REFERENCES public.categories(id)'));
  assert.ok(sql.includes('CREATE TRIGGER internships_category_normalize'));
  assert.ok(sql.includes("WHEN 'Frontend' THEN 'frontend'"));
  assert.ok(sql.includes("WHEN 'UI/UX Design' THEN 'ui-ux-design'"));
  assert.doesNotMatch(sql, /ALTER TABLE public\.internships\s+DROP COLUMN/i);
  assert.doesNotMatch(sql, /DROP TABLE public\.(internships|applications|enrollments|certificates)/i);
});

test('all PLpgSQL bodies are correctly dollar quoted', () => {
  const functions = ['course_touch_updated_at','course_validate_progress','course_map_internship_category','course_require_publishable'];
  for (const name of functions) {
    const from = sql.indexOf('CREATE FUNCTION private.' + name + '()');
    assert.ok(from >= 0, 'missing ' + name);
    const to = sql.indexOf('REVOKE ALL ON FUNCTION private.' + name + '()', from);
    assert.ok(to >= 0, 'missing EXECUTE revocation for ' + name);
    const fragment = sql.slice(from, to);
    assert.match(fragment, /AS \$\$\n/);
    assert.match(fragment, /\n\$\$;\n/);
  }
  assert.equal((sql.match(/\$\$/g) ?? []).length, functions.length * 2);
});

test('RLS protects unpublished lessons and student ownership', () => {
  assert.ok(sql.includes('GRANT SELECT ON public.course_lessons,public.course_enrollments,public.lesson_progress TO authenticated;'));
  assert.doesNotMatch(sql, /GRANT SELECT ON [^\n]*public\.course_lessons[^\n]* TO anon(?:,|;)/i);
  assert.ok(sql.includes('CREATE POLICY lessons_read ON public.course_lessons FOR SELECT TO authenticated'));
  assert.ok(sql.includes("c.status='published'"));
  assert.ok(sql.includes("e.status IN ('active','completed')"));
  assert.ok(sql.includes('CREATE POLICY course_enrollments_student_insert ON public.course_enrollments'));
  assert.ok(sql.includes('student_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id=(SELECT auth.uid()))'));
  assert.ok(sql.includes('CREATE POLICY lesson_progress_student_insert ON public.lesson_progress'));
  assert.ok(sql.includes("e.status='active'"));
  assert.ok(sql.includes("AND EXISTS(SELECT 1 FROM public.courses c WHERE c.id=e.course_id AND c.status='published')"));
  assert.doesNotMatch(sql, /SECURITY DEFINER/i);
});

test('course publication is validated on the database', () => {
  assert.ok(sql.includes('CREATE TRIGGER courses_publish_guard'));
  assert.ok(sql.includes("verify_publish := NEW.status='published'"));
  assert.ok(sql.includes("m.status='published' AND l.status='published'"));
});

test('course enrollments and progress have uniqueness and integrity safeguards', () => {
  assert.match(sql, /UNIQUE \(course_id,student_id\)/);
  assert.match(sql, /UNIQUE \(enrollment_id,lesson_id\)/);
  assert.match(sql, /CREATE TRIGGER lesson_progress_validate/);
  assert.match(sql, /WHERE e.id=NEW.enrollment_id AND l.id=NEW.lesson_id/);
});

test('public and private pages exist', () => {
  for (const path of [
    'app/courses/page.tsx',
    'app/courses/[slug]/page.tsx',
    'app/dashboard/courses/page.tsx',
    'app/learn/[courseSlug]/page.tsx',
    'app/learn/[courseSlug]/[lessonId]/page.tsx',
    'app/admin/courses/page.tsx',
    'app/admin/courses/[id]/page.tsx'
  ]) assert.ok(source(path).length > 100, path);
  assert.ok(source('components/layout/navbar.tsx').includes('"/courses"'));
  assert.ok(source('components/dashboard/student-sidebar.tsx').includes('"/dashboard/courses"'));
  assert.ok(source('components/admin/admin-sidebar.tsx').includes('"/admin/courses"'));
});

test('new proposed internship tracks are selectable', () => {
  const form = source('app/admin/internships/new/page.tsx');
  for (const name of ['Business Analysis', 'Graphic Design', 'Instructional Design', 'Prompt Engineering']) {
    assert.ok(form.includes('value="' + name + '"'), name);
  }
});

test('feature flag is disabled by default across navigation and direct routes', () => {
  const feature = source('lib/features/courses.ts');
  const middleware = source('middleware.ts');
  assert.ok(feature.includes("process.env.NEXT_PUBLIC_COURSES_ENABLED === 'true'"));
  assert.ok(middleware.includes('!isCoursesEnabled'));
  assert.ok(middleware.includes("new URL('/dashboard', request.url)"));
  assert.ok(middleware.includes("new URL('/internships', request.url)"));
  assert.ok(middleware.includes('admin'));
  assert.ok(middleware.includes('courses'));
  assert.ok(middleware.includes('learn'));
  for (const file of [
    'components/layout/navbar.tsx',
    'components/admin/admin-sidebar.tsx',
    'components/dashboard/student-sidebar.tsx',
  ]) assert.ok(source(file).includes('isCoursesEnabled'), file);
});

test('published lessons contain real material and published curricula are immutable until unpublished', () => {
  assert.ok(sql.includes('course_lessons_published_content'));
  assert.ok(sql.includes("length(btrim(content_md)) > 0"));
  for (const marker of [
    'course_modules_protect_published',
    'course_lessons_protect_published',
    'Unpublish course before hiding or moving a published module',
    'Unpublish course before hiding or moving a published lesson',
  ]) assert.ok(sql.includes(marker), marker);
  const integration = source('scripts/courses-foundation-integration.sql');
  for (const check of [
    'Empty published lesson was accepted',
    'Published course module was hidden',
    'Published course lesson was hidden',
    'Published lesson was deleted',
  ]) assert.ok(integration.includes(check), check);
});
