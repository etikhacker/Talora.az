'use client';

import { PageHeading } from '@/components/layout/page-heading';
import React, { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { Profile } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Activity, Clock3, GraduationCap, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils/date';

interface StudentAction {
  kind: 'application_submitted' | 'task_submitted' | 'enrolled' | 'internship_completed';
  at: string;
  title: string;
  program: string;
  status: string;
}

interface StudentActivity {
  last_sign_in_at: string | null;
  last_seen_at: string | null;
  events: StudentAction[];
}

function formatDateTime(value: string | null): string {
  if (!value) return 'Məlumat yoxdur';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Məlumat yoxdur';
  return new Intl.DateTimeFormat('az-AZ', {
    timeZone: 'Asia/Baku',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const actionNames: Record<StudentAction['kind'], string> = {
  application_submitted: 'Təcrübəyə müraciət göndərib',
  task_submitted: 'Tapşırıq təqdim edib',
  enrolled: 'Təcrübə proqramına qəbul olunub',
  internship_completed: 'Təcrübə proqramını tamamlayıb',
};

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [activity, setActivity] = useState<StudentActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const requestToken = useRef(0);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (isConfigured) {
        const supabase = createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'student')
            .order('created_at', { ascending: false });
          if (isMounted && data && !error) setStudents(data as Profile[]);
        }
      }
      if (isMounted) setLoading(false);
    }
    void load();
    return () => { isMounted = false; };
  }, [isConfigured]);

  const closeStudent = () => {
    requestToken.current += 1;
    setSelected(null);
  };

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        requestToken.current += 1;
        setSelected(null);
      }
    };
    document.addEventListener('keydown', onEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onEscape);
    };
  }, [selected]);

  const openStudent = async (student: Profile) => {
    const token = ++requestToken.current;
    setSelected(student);
    setActivity(null);
    setActivityError(null);
    setActivityLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setActivityError('Verilənlər bazasına bağlantı mövcud deyil.');
      setActivityLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.rpc('get_admin_student_activity', {
        p_profile_id: student.id,
      });
      if (token !== requestToken.current) return;
      if (error || !data || typeof data !== 'object') {
        setActivityError('Aktivlik məlumatları yüklənmədi. Admin icazələrini yoxlayın.');
      } else {
        const result = data as unknown as StudentActivity;
        setActivity({
          last_sign_in_at: result.last_sign_in_at ?? null,
          last_seen_at: result.last_seen_at ?? null,
          events: Array.isArray(result.events) ? result.events : [],
        });
      }
    } catch {
      if (token === requestToken.current) setActivityError('Aktivlik məlumatları yüklənmədi.');
    } finally {
      if (token === requestToken.current) setActivityLoading(false);
    }
  };

  const filtered = students.filter((student) => {
    const query = searchTerm.trim().toLowerCase();
    return (
      student.full_name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.university?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <PageHeading embedded
          title={<>Qeydiyyatdan Keçmiş Tələbələr</>}
          description={<>Tələbə profilini açaraq son giriş və fəaliyyət tarixçəsinə baxın.</>}
        />
        <Badge variant="default" className="bg-amber-400/20 text-amber-300 border-amber-400/30 w-fit">
          {students.length} Tələbə
        </Badge>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Tələbə adı, universitet və ya e-poçt ilə axtarın..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="pl-9 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
        />
      </div>

      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              {loading ? 'Yüklənir...' : 'Heç bir tələbə tapılmadı.'}
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tələbə</th>
                  <th className="px-4 py-3 font-semibold">Universitet</th>
                  <th className="px-4 py-3 font-semibold">E-poçt</th>
                  <th className="px-4 py-3 font-semibold">Telefon</th>
                  <th className="px-4 py-3 font-semibold">Qeydiyyat tarixi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((student) => (
                  <tr
                    key={student.id}
                    className="cursor-pointer transition-colors hover:bg-slate-800/60"
                    onClick={() => void openStudent(student)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={student.avatar_url} fallback={student.full_name} size="sm" className="ring-slate-700" />
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); void openStudent(student); }}
                          aria-label={student.full_name + ' — aktivliyə bax'}
                          className="text-left font-semibold text-white hover:text-blue-300 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                        >
                          {student.full_name}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        {student.university || 'Qeyd olunmayıb'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{student.email}</td>
                    <td className="px-4 py-3">{student.phone || '—'}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-400">{formatDate(student.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6">
          <button type="button" aria-label="Paneli bağla" onClick={closeStudent}
            className="absolute inset-0 cursor-default bg-slate-950/80 backdrop-blur-sm" />
          <section role="dialog" aria-modal="true"
            aria-label={selected.full_name + ' — tələbə aktivliyi'}
            className="relative z-10 max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar src={selected.avatar_url} fallback={selected.full_name} size="md" />
                <div>
                  <h2 className="text-lg font-bold text-white">{selected.full_name}</h2>
                  <p className="text-xs text-slate-400">{selected.email}</p>
                  <p className="mt-1 text-xs text-slate-500">{selected.university || 'Universitet göstərilməyib'}</p>
                </div>
              </div>
              <button type="button" autoFocus aria-label="Bağla" onClick={closeStudent}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {activityLoading ? (
              <p role="status" className="py-10 text-center text-sm text-slate-400">Aktivlik məlumatları yüklənir...</p>
            ) : activityError ? (
              <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{activityError}</p>
            ) : activity ? (
              <>
                <div className="mb-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                    <p className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                      <Clock3 className="h-4 w-4" /> Son uğurlu giriş (Auth)
                    </p>
                    <p className="text-sm font-semibold text-white">{formatDateTime(activity.last_sign_in_at)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                    <p className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                      <Activity className="h-4 w-4" /> Son platforma aktivliyi
                    </p>
                    <p className="text-sm font-semibold text-white">{formatDateTime(activity.last_seen_at)}</p>
                  </div>
                </div>
                <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs leading-relaxed text-slate-400">
                  Son aktivlik yalnız bu funksiyanın işə salındığı tarixdən etibarən qeyd olunur.
                  Aşağıdakı əməliyyatlar isə platformada mövcud olan real müraciət, qəbul və tapşırıq qeydləridir.
                  Saatlar Bakı vaxtı ilə göstərilir.
                </div>
                <h3 className="mb-3 text-sm font-bold text-white">Son əməliyyatlar</h3>
                {activity.events.length > 0 ? (
                  <ol className="space-y-2">
                    {activity.events.map((event, index) => (
                      <li key={event.kind + event.at + index} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-white">
                            {actionNames[event.kind] || 'Platforma əməliyyatı'}
                          </span>
                          <time className="text-[11px] text-slate-400">{formatDateTime(event.at)}</time>
                        </div>
                        <p className="mt-1 text-xs text-slate-300">{event.title}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{event.program} · {event.status}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="rounded-lg border border-slate-800 p-5 text-center text-sm text-slate-400">
                    Hələ müraciət, qəbul və ya tapşırıq fəaliyyəti qeydə alınmayıb.
                  </p>
                )}
              </>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
