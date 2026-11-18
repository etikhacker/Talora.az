import nodemailer, { type Transporter } from 'nodemailer';
import { createGmailApiTransport, getGmailApiSettings } from './gmail-api';
import {
  getGmailSettings,
  sendGmailBatch,
  sendGmailMessage,
  type EmailMessage,
} from './gmail-helpers';

let cachedTransport: { cacheKey: string; transport: Transporter } | null = null;
let cachedGmailApi: {
  cacheKey: string;
  transport: ReturnType<typeof createGmailApiTransport>;
} | null = null;

type DeliveryProvider = 'smtp' | 'api';

/**
 * OAuth token exchange happens before Gmail API's send request. If that stage
 * fails, no message has been submitted, so using the already-configured SMTP
 * app-password transport is safe. Never fallback after a send-stage error:
 * delivery may be ambiguous and a second transport could create duplicates.
 */
export async function sendWithGmailSmtpFallback<T>(
  sendApi: () => Promise<T>,
  sendSmtp: () => Promise<T>,
  smtpAvailable: boolean
): Promise<T> {
  try {
    return await sendApi();
  } catch (error) {
    if (
      !smtpAvailable ||
      !(error instanceof Error) ||
      !error.message.startsWith('GMAIL_API_TOKEN_')
    ) {
      throw error;
    }
    console.warn('Gmail API token exchange failed; using configured SMTP fallback', {
      code: error.message,
    });
    return sendSmtp();
  }
}

/**
 * Opt-in only: production keeps using SMTP until OAuth is provisioned and
 * GMAIL_DELIVERY_PROVIDER=api is explicitly set in the server environment.
 */
function getDeliveryProvider(): DeliveryProvider | null {
  const configured = process.env.GMAIL_DELIVERY_PROVIDER?.trim().toLowerCase();
  if (!configured || configured === 'smtp') return 'smtp';
  if (configured === 'api') return 'api';
  return null;
}

function getApiTransport(
  settings: NonNullable<ReturnType<typeof getGmailApiSettings>>
): ReturnType<typeof createGmailApiTransport> {
  const cacheKey = [settings.user, settings.clientId, settings.clientSecret, settings.refreshToken].join(':');
  if (cachedGmailApi?.cacheKey === cacheKey) return cachedGmailApi.transport;
  const transport = createGmailApiTransport(settings);
  cachedGmailApi = { cacheKey, transport };
  return transport;
}


function getTransporter(settings: NonNullable<ReturnType<typeof getGmailSettings>>): Transporter {
  const cacheKey = `${settings.user}:${settings.password}`;
  if (cachedTransport?.cacheKey === cacheKey) return cachedTransport.transport;

  const transport = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    pool: true,
    maxConnections: 1,
    maxMessages: 100,
    auth: {
      user: settings.user,
      pass: settings.password,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  cachedTransport = { cacheKey, transport };
  return transport;
}

export function isGmailConfigured(): boolean {
  const provider = getDeliveryProvider();
  if (provider === 'api') return getGmailApiSettings(process.env) !== null;
  if (provider === 'smtp') return getGmailSettings(process.env) !== null;
  return false;
}

export async function sendGmailEmail(recipient: string, message: EmailMessage): Promise<void> {
  if (getDeliveryProvider() === 'api') {
    const settings = getGmailApiSettings(process.env);
    if (!settings) throw new Error('GMAIL_API_NOT_CONFIGURED');
    const smtpSettings = getGmailSettings(process.env);
    await sendWithGmailSmtpFallback(
      () => getApiTransport(settings).send([recipient], message),
      () => {
        if (!smtpSettings) throw new Error('GMAIL_SMTP_FALLBACK_NOT_CONFIGURED');
        return sendGmailMessage(getTransporter(smtpSettings), smtpSettings, recipient, message);
      },
      smtpSettings !== null
    );
    return;
  }

  if (getDeliveryProvider() !== 'smtp') throw new Error('GMAIL_PROVIDER_INVALID');
  const settings = getGmailSettings(process.env);
  if (!settings) throw new Error('GMAIL_NOT_CONFIGURED');
  await sendGmailMessage(getTransporter(settings), settings, recipient, message);
}

export async function sendGmailBatchEmail(recipients: string[], message: EmailMessage): Promise<void> {
  if (recipients.length === 0) return;

  if (getDeliveryProvider() === 'api') {
    const settings = getGmailApiSettings(process.env);
    if (!settings) throw new Error('GMAIL_API_NOT_CONFIGURED');
    const smtpSettings = getGmailSettings(process.env);
    await sendWithGmailSmtpFallback(
      () => getApiTransport(settings).send(recipients, message),
      () => {
        if (!smtpSettings) throw new Error('GMAIL_SMTP_FALLBACK_NOT_CONFIGURED');
        return sendGmailBatch(getTransporter(smtpSettings), smtpSettings, recipients, message);
      },
      smtpSettings !== null
    );
    return;
  }

  if (getDeliveryProvider() !== 'smtp') throw new Error('GMAIL_PROVIDER_INVALID');
  const settings = getGmailSettings(process.env);
  if (!settings) throw new Error('GMAIL_NOT_CONFIGURED');
  await sendGmailBatch(getTransporter(settings), settings, recipients, message);
}
