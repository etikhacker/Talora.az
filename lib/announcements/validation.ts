export type AnnouncementAudience = 'all' | 'active' | 'individual';

export interface AnnouncementInput {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  recipientEmail: string | null;
  requestId: string;
}

export type AnnouncementValidation =
  | { success: true; value: AnnouncementInput }
  | { success: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAnnouncement(value: unknown): AnnouncementValidation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { success: false, error: 'Elan məlumatları düzgün deyil.' };
  }
  const input = value as Record<string, unknown>;
  if (typeof input.title !== 'string' || typeof input.body !== 'string') {
    return { success: false, error: 'Elanın başlığı və mətni tələb olunur.' };
  }
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 5 || title.length > 120) {
    return { success: false, error: 'Başlıq 5–120 simvol arasında olmalıdır.' };
  }
  if (body.length < 10 || body.length > 2000) {
    return { success: false, error: 'Elan mətni 10–2000 simvol arasında olmalıdır.' };
  }
  if (input.audience !== 'all' && input.audience !== 'active' && input.audience !== 'individual') {
    return { success: false, error: 'Alıcı qrupu düzgün seçilməyib.' };
  }
  if (typeof input.requestId !== 'string' || !UUID.test(input.requestId)) {
    return { success: false, error: 'Göndəriş identifikatoru düzgün deyil.' };
  }
  const recipientEmail = typeof input.recipientEmail === 'string'
    ? input.recipientEmail.trim().toLowerCase()
    : null;
  if (input.audience === 'individual') {
    if (!recipientEmail || recipientEmail.length > 254 || !EMAIL.test(recipientEmail)) {
      return { success: false, error: 'Tələbənin düzgün e-poçt ünvanını daxil edin.' };
    }
  } else if (recipientEmail) {
    return { success: false, error: 'Kütləvi elanda fərdi e-poçt ünvanı göndərilməməlidir.' };
  }

  return {
    success: true,
    value: {
      title,
      body,
      audience: input.audience,
      recipientEmail: input.audience === 'individual' ? recipientEmail : null,
      requestId: input.requestId,
    },
  };
}

export const ANNOUNCEMENT_AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  all: 'Bütün tələbələr',
  active: 'Aktiv təcrübəçilər',
  individual: 'Fərdi tələbə',
};
