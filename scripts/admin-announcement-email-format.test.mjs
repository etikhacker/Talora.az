import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { parseAnnouncementText } from '../lib/announcements/text-format.ts';
import { renderAnnouncementEmailHtml } from '../lib/email/announcement-template.ts';
import { encodeGmailMessage } from '../lib/email/gmail-api.ts';

const title = 'Talora | Sertifikat qiyməti haqqında məlumat';
const body = [
  'Salam, hörmətli iştirakçılar!',
  '',
  'Son zamanlar sertifikatların qiyməti ilə bağlı çoxsaylı müraciətlər daxil olduğu üçün sizə rəsmi məlumat vermək istəyirik.',
  '',
  '🏆 Talora platformasında sertifikatın əldə edilməsi üçün ödəniş 25 AZN təşkil edir.',
  '',
  '📌 Vacib məlumatlar:',
  '',
  '1. Sertifikat üçün ödəniş məbləği: 25 AZN',
  '2. Sertifikat əldə etmək üçün təcrübə proqramının tələbləri uğurla tamamlanmalıdır.',
  '3. Yalnız qeydiyyatdan keçmək sertifikat əldə etmək üçün kifayət etmir.',
  '',
  '🔗 Platforma: https://talora-az.vercel.app',
  '',
  'Hörmətlə,',
  'Talora komandası',
].join('\n');

test('email blocks preserve paragraphs, numbered lists and intentional signature breaks', () => {
  const blocks = parseAnnouncementText(body);
  assert.equal(blocks.filter(item => item.kind === 'ordered').length, 1);
  assert.deepEqual(blocks.find(item => item.kind === 'ordered')?.items, [
    'Sertifikat üçün ödəniş məbləği: 25 AZN',
    'Sertifikat əldə etmək üçün təcrübə proqramının tələbləri uğurla tamamlanmalıdır.',
    'Yalnız qeydiyyatdan keçmək sertifikat əldə etmək üçün kifayət etmir.',
  ]);
  assert.deepEqual(blocks.at(-1), {
    kind: 'paragraph',
    lines: ['Hörmətlə,', 'Talora komandası'],
  });
});

test('HTML email wraps naturally without injecting breaks inside long Azerbaijani sentences', () => {
  const html = renderAnnouncementEmailHtml({ title, body });
  assert.match(html, /<meta name="viewport" content="width=device-width,initial-scale=1">/);
  assert.match(html, /overflow-wrap:break-word/);
  assert.match(html, /çoxsaylı müraciətlər daxil olduğu üçün sizə rəsmi məlumat vermək istəyirik\./);
  assert.match(html, /ödəniş 25 AZN təşkil edir\./);
  assert.doesNotMatch(html, /ödəniş 25 AZN\s*<br>\s*təşkil edir/);
  assert.match(html, /<ol [^>]*>[\s\S]*<li [^>]*>Sertifikat üçün ödəniş məbləği: 25 AZN<\/li>/);
  assert.match(html, /href="https:\/\/talora-az\.vercel\.app"/);
  assert.match(html, /Hörmətlə,<br>Talora komandası/);
});

test('unsafe HTML is escaped and non-http URLs are not linked', () => {
  const html = renderAnnouncementEmailHtml({
    title: '<script>alert("bad")</script>',
    body: 'Salam <img src=x onerror=alert(1)> javascript:alert(1)',
  });
  assert.doesNotMatch(html, /<script>|<img/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /href="javascript:/);
});

test('MIME email includes both HTML and unchanged plain-text alternative', () => {
  const html = renderAnnouncementEmailHtml({ title, body });
  const raw = encodeGmailMessage('sender@example.com', ['student@example.net'], {
    subject: title,
    text: body,
    html,
  }, 'announcement-format-test');
  const mime = Buffer.from(raw, 'base64url').toString('utf8');
  assert.match(mime, /Content-Type: multipart\/alternative/);
  assert.ok(mime.includes(Buffer.from(body, 'utf8').toString('base64').slice(0, 60)));
  assert.ok(mime.includes(Buffer.from(html, 'utf8').toString('base64').slice(0, 60)));
});

test('admin preview and email delivery route use the shared formatter', () => {
  const page = readFileSync(new URL('../app/admin/notifications/page.tsx', import.meta.url), 'utf8');
  const route = readFileSync(new URL('../app/api/admin/announcements/deliver-emails/route.ts', import.meta.url), 'utf8');
  assert.match(page, /wrap="soft"/);
  assert.match(page, /E-poçt önizləməsi/);
  assert.match(page, /parseAnnouncementText\(form.body\)/);
  assert.match(route, /html: renderAnnouncementEmailHtml\(\{ title: job.subject, body: job.body \}\)/);
  assert.match(route, /text: job.body/);
});
