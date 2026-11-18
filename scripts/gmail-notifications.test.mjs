import test from 'node:test';
import assert from 'node:assert/strict';

async function loadEmailHelpers() {
  try {
    return await import('../lib/email/gmail-helpers.ts');
  } catch {
    return {};
  }
}

async function loadGmailApi() {
  try {
    return await import('../lib/email/gmail-api.ts');
  } catch {
    return {};
  }
}

async function loadGmailTransport() {
  try {
    return await import('../lib/email/gmail.ts');
  } catch {
    return {};
  }
}

test('Gmail sending is disabled until both sender and app password are configured', async () => {
  const { getGmailSettings } = await loadEmailHelpers();
  assert.equal(typeof getGmailSettings, 'function', 'Gmail settings behavior must be implemented');
  assert.equal(getGmailSettings({ GMAIL_USER: 'internaz.notification@gmail.com' }), null);
  assert.equal(getGmailSettings({ GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop' }), null);
});

test('Gmail settings use the configured sender and normalize the spaced Google app password', async () => {
  const { getGmailSettings } = await loadEmailHelpers();
  assert.equal(typeof getGmailSettings, 'function', 'Gmail settings behavior must be implemented');

  assert.deepEqual(
    getGmailSettings({
      GMAIL_USER: '  internaz.notification@gmail.com  ',
      GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop',
    }),
    {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: 'internaz.notification@gmail.com',
      password: 'abcdefghijklmnop',
      from: 'Talora Bildirişləri <internaz.notification@gmail.com>',
    }
  );
});

test('an explicitly disabled preference prevents that email category from being sent', async () => {
  const { shouldSendNotification } = await loadEmailHelpers();
  assert.equal(typeof shouldSendNotification, 'function', 'Preference-based email gating must be implemented');

  assert.equal(
    shouldSendNotification(
      { notification_preferences: { application_status_updates: false } },
      'application_status_updates'
    ),
    false
  );
  assert.equal(
    shouldSendNotification({}, 'application_status_updates'),
    true,
    'users without saved preferences keep the existing enabled-by-default behavior'
  );
});

test('application status messages state the actual decision and include the program title', async () => {
  const { buildApplicationStatusEmail } = await loadEmailHelpers();
  assert.equal(typeof buildApplicationStatusEmail, 'function', 'Application status email content must be implemented');

  const message = buildApplicationStatusEmail({
    fullName: 'Aysel Məmmədova',
    internshipTitle: 'Frontend proqramı',
    status: 'accepted',
    adminNote: 'Daxili qeyd — tələbəyə göndərilməməlidir.',
    applicationUrl: 'https://intern-az.vercel.app/dashboard/applications',
  });

  assert.equal(message.subject, 'Müraciət statusu: qəbul edildi');
  assert.match(message.text, /Salam Aysel Məmmədova/);
  assert.match(message.text, /Frontend proqramı/);
  assert.match(message.text, /qəbul edildi/);
  assert.doesNotMatch(message.text, /Daxili qeyd/);
  assert.match(message.text, /https:\/\/intern-az\.vercel\.app\/dashboard\/applications/);
});

test('new internship announcement messages contain the program title, summary, and link', async () => {
  const { buildInternshipAnnouncementEmail } = await loadEmailHelpers();
  assert.equal(typeof buildInternshipAnnouncementEmail, 'function', 'New internship email content must be implemented');

  const message = buildInternshipAnnouncementEmail({
    title: 'Python təcrübəsi',
    shortDescription: 'Real layihələr üzərində işləyin.',
    internshipUrl: 'https://intern-az.vercel.app/internships/python-practice',
  });

  assert.equal(message.subject, 'Yeni təcrübə proqramı: Python təcrübəsi');
  assert.match(message.text, /Python təcrübəsi/);
  assert.match(message.text, /Real layihələr üzərində işləyin\./);
  assert.match(message.text, /https:\/\/intern-az\.vercel\.app\/internships\/python-practice/);
});

test('the Gmail sender sends the configured sender, recipient, subject, and body through its transport', async () => {
  const { getGmailSettings, sendGmailMessage } = await loadEmailHelpers();
  assert.equal(typeof sendGmailMessage, 'function', 'Gmail transport boundary must be implemented');

  const settings = getGmailSettings({
    GMAIL_USER: 'internaz.notification@gmail.com',
    GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop',
  });
  const captured = [];
  const result = await sendGmailMessage(
    { sendMail: async (options) => { captured.push(options); return { messageId: 'queued-1' }; } },
    settings,
    'student@example.com',
    { subject: 'Müraciət statusu: qəbul edildi', text: 'Müraciətiniz qəbul edildi.' }
  );

  assert.deepEqual(captured, [{
    from: 'Talora Bildirişləri <internaz.notification@gmail.com>',
    to: 'student@example.com',
    subject: 'Müraciət statusu: qəbul edildi',
    text: 'Müraciətiniz qəbul edildi.',
  }]);
  assert.deepEqual(result, { messageId: 'queued-1' });
});

test('broadcast batches hide every student address in BCC rather than exposing recipients', async () => {
  const { getGmailSettings, sendGmailBatch } = await loadEmailHelpers();
  assert.equal(typeof sendGmailBatch, 'function', 'privacy-preserving BCC batch sender must be implemented');

  const settings = getGmailSettings({
    GMAIL_USER: 'internaz.notification@gmail.com',
    GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop',
  });
  const captured = [];
  await sendGmailBatch(
    { sendMail: async (options) => { captured.push(options); return { messageId: 'batch-1' }; } },
    settings,
    ['student-one@example.com', 'student-two@example.com'],
    { subject: 'Yeni proqram', text: 'Proqram linki.' }
  );

  assert.deepEqual(captured, [{
    from: 'Talora Bildirişləri <internaz.notification@gmail.com>',
    to: 'undisclosed-recipients:;',
    bcc: ['student-one@example.com', 'student-two@example.com'],
    subject: 'Yeni proqram',
    text: 'Proqram linki.',
  }]);
});

test('application HTML escapes user content, preserves the decision, and sends both email formats', async () => {
  const { buildApplicationStatusEmail, sendGmailMessage, getGmailSettings } = await loadEmailHelpers();
  for (const status of ['accepted', 'rejected']) {
    const message = buildApplicationStatusEmail({
      fullName: '<img src=x onerror=alert(1)>',
      internshipTitle: 'API <script>alert(1)</script> & Automation',
      status,
      adminNote: 'PRIVATE_ADMIN_NOTE',
      applicationUrl: 'https://talora-az.vercel.app/dashboard/applications?a=1&b=2',
    });
    assert.match(message.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.doesNotMatch(message.html, /<script>|PRIVATE_ADMIN_NOTE/);
    assert.match(message.html, /href="https:\/\/talora-az\.vercel\.app\/dashboard\/applications\?a=1&amp;b=2"/);
    assert.ok(message.html.includes(status === 'accepted' ? 'Qəbul edildi' : 'Qəbul edilmədi'));
    if (status === 'rejected') assert.doesNotMatch(message.html, /Təbrik edirik/);
    const settings = getGmailSettings({GMAIL_USER:'sender@example.com',GMAIL_APP_PASSWORD:'abcdefghijklmnop'});
    let sent;
    await sendGmailMessage({sendMail: async (options) => { sent = options; }}, settings, 'student@example.com', message);
    assert.equal(sent.html, message.html);
    assert.equal(sent.text, message.text);
    assert.equal(sent.to, 'student@example.com');
  }
  assert.throws(() => buildApplicationStatusEmail({
    fullName:'Student', internshipTitle:'Program', status:'accepted', applicationUrl:'javascript:alert(1)',
  }), /INVALID_APPLICATION_URL/);
});


test('Gmail OAuth token errors expose only the safe Google error code', async () => {
  const { createGmailApiTransport } = await loadGmailApi();
  assert.equal(typeof createGmailApiTransport, 'function');

  const transport = createGmailApiTransport(
    {
      user: 'sender@example.com',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      refreshToken: 'refresh-token',
    },
    async () => new Response(JSON.stringify({
      error: 'invalid_grant',
      error_description: 'sensitive provider details must not be logged',
    }), { status: 400 })
  );

  await assert.rejects(
    transport.send(['student@example.com'], { subject: 'Test', text: 'Test' }),
    (error) => {
      assert.equal(error.message, 'GMAIL_API_TOKEN_HTTP_400_INVALID_GRANT');
      assert.doesNotMatch(error.message, /sensitive|refresh-token|client-secret/i);
      return true;
    }
  );
});

test('Gmail falls back to SMTP only when OAuth token acquisition fails before send', async () => {
  const { sendWithGmailSmtpFallback } = await loadGmailTransport();
  assert.equal(typeof sendWithGmailSmtpFallback, 'function');

  let apiAttempts = 0;
  let smtpAttempts = 0;
  const result = await sendWithGmailSmtpFallback(
    async () => {
      apiAttempts += 1;
      throw new Error('GMAIL_API_TOKEN_HTTP_400_INVALID_GRANT');
    },
    async () => {
      smtpAttempts += 1;
      return 'smtp-sent';
    },
    true
  );

  assert.equal(result, 'smtp-sent');
  assert.equal(apiAttempts, 1);
  assert.equal(smtpAttempts, 1);
});

test('Gmail does not SMTP-fallback after an ambiguous or send-stage API failure', async () => {
  const { sendWithGmailSmtpFallback } = await loadGmailTransport();
  assert.equal(typeof sendWithGmailSmtpFallback, 'function');

  let smtpAttempts = 0;
  await assert.rejects(
    sendWithGmailSmtpFallback(
      async () => { throw new Error('GMAIL_API_SEND_UNCERTAIN_TIMEOUT'); },
      async () => { smtpAttempts += 1; },
      true
    ),
    /GMAIL_API_SEND_UNCERTAIN_TIMEOUT/
  );
  assert.equal(smtpAttempts, 0);
});

test('Gmail preserves the OAuth error when SMTP fallback is not configured', async () => {
  const { sendWithGmailSmtpFallback } = await loadGmailTransport();
  assert.equal(typeof sendWithGmailSmtpFallback, 'function');

  await assert.rejects(
    sendWithGmailSmtpFallback(
      async () => { throw new Error('GMAIL_API_TOKEN_HTTP_400_INVALID_GRANT'); },
      async () => 'should-not-run',
      false
    ),
    /GMAIL_API_TOKEN_HTTP_400_INVALID_GRANT/
  );
});
