/**
 * Creates a synthetic Postgres fixture from checked-in, exact-original task
 * snapshots. No production DB credentials or student data are used.
 *
 * Usage: node scripts/legacy-guides-v2/make-ci-fixture.mjs > /tmp/legacy-fixture.sql
 */
import { readFileSync } from 'node:fs';

const slugs = [
  'applied-ai-engineering','automation-engineering','backend-engineering',
  'cybersecurity','data-analytics','frontend-engineering',
  'mobile-development','ui-ux-design',
];
const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const records = [];
for (const slug of slugs) {
  const sql = read('scripts/legacy-guides-v2/update-' + slug + '.sql');
  const match = sql.match(/\$legacy_payload\$([\s\S]*?)\$legacy_payload\$/);
  if (!match) throw new Error('Missing fixtures for ' + slug);
  const rows = JSON.parse(match[1]);
  if (rows.length !== 10) throw new Error('Unexpected fixture size ' + slug);
  for (const row of rows) {
    records.push({
      slug: row.slug,
      title: row.title,
      task_number: row.task_number,
      instructions: row.old_instructions,
      description: row.old_description,
    });
  }
}
if (records.length !== 80) throw new Error('Expected 80 legacy tasks');
const data = JSON.stringify(records);
if (data.includes('$legacy_ci$')) throw new Error('Unsafe delimiter in fixture');

process.stdout.write([
  'CREATE EXTENSION IF NOT EXISTS pgcrypto;',
  'CREATE TABLE public.internships (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text UNIQUE NOT NULL);',
  'CREATE TABLE public.internship_tasks (',
  ' id uuid PRIMARY KEY DEFAULT gen_random_uuid(),',
  ' internship_id uuid NOT NULL REFERENCES public.internships(id),',
  ' task_number integer NOT NULL, title text NOT NULL,',
  ' description text, instructions text,',
  " status text NOT NULL DEFAULT 'published',",
  ' is_required boolean NOT NULL DEFAULT true,',
  ' UNIQUE (internship_id,task_number)',
  ');',
  'CREATE TABLE public.task_submissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), task_id uuid REFERENCES public.internship_tasks(id), status text NOT NULL);',
  'CREATE TEMP TABLE fixture_import(payload jsonb NOT NULL);',
  'INSERT INTO fixture_import(payload) VALUES ($legacy_ci$' + data + '$legacy_ci$::jsonb);',
  'INSERT INTO public.internships(slug) SELECT DISTINCT r.item->>\'slug\' FROM fixture_import f CROSS JOIN LATERAL jsonb_array_elements(f.payload) r(item);',
  'INSERT INTO public.internship_tasks(internship_id,task_number,title,description,instructions)',
  ' SELECT i.id,(r.item->>\'task_number\')::integer,r.item->>\'title\',r.item->>\'description\',r.item->>\'instructions\'',
  ' FROM fixture_import f CROSS JOIN LATERAL jsonb_array_elements(f.payload) r(item)',
  ' JOIN public.internships i ON i.slug=r.item->>\'slug\';',
  "INSERT INTO public.internships(slug) VALUES ('unrelated-program');",
  "INSERT INTO public.internship_tasks(internship_id,task_number,title,description,instructions)",
  " SELECT id,1,'Unrelated test','Do not modify','Unchanged' FROM public.internships WHERE slug='unrelated-program';",
  "INSERT INTO public.task_submissions(task_id,status)",
  " SELECT t.id,'approved' FROM public.internship_tasks t JOIN public.internships i ON i.id=t.internship_id",
  " WHERE i.slug='backend-engineering' AND t.task_number=1;",
  "SELECT count(*) AS original_tasks FROM public.internship_tasks;",
].join('\n') + '\n');
