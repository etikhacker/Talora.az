import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { clarifications, rewrites, titleRewrites } from './curriculum-clarifications.mjs';

const [csvPath, outputDirectory] = process.argv.slice(2);
if (!csvPath || !outputDirectory) {
  throw new Error('Usage: node scripts/prepare-curriculum-review.mjs <Supabase CSV export> <artifact directory>');
}

function parseCsv(source) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  const text = source.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && char === ',') { row.push(cell); cell = ''; }
    else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = rows.shift();
  return rows.filter(values => values.some(Boolean)).map(values => {
    if (values.length !== headers.length) throw new Error('Invalid CSV row width');
    return Object.fromEntries(headers.map((key, i) => [key, values[i]]));
  });
}

const md5 = value => createHash('md5').update(value ?? '', 'utf8').digest('hex');
function clean(text) {
  const result = text
    .replace(/[;,]\s*(?:və\s+)?intern\.az repo-sunu təqdim etmə\./gi, '.')
    .replace(/\s+və intern\.az repo-sunu təqdim etmə\./gi, '.')
    .replace(/;\s*do not submit the intern\.az repository\./gi, '.')
    .replace(/,?\s*and do not submit the intern\.az repository\./gi, '.')
    .replace(/\[\[AZ\]\]([\s\S]*?)(?=\[\[EN\]\]|$)/g, (_, az) => `[[AZ]]${az.replace(/\bTask (\d)/g, 'Tapşırıq $1')}`);
  if (/intern\.az/i.test(result)) throw new Error('Unrecognized old repository wording; review it explicitly');
  return result;
}

