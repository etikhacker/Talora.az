import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildTaskReviewEmail } from '../lib/email/task-review-template.ts';
import { requestTaskReviewEmail } from '../lib/email/request-task-review.ts';
import { normalizeNotificationPreferences } from '../lib/notification-preferences.ts';

const read = name => readFileSync(new URL('../' + name, import.meta.url),'utf8');
const taskId = '08f2d688-b793-452e-a2e6-a8475a5b3204';

test('approve, revision and reject templates contain exact decision, task, feedback and URL', () => {
  for (const status of ['approved','revision_requested','rejected']) {
    const message = buildTaskReviewEmail({
      fullName:'Test Tələbə',
      taskTitle:'React tapşırığı',
      feedback:'Kod bölməsində düzəliş edin.',
      status, taskId,
    });
    assert.match(message.subject,/Talora \| Tapşırıq:/);
    assert.match(message.text,/Test Tələbə/);
    assert.match(message.text,/React tapşırığı/);
    assert.match(message.text,/Kod bölməsində düzəliş edin/);
    assert.match(message.text,new RegExp(taskId));
    assert.match(message.html, /Content-Type|<html lang="az">/);
    assert.match(message.html, /https:\/\/talora-az\.vercel\.app\/dashboard\/internship\/tasks\//);
  }
});

test('review email safely encodes admin feedback and student name in HTML', () => {
  const message = buildTaskReviewEmail({
    fullName:'<img src=x onerror=alert(1)>',
    taskTitle:'<script>alert(1)</script>',
    feedback:'Test <b>rəy</b> & \u2028 salam',
    status:'rejected',taskId,
  });
  assert.doesNotMatch(message.html,/<script>|<img src=x|<b>rəy/);
  assert.match(message.html,/&lt;script&gt;/);
  assert.match(message.html,/&lt;b&gt;rəy&lt;\/b&gt;/);
  assert.match(message.text,/Test <b>rəy<\/b>/);
});

test('automatic send request never treats saved review as failed when email network fails', async () => {
  const id='e75d6fea-0d43-49ea-9f7e-9c2a88e40c71';
  const failed=await requestTaskReviewEmail(id,async () => { throw Error('offline'); });
  assert.equal(failed.state,'unavailable');
  assert.match(failed.warning,/Qərar saxlanıldı/);
  const sent=await requestTaskReviewEmail(id,async (url,options) => {
    assert.equal(url,'/api/admin/submissions/review-email');
    assert.equal(options.method,'POST');
    assert.deepEqual(JSON.parse(options.body),{ submissionId:id });
    return Response.json({delivery:{state:'sent'}});
  });
  assert.equal(sent.state,'sent');
  const uncertain=await requestTaskReviewEmail(id,async () => Response.json({delivery:{state:'uncertain'}}));
  assert.equal(uncertain.state,'uncertain');
  assert.match(uncertain.warning,/qeyri-müəyyən/);
});

test('new opt-out is enabled by default and explicit false respected', () => {
  assert.equal(normalizeNotificationPreferences(null).task_review_updates,true);
  assert.equal(normalizeNotificationPreferences({task_review_updates:false}).task_review_updates,false);
});

test('atomic review outbox triggers only on approved/revision/rejected and is private', () => {
  const sql=read('supabase/migrations/20261111055154_task_review_email_deliveries.sql');
  assert.match(sql,/CREATE TABLE public\.task_review_email_deliveries/);
  assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
  assert.match(sql,/REVOKE ALL ON TABLE public\.task_review_email_deliveries FROM PUBLIC,anon,authenticated/);
  assert.match(sql,/event_key text NOT NULL UNIQUE/);
  assert.match(sql,/NEW\.status::text NOT IN \('approved','revision_requested','rejected'\)/);
  assert.match(sql,/NEW\.reviewed_at IS NULL/);
  assert.match(sql,/ON CONFLICT \(event_key\) DO NOTHING/);
  assert.match(sql,/AFTER UPDATE OF status,admin_feedback,reviewed_at/);
  assert.doesNotMatch(sql,/INSERT INTO public\.student_notifications/);
});

test('server sender enforces sole-admin role, one-per-review CAS and ambiguous retry confirmation', () => {
  const route=read('app/api/admin/submissions/review-email/route.ts');
  assert.match(route,/isSoleAdminEmail/);
  assert.match(route,/auth\.getUser\(\)/);
  assert.match(route,/confirmPossibleDuplicate/);
  assert.match(route,/retryFailed && job\.status === 'failed'/);
  assert.match(route,/\.eq\('id', job\.id\)\.eq\('status', job\.status\)\.eq\('attempts', job\.attempts\)/);
  assert.match(route,/shouldSendNotification\(recipient\.user_metadata,'task_review_updates'\)/);
  assert.match(route,/sendGmailEmail\(recipient\.email,message\)/);
  assert.match(route,/new Date\(job\.claimed_at\)\.getTime\(\) > 10 \* 60_000/);
  assert.match(route,/status: 'uncertain'/);
});

test('both admin submission review entrypoints use shared dispatch and retry UI', () => {
  const service=read('lib/submissions/service.ts');
  const list=read('app/admin/submissions/page.tsx');
  const detail=read('app/admin/submissions/[id]/page.tsx');
  assert.match(service,/requestTaskReviewEmail\(submissionId\)/);
  assert.match(service,/checkAndUpdateEnrollmentCompletion/);
  assert.match(list,/res\.emailDelivery/);
  assert.match(detail,/retryReviewEmail/);
  assert.match(detail,/retryUncertain: state === 'uncertain'/);
  assert.match(detail,/confirmPossibleDuplicate: state === 'uncertain'/);
});
