import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const slugs = [
  'applied-ai-engineering','automation-engineering','backend-engineering',
  'cybersecurity','data-analytics','frontend-engineering',
  'mobile-development','ui-ux-design',
];
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const catalog = JSON.parse(read('scripts/legacy-guides-v2/free-tools.json'));

test('all original 80 tasks have beginner AZ/EN walkthroughs and free platforms', () => {
  let total = 0;
  for (const slug of slugs) {
    const notes = JSON.parse(read('scripts/legacy-guides-v2/notes-' + slug + '.json'));
    assert.equal(notes.length, 10, slug);
    const sql = read('scripts/legacy-guides-v2/update-' + slug + '.sql');
    assert.match(sql, /BEGIN;/);
    assert.match(sql, /COMMIT;/);
    assert.match(sql, /Version mismatch|Original version mismatch|Original task content mismatch/);
    assert.match(sql, /old_instructions/);
    assert.match(sql, /old_description/);
    const captured = sql.match(/\$legacy_payload\$([\s\S]*?)\$legacy_payload\$/);
    assert.ok(captured, slug + ' payload missing');
    const items = JSON.parse(captured[1]);
    assert.equal(items.length, 10);
    for (const [idx, item] of items.entries()) {
      total++;
      assert.equal(item.slug, slug);
      assert.equal(item.task_number, idx + 1);
      assert.ok(item.old_instructions.startsWith('[[AZ]]\n'));
      assert.ok(item.old_description.startsWith('[[AZ]]\n'));
      assert.ok(item.new_instructions.startsWith('[[AZ]]\n'));
      assert.ok(item.new_description.startsWith('[[AZ]]\n'));
      assert.ok(item.new_instructions.length > item.old_instructions.length * 1.5, item.title);
      assert.equal((item.new_instructions.match(/^\[\[(AZ|EN)\]\]$/gm) || []).length, 2);
      assert.ok(item.new_instructions.includes('## Əvvəlki rəsmi tapşırıq'), item.title);
      assert.ok(item.new_instructions.includes('## Original '), item.title);
      assert.ok(item.new_instructions.includes('100'), item.title);
      assert.ok(item.new_instructions.includes('Pulsuz'), item.title);
      assert.ok(item.new_instructions.includes('Free tools'), item.title);
      const az = item.new_instructions.split('[[EN]]')[0];
      const en = item.new_instructions.split('[[EN]]')[1];
      assert.ok(az && en);
      // New guide has exactly 8 steps before unchanged official criteria.
      const newAz = az.split('## Əvvəlki rəsmi tapşırıq')[0];
      const newEn = en.split('## Original ')[0];
      assert.equal((newAz.match(/^\d+\. /gm) || []).length, 8, item.title + ' AZ steps');
      assert.equal((newEn.match(/^\d+\. /gm) || []).length, 8, item.title + ' EN steps');
      // Both original AZ/EN requirements must be preserved verbatim.
      const old = item.old_instructions.match(/^\[\[AZ\]\]\s*\n([\s\S]*?)\n\n\[\[EN\]\]\s*\n([\s\S]*)$/);
      assert.ok(old, item.title);
      assert.ok(item.new_instructions.includes(old[1].trim()), item.title + ' original AZ lost');
      assert.ok(item.new_instructions.includes(old[2].trim()), item.title + ' original EN lost');
      const keys = notes[idx][0].split(',');
      for (const key of keys) {
        assert.ok(catalog[key]?.url?.startsWith('https://'), slug + ' invalid tool ' + key);
        assert.ok(item.new_instructions.includes(catalog[key].url), slug + ' missing URL ' + key);
      }
      assert.ok(item.new_description.includes('Pulsuz alətlər:'));
      assert.ok(item.new_description.includes('Free tools:'));
      assert.ok(!item.new_instructions.includes('SUPABASE_SERVICE_ROLE_KEY'));
    }
  }
  assert.equal(total, 80);
});