function sections(text) {
  const matches = [...text.matchAll(/^##\s+(\d+)\.\s+([^\n]+)\n/gm)];
  if (matches.length !== 4 || matches.some((m, i) => Number(m[1]) !== i + 1)) {
    throw new Error('Expected the reviewed four-section source; do not overwrite a different curriculum');
  }
  return matches.map((m, i) => text.slice(m.index + m[0].length, matches[i + 1]?.index ?? text.length).trim());
}

const rows = parseCsv(await readFile(csvPath, 'utf8'));
if (rows.length !== 80) throw new Error(`Expected 80 audited tasks; received ${rows.length}`);
const seen = new Set();
const changes = rows.map(row => {
  const number = Number(row.task_number);
  const key = `${row.track}/${number}`;
  if (seen.has(key)) throw new Error(`Duplicate task ${key}`);
  seen.add(key);
  const clarification = clarifications[row.track]?.[number - 1];
  if (!clarification || clarification.length !== 4 || clarification.some(value => !value.trim())) throw new Error(`Missing review: ${key}`);
  const original = clean(row.instructions);
  if (!original.startsWith('[[AZ]]') || original.split('[[EN]]').length !== 2) throw new Error(`Invalid locales: ${key}`);
  const [azSource, enSource] = original.slice('[[AZ]]'.length).split('[[EN]]');
  const az = sections(azSource.trim()), en = sections(enSource.trim());
  const rewrite = rewrites[key] ?? {};
  const steps = (locale, prior) => rewrite[`steps${locale}`]?.map((step, index) => `${index + 1}. ${step}`).join('\n') ?? prior;
  const instructions = `[[AZ]]
## 1. Bu tapşırıq nə üçündür?
${az[0]}

## 2. Başlamazdan əvvəl
${rewrite.prereqAz ?? az[1]}

## 3. Addım-addım icra
${steps('Az', az[2])}

## 4. Konkret nümunə və izah
${clarification[0]}

## 5. Nə təhvil verməlisən?
${rewrite.submitAz ?? az[3]}

## 6. Hazır olduğunu necə yoxlamalısan?
${clarification[2]}

[[EN]]
## 1. Goal
${en[0]}

## 2. Before you start
${rewrite.prereqEn ?? en[1]}

## 3. Step-by-step work
${steps('En', en[2])}

## 4. Concrete example and explanation
${clarification[1]}

## 5. What to submit
${rewrite.submitEn ?? en[3]}

## 6. How to check your work
${clarification[3]}`;
  if (/intern\.az/i.test(instructions)) throw new Error(`Old branding remains: ${key}`);
  if ((instructions.match(/^## /gm) ?? []).length !== 12) throw new Error(`Invalid generated structure: ${key}`);
  return {
    track: row.track, task_number: number,
    before: { title: row.title, description: row.description, instructions: row.instructions },
    after: { title: titleRewrites[key] ?? row.title, description: clean(row.description), instructions },
  };
});
for (const [track, list] of Object.entries(clarifications)) {
  if (list.length !== 10 || [...Array(10)].some((_, i) => !seen.has(`${track}/${i + 1}`))) throw new Error(`Incomplete track ${track}`);
}

function transaction(direction) {
  const from = direction === 'apply' ? 'before' : 'after';
  const to = direction === 'apply' ? 'after' : 'before';
  const data = changes.map(change => ({
    track: change.track, task_number: change.task_number,
    previous_hash: md5(JSON.stringify([change[from].title, change[from].description, change[from].instructions])),
    previous_title_hash: md5(change[from].title), previous_description_hash: md5(change[from].description), previous_instructions_hash: md5(change[from].instructions),
    ...change[to],
  }));
  const json = JSON.stringify(data);
  if (json.includes('$task_review_data$')) throw new Error('Unsafe SQL delimiter');
  const verification = changes.map(c => ({ track:c.track, task_number:c.task_number, title_hash:md5(c[to].title), description_hash:md5(c[to].description), instructions_hash:md5(c[to].instructions) }));
  return `-- Authorized curriculum content update. No schema or submission changes.
-- Generated from a live CSV snapshot; refuses concurrent title/description/instruction edits.
BEGIN;
DO $task_review$
DECLARE
  review_data jsonb := $task_review_data$${json}$task_review_data$::jsonb;
  matched integer;
  changed integer;
BEGIN
  PERFORM t.id
  FROM jsonb_to_recordset(review_data) AS r(track text, task_number integer)
  JOIN public.internships i ON i.title=r.track
  JOIN public.internship_tasks t ON t.internship_id=i.id AND t.task_number=r.task_number
  FOR UPDATE OF t;
  SELECT count(*) INTO matched
  FROM jsonb_to_recordset(review_data) AS r(track text, task_number integer, previous_title_hash text, previous_description_hash text, previous_instructions_hash text)
  JOIN public.internships i ON i.title = r.track
  JOIN public.internship_tasks t ON t.internship_id=i.id AND t.task_number=r.task_number
  WHERE md5(coalesce(t.title,''))=r.previous_title_hash
    AND md5(coalesce(t.description,''))=r.previous_description_hash
    AND md5(coalesce(t.instructions,''))=r.previous_instructions_hash;
  IF matched <> 80 THEN
    RAISE EXCEPTION 'Task review stopped: expected 80 unchanged tasks, found %', matched;
  END IF;
  UPDATE public.internship_tasks t
  SET title=r.title, description=r.description, instructions=r.instructions
  FROM jsonb_to_recordset(review_data) AS r(track text, task_number integer, title text, description text, instructions text)
  JOIN public.internships i ON i.title=r.track
  WHERE t.internship_id=i.id AND t.task_number=r.task_number;
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 80 THEN RAISE EXCEPTION 'Expected 80 updates, found %', changed; END IF;
END $task_review$;
COMMIT;

SELECT count(*) AS verified_task_count,
       count(*) FILTER (WHERE t.instructions ILIKE '%intern.az%' OR t.description ILIKE '%intern.az%') AS old_repository_references
FROM jsonb_to_recordset($verification$${JSON.stringify(verification)}$verification$::jsonb)
  AS r(track text, task_number integer, title_hash text, description_hash text, instructions_hash text)
JOIN public.internships i ON i.title=r.track
JOIN public.internship_tasks t ON t.internship_id=i.id AND t.task_number=r.task_number
WHERE md5(coalesce(t.title,''))=r.title_hash
  AND md5(coalesce(t.description,''))=r.description_hash
  AND md5(coalesce(t.instructions,''))=r.instructions_hash;
`;
}

await mkdir(outputDirectory, { recursive:true });
await Promise.all([
  writeFile(path.join(outputDirectory, 'apply.sql'), transaction('apply')),
  writeFile(path.join(outputDirectory, 'rollback.sql'), transaction('rollback')),
  writeFile(path.join(outputDirectory, 'review.json'), JSON.stringify(changes, null, 2)),
]);
console.log(JSON.stringify({ reviewed:changes.length, tracks:Object.keys(clarifications).length, renamedEarlyFinals:Object.keys(titleRewrites).length, sourceCsv:csvPath, artifacts:path.resolve(outputDirectory) }, null, 2));
