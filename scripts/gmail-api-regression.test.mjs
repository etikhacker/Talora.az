import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { test } from 'node:test';
import {
  createGmailApiTransport,
  encodeGmailMessage,
  getGmailApiSettings,
} from '../lib/email/gmail-api.ts';

const SETTINGS = {
  user: 'sender@example.com',
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  refreshToken: 'test-refresh-token',
};
const MESSAGE = {
  subject: 'Müraciət statusu: qəbul edildi',
  text: 'Salam, tələbə.\nMüraciətiniz qəbul edildi.',
  html: '<p>Salam, tələbə.</p><p><b>Qəbul edildi.</b></p>',
};
function source(raw) {
  return Buffer.from(raw, 'base64url').toString('utf8');
}

test('OAuth API setup is separate, explicit and never requires an app password', () => {
  assert.deepEqual(getGmailApiSettings({
    GMAIL_USER: SETTINGS.user.toUpperCase(),
    GMAIL_OAUTH_CLIENT_ID: SETTINGS.clientId,
    GMAIL_OAUTH_CLIENT_SECRET: SETTINGS.clientSecret,
    GMAIL_OAUTH_REFRESH_TOKEN: SETTINGS.refreshToken,
  }), SETTINGS);
  assert.equal(getGmailApiSettings({ GMAIL_USER: SETTINGS.user }), null);
  assert.equal(getGmailApiSettings({ ...{
    GMAIL_USER: SETTINGS.user,
    GMAIL_OAUTH_CLIENT_ID: SETTINGS.clientId,
    GMAIL_OAUTH_CLIENT_SECRET: SETTINGS.clientSecret,
  }, GMAIL_OAUTH_REFRESH_TOKEN: '' }), null);
});

test('RFC 5322 / RFC 2047 UTF-8 email is base64url encoded and preserves both HTML and plain text', () => {
  const raw = encodeGmailMessage(SETTINGS.user, ['student@example.net'], MESSAGE, 'static-test');
  const mime = source(raw);
  assert.match(raw, /^[A-Za-z0-9_-]+$/);
  assert.match(mime, /From: =\?UTF-8\?B\?/);
  assert.match(mime, /To: student@example.net\r\n/);
  assert.match(mime, /Subject: =\?UTF-8\?B\?/);
  assert.match(mime, /Content-Type: multipart\/alternative/);
  const textBase64 = Buffer.from(MESSAGE.text).toString('base64');
  const htmlBase64 = Buffer.from(MESSAGE.html).toString('base64');
  assert.ok(mime.includes(textBase64));
  assert.ok(mime.includes(htmlBase64));
  assert.ok(!mime.includes('<p>Salam')); // body is encoded, not raw
});

test('API Bcc batch hides addresses from To, uses no visible recipient list and does not duplicate recipients', () => {
  const mime = source(encodeGmailMessage(
    SETTINGS.user, ['a@example.net','b@example.net'], MESSAGE, 'bcc-test'
  ));
  assert.match(mime, /To: undisclosed-recipients:;/);
  assert.match(mime, /Bcc: a@example.net,/);
  assert.match(mime, /b@example.net/);
  assert.doesNotMatch(mime, /To: a@example.net/);
  assert.throws(() => encodeGmailMessage(SETTINGS.user, ['a@example.net', 'A@example.net'], MESSAGE), /DUPLICATE_RECIPIENT/);
});

test('recipient and subject header injection are rejected before making network requests', () => {
  assert.throws(() => encodeGmailMessage(SETTINGS.user, ['a@example.net\r\nBcc: stranger@example.net'], MESSAGE), /INVALID_RECIPIENT/);
  assert.throws(() => encodeGmailMessage(SETTINGS.user, ['student@example.net'], {
    ...MESSAGE, subject: 'Good\r\nBcc: stranger@example.net',
  }), /INVALID_SUBJECT/);
  assert.throws(() => encodeGmailMessage(SETTINGS.user, [], MESSAGE), /RECIPIENT_COUNT_INVALID/);
  assert.throws(() => encodeGmailMessage(SETTINGS.user, new Array(51).fill('test@example.net'), MESSAGE), /RECIPIENT_COUNT_INVALID/);
});

