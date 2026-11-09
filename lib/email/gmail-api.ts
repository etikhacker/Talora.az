import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import type { EmailMessage } from './gmail-helpers';

const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
const EMAIL_PATTERN = /^[^\s@<>:,;]+@[^\s@<>:,;]+\.[^\s@<>:,;]+$/;
const TOKEN_TIMEOUT_MS = 10_000;
const SEND_TIMEOUT_MS = 15_000;
const TOKEN_EXPIRY_SAFETY_MS = 60_000;

export interface GmailApiSettings {
  user: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export function getGmailApiSettings(
  env: Record<string, string | undefined>
): GmailApiSettings | null {
  const user = env.GMAIL_USER?.trim().toLowerCase() || '';
  const clientId = env.GMAIL_OAUTH_CLIENT_ID?.trim() || '';
  const clientSecret = env.GMAIL_OAUTH_CLIENT_SECRET?.trim() || '';
  const refreshToken = env.GMAIL_OAUTH_REFRESH_TOKEN?.trim() || '';

  if (!EMAIL_PATTERN.test(user) || !clientId || !clientSecret || !refreshToken) return null;
  if ([clientId, clientSecret, refreshToken].some(value => /[\r\n]/.test(value))) return null;
  return { user, clientId, clientSecret, refreshToken };
}

function validateRecipient(email: string): string {
  const normalized = email.trim();
  if (!EMAIL_PATTERN.test(normalized) || /[\r\n]/.test(normalized)) {
    throw new Error('GMAIL_API_INVALID_RECIPIENT');
  }
  return normalized;
}

function safeSubject(value: string): string {
  if (!value || value.length > 300 || /[\r\n]/.test(value)) {
    throw new Error('GMAIL_API_INVALID_SUBJECT');
  }
  return '=?UTF-8?B?' + Buffer.from(value, 'utf8').toString('base64') + '?=';
}

function wrapBase64(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64').match(/.{1,76}/g)?.join('\r\n') || '';
}

/**
 * Build RFC 5322 + MIME without interpolating untrusted text in message headers.
 * For bulk emails, the recipients appear in Bcc, not in the visible To header.
 * MIME content is always base64 encoded, including HTML.
 */
export function encodeGmailMessage(
  sender: string,
  recipients: string[],
  message: EmailMessage,
  boundaryId: string = randomUUID()
): string {
  const from = validateRecipient(sender);
  if (recipients.length < 1 || recipients.length > 50) {
    throw new Error('GMAIL_API_RECIPIENT_COUNT_INVALID');
  }
  const emails = recipients.map(validateRecipient);
  if (new Set(emails.map(email => email.toLowerCase())).size !== emails.length) {
    throw new Error('GMAIL_API_DUPLICATE_RECIPIENT');
  }
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(boundaryId)) {
    throw new Error('GMAIL_API_INVALID_MIME_BOUNDARY');
  }

  const headers = [
    'From: =?UTF-8?B?' + Buffer.from('Talora Bildirişləri', 'utf8').toString('base64') + '?= <' + from + '>',
    'To: ' + (emails.length === 1 ? emails[0] : 'undisclosed-recipients:;'),
    ...(emails.length > 1 ? ['Bcc: ' + emails.join(', ')] : []),
    'Subject: ' + safeSubject(message.subject),
    'MIME-Version: 1.0',
  ];

  if (typeof message.html === 'string' && message.html.length > 0) {
    headers.push('Content-Type: multipart/alternative; boundary="talora-' + boundaryId + '"');
    const b = 'talora-' + boundaryId;
    const payload = [
      ...headers,
      '',
      '--' + b,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      wrapBase64(message.text),
      '--' + b,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      wrapBase64(message.html),
      '--' + b + '--',
      '',
    ].join('\r\n');
    return Buffer.from(payload, 'utf8').toString('base64url');
  }

  const payload = [
    ...headers,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrapBase64(message.text),
    '',
  ].join('\r\n');
  return Buffer.from(payload, 'utf8').toString('base64url');
}

interface OAuthTokenResponse {
  access_token?: unknown;
  expires_in?: unknown;
  error?: unknown;
}

interface GmailSendResponse {
  id?: unknown;
}

function safeStatusError(stage: 'TOKEN' | 'SEND', status: number): Error {
  return new Error('GMAIL_API_' + stage + '_HTTP_' + status);
}

/**
 * HTTPS-only Gmail API delivery. Never automatically retry an ambiguous
 * send timeout/5xx: Google may have accepted the message even when the
 * response was lost. The caller can inspect Sent before manual resend.
 */
export function createGmailApiTransport(
  settings: GmailApiSettings,
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now
) {
  let accessToken = '';
  let validUntil = 0;
  let pendingRefresh: Promise<string> | null = null;

  async function refreshAccessToken(): Promise<string> {
    if (accessToken && validUntil > now()) return accessToken;
    if (pendingRefresh) return pendingRefresh;

    pendingRefresh = (async () => {
      const body = new URLSearchParams({
        client_id: settings.clientId,
        client_secret: settings.clientSecret,
        refresh_token: settings.refreshToken,
        grant_type: 'refresh_token',
      });
      let response: Response;
      try {
        response = await fetcher(OAUTH_TOKEN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
          signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
          cache: 'no-store',
        });
      } catch {
        throw new Error('GMAIL_API_TOKEN_NETWORK_TIMEOUT');
      }
      if (!response.ok) throw safeStatusError('TOKEN', response.status);
      const parsed = (await response.json().catch(() => null)) as OAuthTokenResponse | null;
      if (!parsed || typeof parsed.access_token !== 'string' || parsed.access_token.length === 0) {
        throw new Error('GMAIL_API_TOKEN_RESPONSE_INVALID');
      }
      const expiresIn = typeof parsed.expires_in === 'number' ? parsed.expires_in : 3600;
      accessToken = parsed.access_token;
      validUntil = now() + Math.max(0, expiresIn * 1000 - TOKEN_EXPIRY_SAFETY_MS);
      return accessToken;
    })();

    try {
      return await pendingRefresh;
    } finally {
      pendingRefresh = null;
    }
  }

  return {
    async send(recipients: string[], message: EmailMessage): Promise<void> {
      // Validate before requesting any OAuth credentials.
      const raw = encodeGmailMessage(settings.user, recipients, message);
      const token = await refreshAccessToken();

      let response: Response;
      try {
        response = await fetcher(GMAIL_SEND_URL, {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw }),
          cache: 'no-store',
          signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
        });
      } catch {
        // Delivery status is uncertain on transport failures; don't retry.
        throw new Error('GMAIL_API_SEND_UNCERTAIN_TIMEOUT');
      }
      if (!response.ok) {
        if (response.status === 401) {
          // Expired/revoked credentials; do not leak bearer tokens into logs.
          accessToken = '';
          validUntil = 0;
        }
        throw safeStatusError('SEND', response.status);
      }
      const result = (await response.json().catch(() => null)) as GmailSendResponse | null;
      if (typeof result?.id !== 'string' || !result.id) {
        throw new Error('GMAIL_API_SEND_UNCONFIRMED');
      }
    },
  };
}
