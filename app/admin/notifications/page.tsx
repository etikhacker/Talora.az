'use client';

import { useEffect, useState } from 'react';
import { PageHeading } from '@/components/layout/page-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ANNOUNCEMENT_AUDIENCE_LABELS, type AnnouncementAudience } from '@/lib/announcements/validation';
import { Bell, Send, X, RefreshCw, Users, CheckCircle2, AlertCircle } from 'lucide-react';

interface AnnouncementRecord {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  recipient_email: string | null;
  delivered_count: number;
  created_at: string;
}

const emptyForm = () => ({
  title: '',
  body: '',
  audience: 'all' as AnnouncementAudience,
  recipientEmail: '',
});

export default function AdminNotificationsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [requestId, setRequestId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void fetch('/api/admin/announcements', { cache: 'no-store', credentials: 'same-origin' })
      .then(async response => {
        if (!response.ok) throw new Error('HISTORY_UNAVAILABLE');
        return response.json() as Promise<{ announcements: AnnouncementRecord[] }>;
      })
      .then(result => {
        if (mounted) {
          setAnnouncements(result.announcements || []);
          setLoadingError(null);
        }
      })
      .catch(() => {
        if (mounted) setLoadingError('Elan tarixçəsi yüklənmədi. Yenidən yoxlayın.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/announcements', {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error('HISTORY_UNAVAILABLE');
      const result = await response.json() as { announcements: AnnouncementRecord[] };
      setAnnouncements(result.announcements || []);
      setLoadingError(null);
    } catch {
      setLoadingError('Elan tarixçəsi yüklənmədi. Yenidən yoxlayın.');
    } finally {
      setLoading(false);
    }
  };

  const openComposer = () => {
    setForm(emptyForm());
    setRequestId(crypto.randomUUID());
    setError(null);
    setSuccess(null);
    setComposerOpen(true);
  };

  const publish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending || !requestId) return;
    setError(null);
    const audienceLabel = ANNOUNCEMENT_AUDIENCE_LABELS[form.audience];
    if (!window.confirm(
      `“${form.title.trim()}” elanını ${audienceLabel.toLowerCase()} üçün saytdaxili bildiriş kimi göndərmək istəyirsiniz? Göndərişi geri qaytarmaq mümkün deyil.`
    )) return;

    setSending(true);
    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          recipientEmail: form.audience === 'individual' ? form.recipientEmail : null,
          requestId,
        }),
      });
      const result = await response.json() as { error?: string; deliveredCount?: number; id?: string };
      if (!response.ok) {
        throw new Error(result.error || 'Elan göndərilmədi.');
      }
      setSuccess(`Elan ${result.deliveredCount ?? 0} tələbənin saytdaxili bildirişlərinə əlavə olundu.`);
      setComposerOpen(false);
      setRequestId('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Göndəriş baş tutmadı.');
      // Preserve requestId. Repeated requests cannot create duplicate messages.
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <PageHeading embedded title="Bildirişlər və Elanlar"
          description="Tələbələrə saytdaxili kütləvi və ya fərdi elanların göndərilməsi" />
        <Button type="button" onClick={openComposer} size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shrink-0">
          <Send className="w-4 h-4" /> Yeni Elan Göndər
        </Button>
      </div>

      {success && (
        <div role="status" className="rounded-xl border border-emerald-700/40 bg-emerald-950/30 p-4 text-sm text-emerald-300 flex gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" /> {success}
        </div>
      )}
      {loadingError && (
        <div role="alert" className="rounded-xl border border-red-700/40 bg-red-950/30 p-4 text-sm text-red-300 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {loadingError}</span>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>Yenilə</Button>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-white">Göndərilmiş elanlar</h2>
        <Button type="button" variant="outline" size="sm" disabled={loading}
          onClick={() => void refresh()} className="gap-1.5 border-slate-700 text-slate-300">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Yenilə
        </Button>
      </div>

      {loading ? (
        <div role="status" className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400">
          Elan tarixçəsi yüklənir...
        </div>
      ) : announcements.length === 0 && !loadingError ? (
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Göndərilmiş elan tarixçəsi boşdur</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              “Yeni Elan Göndər” düyməsi ilə tələbələrin bildiriş qutusuna elan əlavə edə bilərsiniz.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map(item => (
            <Card key={item.id} className="border-slate-800 bg-slate-900 text-white">
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-bold break-words">{item.title}</h3>
                    <p className="text-xs text-slate-400">
                      {ANNOUNCEMENT_AUDIENCE_LABELS[item.audience]}
                      {item.recipient_email && ` · ${item.recipient_email}`}
                    </p>
                  </div>
                  <div className="text-xs text-slate-400 sm:text-right shrink-0">
                    <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                      <Users className="w-3.5 h-3.5" /> {item.delivered_count} bildiriş
                    </span>
                    <div className="mt-1">{new Date(item.created_at).toLocaleString('az-AZ')}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap break-words">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {composerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="announcement-dialog-title"
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-7 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 id="announcement-dialog-title" className="text-xl font-bold">Yeni elan göndər</h2>
                <p className="text-sm text-slate-400 mt-1">Bildiriş yalnız tələbənin Talora hesabında görünəcək; e-poçt göndərilmir.</p>
              </div>
              <button type="button" onClick={() => { if (!sending) setComposerOpen(false); }}
                disabled={sending} aria-label="Bağla" className="rounded-lg p-2 hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="space-y-5" onSubmit={event => void publish(event)}>
              <div className="space-y-2">
                <label htmlFor="announcement-audience" className="block text-sm font-semibold">Alıcı qrupu</label>
                <select id="announcement-audience" value={form.audience}
                  onChange={event => setForm(prev => ({ ...prev, audience: event.target.value as AnnouncementAudience, recipientEmail: '' }))}
                  disabled={sending} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">Bütün tələbələr</option>
                  <option value="active">Aktiv təcrübəçilər</option>
                  <option value="individual">Fərdi tələbə</option>
                </select>
              </div>
              {form.audience === 'individual' && (
                <div className="space-y-2">
                  <label htmlFor="announcement-recipient" className="block text-sm font-semibold">Tələbənin e-poçtu</label>
                  <input id="announcement-recipient" type="email" required maxLength={254}
                    value={form.recipientEmail} onChange={event => setForm(prev => ({ ...prev, recipientEmail: event.target.value }))}
                    disabled={sending} placeholder="telebe@example.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="announcement-title" className="block text-sm font-semibold">Başlıq</label>
                <input id="announcement-title" required minLength={5} maxLength={120} disabled={sending}
                  value={form.title} onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))}
                  placeholder="Məsələn: Yeni təcrübə proqramı"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-slate-500 text-right">{form.title.length}/120</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="announcement-body" className="block text-sm font-semibold">Elan mətni</label>
                <textarea id="announcement-body" required minLength={10} maxLength={2000} rows={6}
                  disabled={sending} value={form.body} onChange={event => setForm(prev => ({ ...prev, body: event.target.value }))}
                  placeholder="Tələbələrə göndəriləcək məlumatı daxil edin..."
                  className="w-full resize-y rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-slate-500 text-right">{form.body.length}/2000</p>
              </div>
              {error && <p role="alert" className="rounded-lg bg-red-950/40 border border-red-800/40 px-4 py-3 text-sm text-red-300">{error}</p>}
              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="outline" disabled={sending}
                  onClick={() => setComposerOpen(false)} className="border-slate-700 text-slate-200">Ləğv et</Button>
                <Button type="submit" disabled={sending} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Göndərilir...' : 'Elanı göndər'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
