import {
  normalizeNotificationPreferences,
  type NotificationPreferences,
} from '../notification-preferences.ts';

export interface GmailSettings {
  host: 'smtp.gmail.com';
  port: 465;
  secure: true;
  user: string;
  password: string;
  from: string;
}

export interface EmailMessage {
  subject: string;
  text: string;
}

export interface GmailMessageTransport {
  sendMail(message: { from: string; to: string; subject: string; text: string }): Promise<unknown>;
}

export function sendGmailMessage(
  transport: GmailMessageTransport,
  settings: GmailSettings,
  recipient: string,
  message: EmailMessage
): Promise<unknown> {
  return transport.sendMail({
    from: settings.from,
    to: recipient,
    subject: message.subject,
    text: message.text,
  });
}

export interface GmailBatchMessageTransport {
  sendMail(message: { from: string; to: string; bcc: string[]; subject: string; text: string }): Promise<unknown>;
}

export function sendGmailBatch(
  transport: GmailBatchMessageTransport,
  settings: GmailSettings,
  recipients: string[],
  message: EmailMessage
): Promise<unknown> {
  return transport.sendMail({
    from: settings.from,
    to: 'undisclosed-recipients:;',
    bcc: recipients,
    subject: message.subject,
    text: message.text,
  });
}

export function getGmailSettings(
  env: Record<string, string | undefined>
): GmailSettings | null {
  const user = env.GMAIL_USER?.trim().toLowerCase();
  const password = env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');

  if (!user || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user) || !password || password.length !== 16) {
    return null;
  }

  return {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    user,
    password,
    from: `Talora Bildirişləri <${user}>`,
  };
}

export function shouldSendNotification(
  userMetadata: unknown,
  category: keyof NotificationPreferences
): boolean {
  if (!userMetadata || typeof userMetadata !== 'object' || Array.isArray(userMetadata)) {
    return normalizeNotificationPreferences(null)[category];
  }

  const notificationPreferences = (userMetadata as Record<string, unknown>).notification_preferences;
  return normalizeNotificationPreferences(notificationPreferences)[category];
}

export function buildApplicationStatusEmail(input: {
  fullName: string;
  internshipTitle: string;
  status: 'accepted' | 'rejected';
  applicationUrl: string;
}): EmailMessage {
  const statusLabel = input.status === 'accepted' ? 'qəbul edildi' : 'rədd edildi';
  // Admin notes can contain internal feedback; never include them in student-facing email.
  const text = [
    `Salam ${input.fullName},`,
    '',
    `“${input.internshipTitle}” proqramına müraciətiniz ${statusLabel}.`,
    '',
    `Müraciətinizə baxın: ${input.applicationUrl}`,
    '',
    'Talora.az',
  ]
    .filter((line, index, lines) => line !== '' || lines[index - 1] !== '')
    .join('\n');

  return {
    subject: `Müraciət statusu: ${statusLabel}`,
    text,
  };
}

export function buildInternshipAnnouncementEmail(input: {
  title: string;
  shortDescription: string;
  internshipUrl: string;
}): EmailMessage {
  return {
    subject: `Yeni təcrübə proqramı: ${input.title}`,
    text: [
      'Salam,',
      '',
      `Talora.az-da yeni təcrübə proqramı yayımlandı: ${input.title}`,
      input.shortDescription,
      '',
      `Proqrama baxın: ${input.internshipUrl}`,
      '',
      'Talora.az',
    ].join('\n'),
  };
}