test('long non-ASCII subject is folded without breaking Unicode code points', () => {
  const subject = 'Yeni təcrübə proqramı: ' + 'süni intellekt '.repeat(12);
  const mime = source(encodeGmailMessage(SETTINGS.user, ['student@example.net'], {...MESSAGE, subject}));
  const folded = mime.match(/Subject: ([\s\S]*?)\r\nMIME-Version:/);
  assert.ok(folded);
  const tokens = folded[1].split(/\r\n /);
  assert.ok(tokens.length > 1);
  for (const token of tokens) {
    assert.ok(token.length <= 75, token.length + ' RFC2047 word limit');
  }
  assert.equal(tokens.map(token => Buffer.from(token.slice('=?UTF-8?B?'.length, -'?='.length), 'base64').toString('utf8')).join(''), subject);
});

test('refreshes OAuth token once and sends Gmail API HTTPS JSON without exposing secrets', async () => {
  const calls = [];
  const mockFetch = async (url, init) => {
    calls.push({ url, init });
    if (url.includes('oauth2.googleapis.com')) return Response.json({ access_token: 'short-lived-access', expires_in: 3600 });
    if (url.includes('gmail.googleapis.com')) return Response.json({ id: 'gmail-accepted-message-id' });
    throw new Error('Unexpected URL');
  };
  const transport = createGmailApiTransport(SETTINGS, mockFetch);
  await Promise.all([
    transport.send(['student1@example.net'], MESSAGE),
    transport.send(['student2@example.net'], MESSAGE),
  ]);
  assert.equal(calls.filter(x => x.url.includes('oauth2.googleapis.com')).length, 1);
  assert.equal(calls.filter(x => x.url.includes('gmail.googleapis.com')).length, 2);
  const tokenRequest = calls.find(x => x.url.includes('oauth2.googleapis.com'));
  assert.equal(tokenRequest.init.method, 'POST');
  assert.equal(tokenRequest.init.body.get('grant_type'), 'refresh_token');
  assert.equal(tokenRequest.init.body.get('client_secret'), SETTINGS.clientSecret);
  for (const call of calls.filter(x => x.url.includes('gmail.googleapis.com'))) {
    assert.equal(call.url, 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
    assert.equal(call.init.headers.Authorization, 'Bearer short-lived-access');
    assert.equal(call.init.cache, 'no-store');
    const body = JSON.parse(call.init.body);
    assert.match(source(body.raw), /Subject: =\?UTF-8\?B\?/);
    assert.ok(!call.init.body.includes(SETTINGS.clientSecret));
  }
});

test('missing/expired OAuth authorization returns a safe error, never falls back to SMTP', async () => {
  let sendCalls = 0;
  const transport = createGmailApiTransport(SETTINGS, async url => {
    if (url.includes('oauth2.googleapis.com')) return Response.json({ error: 'invalid_grant' }, { status: 400 });
    sendCalls++;
    return Response.json({ id: 'unexpected' });
  });
  await assert.rejects(() => transport.send(['student@example.net'], MESSAGE), /GMAIL_API_TOKEN_HTTP_400/);
  assert.equal(sendCalls, 0);
});

test('sending failure, ambiguous timeout and missing confirmation never trigger an automatic retry', async () => {
  for (const outcome of ['http500','timeout','invalid200']) {
    let sends = 0;
    const transport = createGmailApiTransport(SETTINGS, async url => {
      if (url.includes('oauth2.googleapis.com')) return Response.json({ access_token: 'token', expires_in: 3600 });
      sends++;
      if (outcome === 'timeout') throw new Error('Network reset');
      if (outcome === 'http500') return Response.json({ error: 'temporary' }, {status:500});
      return Response.json({});
    });
    const error = outcome === 'timeout'
      ? /GMAIL_API_SEND_UNCERTAIN_TIMEOUT/
      : outcome === 'http500'
        ? /GMAIL_API_SEND_HTTP_500/
        : /GMAIL_API_SEND_UNCONFIRMED/;
    await assert.rejects(() => transport.send(['student@example.net'], MESSAGE), error);
    assert.equal(sends,1);
  }
});
