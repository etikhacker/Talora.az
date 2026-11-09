import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const load=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const guideNotes=JSON.parse(load('scripts/career-task-guide-notes-2026.json'));
const stem=['business-analysis','project-management','human-resources','digital-marketing','content-writing','social-media-management','graphic-design','video-editing','instructional-design','prompt-engineering'];
test('100 tasks have genuinely detailed bilingual instructions and free-tool options',()=>{
 let total=0;
 for (const name of stem) {
  const slug='talora-'+name+'-2026';
  const sql=load('scripts/career-guides-v2/'+slug+'.sql');
  const json=sql.match(/\$guide_payload\$([\s\S]*?)\$guide_payload\$/);
  assert.ok(json,slug+' payload');
  const payload=JSON.parse(json[1]);
  assert.equal(payload.length,10,slug+' task count');
  assert.deepEqual(payload.map(x=>x.task_number),[1,2,3,4,5,6,7,8,9,10]);
  for(const task of payload){
    total++;
    assert.equal(task.slug,slug);
    assert.ok(task.old_instructions.length>700);
    assert.ok(task.new_instructions.length>4000, task.title+' not detailed enough');
    assert.ok(task.new_instructions.length>task.old_instructions.length*2);
    assert.equal((task.new_instructions.match(/^\[\[(AZ|EN)\]\]$/gm)||[]).length,2);
    for(const heading of ['## Addım-addım icra təlimatı','## Hansı pulsuz alətlər lazımdır?',
      '## Qiymətləndirmə meyarları (100 bal)','## Step-by-step guide',
      '## Free tools and platforms','## Scoring rubric (100 points)']){
      assert.ok(task.new_instructions.includes(heading),task.title+' '+heading);
    }
    const az=task.new_instructions.split('[[EN]]')[0];
    const en=task.new_instructions.split('[[EN]]')[1];
    assert.equal((az.match(/^\d+\. /gm)||[]).length,8);
    assert.equal((en.match(/^\d+\. /gm)||[]).length,8);
    assert.ok(task.new_description.includes('Pulsuz alətlər:'));
    assert.ok(task.new_description.includes('Free tools:'));
    assert.ok(/https:\/\//.test(task.new_instructions));
    assert.ok(task.new_instructions.includes('No paid subscriptions'));
  }
 }
 assert.equal(Object.keys(guideNotes).length,10);
 assert.equal(total,100);
});
