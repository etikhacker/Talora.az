'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { Profile } from '@/types/database';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Users, GraduationCap, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils/date';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (isConfigured) {
        const supabase = createClient();
        if (supabase) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'student')
            .order('created_at', { ascending: false });
          if (isMounted && data) setStudents(data as Profile[]);
        }
      }
      if (isMounted) setLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, [isConfigured]);

  const filtered = students.filter(
    (s) =>
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.university?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <PageHeading embedded title={<>
            Qeydiyyatdan Keçmiş Tələbələr
          </>} description={<>
            Platformada qeydiyyatdan keçmiş bütün tələbə profilləri
          </>} />
        </div>
        <Badge variant="default" className="bg-amber-400/20 text-amber-300 border-amber-400/30 w-fit">
          {students.length} Tələbə
        </Badge>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Tələbə adı, universitet və ya e-poçt ilə axtarın..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
                  <th className="px-6 py-3 font-semibold">Tələbə</th>
                  <th className="px-6 py-3 font-semibold">Universitet</th>
                  <th className="px-6 py-3 font-semibold">E-poçt</th>
                  <th className="px-6 py-3 font-semibold">Telefon</th>
                  <th className="px-6 py-3 font-semibold">Qeydiyyat Tarixi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5 flex items-center gap-3">
                      <Avatar
                        src={student.avatar_url}
                        fallback={student.full_name}
                        size="sm"
                        className="ring-slate-700"
                      />
                      <span className="font-semibold text-white">
                        {student.full_name}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{student.university || 'Qeyd olunmayıb'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-400 text-[11px]">
                      {student.email}
                    </td>
                    <td className="px-6 py-3.5 text-slate-300">
                      {student.phone || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 text-[11px]">
                      {formatDate(student.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
