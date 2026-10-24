'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { formatDate } from '@/lib/utils/date';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileBadge, RefreshCw, Search, Users, GraduationCap, ArrowUpRight } from 'lucide-react';

type CompletedEnrollment = {
  id: string;
  student_id: string;
  internship_id: string;
  status: string;
  completed_at: string | null;
  enrolled_at: string;
  student: { full_name: string | null; email: string | null; university: string | null } | null;
  internship: { title: string; slug: string } | null;
};

export default function AdminCompletedInternshipsPage() {
  const [rows, setRows] = useState<CompletedEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchRows = useCallback(async (): Promise<{
    rows: CompletedEnrollment[];
    error: string | null;
  }> => {
    if (!isSupabaseConfigured()) {
      return { rows: [], error: 'Supabase konfiqurasiya edilməyib.' };
    }

    const supabase = createClient();
    if (!supabase) {
      return { rows: [], error: 'Verilənlər bazası ilə əlaqə qurulmadı.' };
    }

    const { data, error: queryError } = await supabase
      .from('enrollments')
      .select('id, student_id, internship_id, status, completed_at, enrolled_at, student:profiles!enrollments_student_id_fkey(full_name, email, university), internship:internships(title, slug)')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (queryError) {
      return {
        rows: [],
        error: 'Tamamlanmış təcrübələr yüklənmədi. İcazələri və verilənlər bazası bağlantısını yoxlayın.',
      };
    }

    return { rows: (data || []) as unknown as CompletedEnrollment[], error: null };
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchRows();
      setRows(result.rows);
      setError(result.error);
    } catch {
      setRows([]);
      setError('Məlumatlar yüklənərkən gözlənilməz xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  }, [fetchRows]);

  useEffect(() => {
    let cancelled = false;

    // fetchRows resolves asynchronously; state updates happen after the request completes.
    void fetchRows()
      .then((result) => {
        if (cancelled) return;
        setRows(result.rows);
        setError(result.error);
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        setError('Məlumatlar yüklənərkən gözlənilməz xəta baş verdi.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchRows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.student?.full_name, row.student?.email, row.student?.university, row.internship?.title]
        .some((value) => value?.toLocaleLowerCase().includes(q))
    );
  }, [rows, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <PageHeading embedded title={<>Tamamlanmış Təcrübələr</>} description={<>
            Bütün tələb olunan tapşırıqları təsdiqlənmiş və tamamlanma statusu verilmiş təcrübəçilər.
          </>} />
        </div>
        <Button onClick={() => void loadRows()} disabled={loading} variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenilə
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-slate-800 bg-slate-900 text-white">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Tamamlanmış qeydiyyatlar</p>
              <p className="mt-1 text-2xl font-bold">{loading ? '—' : rows.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900 text-white">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Siyahıda göstərilən nəticə</p>
              <p className="mt-1 text-2xl font-bold">{loading ? '—' : filteredRows.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tələbə, universitet və ya proqram axtar..."
            aria-label="Tamamlanmış təcrübələrdə axtar"
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
          />
        </div>
        <Link href="/admin/certificates" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200">
          Sertifikatların idarəsi <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <Card className="overflow-hidden border-slate-800 bg-slate-900 text-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-400">
              <RefreshCw className="h-4 w-4 animate-spin" /> Məlumatlar yüklənir...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-amber-300">
                <FileBadge className="h-7 w-7" />
              </div>
              <h2 className="text-base font-bold text-white">
                {rows.length === 0 ? 'Hələlik tamamlanmış təcrübə yoxdur' : 'Axtarış üzrə nəticə tapılmadı'}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-400">
                {rows.length === 0
                  ? 'Tələb olunan tapşırıqlar təsdiqlənib qeydiyyat tamamlandıqdan sonra nəticələr burada görünəcək.'
                  : 'Axtarış sözünü dəyişdirin və ya filtri təmizləyin.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Tələbə</th>
                    <th className="px-5 py-4 font-semibold">Təcrübə proqramı</th>
                    <th className="px-5 py-4 font-semibold">Tamamlanma tarixi</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-slate-800/40">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{row.student?.full_name || 'Ad göstərilməyib'}</p>
                        <p className="mt-1 text-xs text-slate-400">{row.student?.email || 'E-poçt göstərilməyib'}</p>
                        {row.student?.university && <p className="mt-1 text-xs text-slate-500">{row.student.university}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-200">{row.internship?.title || 'Proqram silinib'}</p>
                        {row.internship?.slug && <p className="mt-1 text-xs text-slate-500">{row.internship.slug}</p>}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-300">
                        {row.completed_at ? formatDate(row.completed_at) : 'Tarix qeyd edilməyib'}
                      </td>
                      <td className="px-5 py-4">
                        <Badge className="border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">Tamamlanıb</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
