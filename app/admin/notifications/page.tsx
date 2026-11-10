'use client';

import { useEffect, useState } from 'react';
import { PageHeading } from '@/components/layout/page-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ANNOUNCEMENT_AUDIENCE_LABELS, type AnnouncementAudience, type AnnouncementChannel } from '@/lib/announcements/validation';
import { Bell, Send, X, RefreshCw, Users, CheckCircle2, AlertCircle } from 'lucide-react';

interface AnnouncementRecord {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  recipient_email: string | null;
  delivered_count: number;
  delivery_channel: AnnouncementChannel;
  email_delivery: EmailSummary | null;
  created_at: string;
}

interface StudentOption {
  id: string;
  full_name: string | null;
  email: string;
}

interface EmailSummary {
  queued_count: number;
  sending_count: number;
  sent_count: number;
  failed_count: number;
  uncertain_count: number;
}

const channelLabels: Record<AnnouncementChannel, string> = {
  in_app: 'Saytdaxili bildiriş',
  email: 'E-poçt',
  both: 'Saytdaxili + e-poçt',
};

const emptyForm = () => ({
  title: '',
  body: '',
  audience: 'all' as AnnouncementAudience,
  recipientEmail: '',
  channel: 'in_app' as AnnouncementChannel,
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
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!composerOpen || form.audience !== 'individual') return;
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      setStudentsLoading(true);
      setStudentsError(null);
      try {
        const response = await fetch(
          '/api/admin/announcements/students?search=' + encodeURIComponent(studentSearch.trim()),
          { credentials: 'same-origin', cache: 'no-store', signal: abort.signal },
        );
        if (!response.ok) throw new Error('STUDENTS_UNAVAILABLE');
        const result = await response.json() as { students: StudentOption[] };
        if (!abort.signal.aborted) setStudents(result.students || []);
      } catch {
        if (!abort.signal.aborted) setStudentsError('Tələbələri yükləmək mümkün olmadı.');
      } finally {
        if (!abort.signal.aborted) setStudentsLoading(false);
      }
    }, 200);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [composerOpen, form.audience, studentSearch]);

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

  const processEmailQueue = async (
    announcementId: string,
    retryFailed = false,
    retryUncertain = false,
  ): Promise<EmailSummary | null> => {
    setProcessingId(announcementId);
    let lastSummary: EmailSummary | null = null;
    try {
      // Bounded synchronous delivery; remaining jobs persist for resume.
      for (let i = 0; i < 20; i += 1) {
        const response = await fetch('/api/admin/announcements/deliver-emails', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: announcementId,
            retryFailed: i === 0 && retryFailed,
            retryUncertain: i === 0 && retryUncertain,
            confirmPossibleDuplicate: retryUncertain,
          }),
        });
        const result = await response.json() as {
          error?: string;
          processed?: number;
          summary?: EmailSummary | null;
        };
        if (!response.ok) throw new Error(result.error || 'E-poçt göndərişində xəta baş verdi.');
        lastSummary = result.summary || lastSummary;
        if (!result.processed || !result.summary?.queued_count) break;
      }
      return lastSummary;
    } finally {
      setProcessingId(null);
      await refresh();
    }
  };

  const resumeEmails = async (id: string, retryFailed = false, retryUncertain = false) => {
    if (processingId) return;
    if (retryUncertain && !window.confirm(
      'Göndərişin nəticəsi qeyri-müəyyəndir. Gmail Sent qovluğunu yoxlamısınız? Təkrar email gedə bilər.'
    )) return;
    if (retryFailed && !window.confirm('Uğursuz email göndərişlərini yenidən sınamaq istəyirsiniz?')) return;
    setError(null);
    try {
      const result = await processEmailQueue(id, retryFailed, retryUncertain);
      setSuccess(result
        ? `E-poçt: ${result.sent_count} göndərildi, ${result.failed_count} uğursuz, ${result.uncertain_count} yoxlama tələb edir, ${result.queued_count} növbədə.`
        : 'Göndəriş statusu yeniləndi.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email göndərişi alınmadı. Tarixçədən yenidən sınayın.');
    }
  };

  const openComposer = () => {
    setForm(emptyForm());
    setStudentSearch('');
    setStudents([]);
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
    if (form.audience === 'individual' && !form.recipientEmail) {
      setError('Siyahıdan tələbə seçin.');
      return;
    }
    if (!window.confirm(
      `“${form.title.trim()}” elanını ${audienceLabel.toLowerCase()} üçün ${channelLabels[form.channel].toLowerCase()} ilə göndərmək istəyirsiniz? Göndərişi geri qaytarmaq mümkün deyil.`
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
      const result = await response.json() as { error?: string; deliveredCount?: number; emailQueued?: number; id?: string };
      if (!response.ok) {
        throw new Error(result.error || 'Elan göndərilmədi.');
      }
      setComposerOpen(false);
      setRequestId('');
      setSuccess(`Saytdaxili: ${result.deliveredCount ?? 0} · E-poçt növbəsi: ${result.emailQueued ?? 0}`);
      await refresh();
      if ((result.emailQueued ?? 0) > 0 && result.id) {
        try {
          const summary = await processEmailQueue(result.id);
          if (summary) setSuccess(
            `Saytdaxili: ${result.deliveredCount ?? 0} · E-poçt: ${summary.sent_count} göndərildi, ${summary.failed_count} uğursuz, ${summary.uncertain_count} yoxlama tələb edir, ${summary.queued_count} növbədə.`
          );
        } catch (emailError) {
          setSuccess(`Elan yadda saxlanıldı. E-poçt növbədədir: ${emailError instanceof Error ? emailError.message : 'Tarixçədən davam edin.'}`);
        }
      }
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
          description="Tələbələrə saytdaxili bildiriş və ya e-poçt göndərilməsi" />
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
      {error && !composerOpen && (
        <div role="alert" className="rounded-xl border border-red-700/40 bg-red-950/30 p-4 text-sm text-red-300">
          {error}
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
                      <Users className="w-3.5 h-3.5" /> {item.delivered_count} saytdaxili
                    </span>
                    <div className="mt-1">{channelLabels[item.delivery_channel] || 'Saytdaxili bildiriş'}</div>
                    {item.email_delivery && (
                      <div className="mt-1 text-slate-300">
                        Email: {item.email_delivery.sent_count} göndərildi
                        {item.email_delivery.queued_count > 0 && ` · ${item.email_delivery.queued_count} növbədə`}
                        {item.email_delivery.failed_count > 0 && ` · ${item.email_delivery.failed_count} uğursuz`}
                        {item.email_delivery.uncertain_count > 0 && ` · ${item.email_delivery.uncertain_count} yoxlanmalıdır`}
                      </div>
                    )}
                    <div className="mt-1">{new Date(item.created_at).toLocaleString('az-AZ')}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap break-words">{item.body}</p>
                {item.email_delivery && (
                  <div className="flex flex-wrap gap-2">
                    {item.email_delivery.queued_count > 0 && (
                      <Button type="button" variant="outline" size="sm" disabled={!!processingId}
                        onClick={() => void resumeEmails(item.id)}>
                        {processingId === item.id ? 'Göndərilir...' : 'Email göndərişini davam et'}
                      </Button>
                    )}
                    {item.email_delivery.sending_count > 0 && (
                      <Button type="button" variant="outline" size="sm" disabled={!!processingId}
                        onClick={() => void resumeEmails(item.id)}>
                        Göndəriş statusunu yoxla
                      </Button>
                    )}
                    {item.email_delivery.failed_count > 0 && (
                      <Button type="button" variant="outline" size="sm" disabled={!!processingId}
                        onClick={() => void resumeEmails(item.id, true)}>
                        Uğursuzları yenidən göndər
                      </Button>
                    )}
                    {item.email_delivery.uncertain_count > 0 && (
                      <Button type="button" variant="outline" size="sm" disabled={!!processingId}
                        onClick={() => void resumeEmails(item.id, false, true)}>
                        Yoxlanmış emaili yenidən göndər
                      </Button>
                    )}
                  </div>
                )}
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
                <p className="text-sm text-slate-400 mt-1">Göndəriş kanalını və alıcıları seçin.</p>
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
                  <label htmlFor="announcement-student-search" className="block text-sm font-semibold">Tələbə seçin</label>
                  <input id="announcement-student-search" type="search" maxLength={80}
                    value={studentSearch} onChange={event => setStudentSearch(event.target.value)}
                    disabled={sending} placeholder="Ad, soyad və ya e-poçt ilə axtar..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950"
                    role="group" aria-label="Tələbə siyahısı">
                    {studentsLoading ? <p className="p-3 text-sm text-slate-400">Tələbələr yüklənir...</p>
                      : studentsError ? <p role="alert" className="p-3 text-sm text-rose-300">{studentsError}</p>
                      : students.length === 0 ? <p className="p-3 text-sm text-slate-400">Tələbə tapılmadı.</p>
                      : students.map(student => (
                        <button key={student.id} type="button" disabled={sending}
                          aria-pressed={form.recipientEmail === student.email}
                          onClick={() => setForm(prev => ({ ...prev, recipientEmail: student.email }))}
                          className={`w-full border-b border-slate-800 p-3 text-left text-sm hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-blue-400 ${form.recipientEmail === student.email ? 'bg-blue-950/50 text-blue-200' : 'text-slate-200'}`}>
                          <span className="block font-semibold">{student.full_name || 'Adsız tələbə'}</span>
                          <span className="block truncate text-xs text-slate-400">{student.email}</span>
                        </button>
                      ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    {form.recipientEmail ? `Seçilib: ${form.recipientEmail}` : 'Siyahıdan tələbəni seçin.'}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="announcement-channel" className="block text-sm font-semibold">Göndəriş kanalı</label>
                <select id="announcement-channel" value={form.channel}
                  onChange={event => setForm(prev => ({ ...prev, channel: event.target.value as AnnouncementChannel }))}
                  disabled={sending} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="in_app">Saytdaxili bildiriş</option>
                  <option value="email">Yalnız e-poçt</option>
                  <option value="both">Hər ikisi</option>
                </select>
              </div>
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
