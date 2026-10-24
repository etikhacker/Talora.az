'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/i18n/language-context';
import { getAllInternships } from '@/lib/internships/service';
import { createClient } from '@/lib/supabase/client';
import { Internship, InternshipTask } from '@/types/database';
import {
  ListTodo,
  Briefcase,
  ChevronRight,
  CheckCircle2,
  FileText,
  Search,
  Loader2,
} from 'lucide-react';

export default function AdminTasksPage() {
  const { language } = useLanguage();
  const isAz = language === 'az';

  const [internships, setInternships] = useState<Internship[]>([]);
  const [tasks, setTasks] = useState<InternshipTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const internshipList = await getAllInternships();
        setInternships(internshipList);

        const supabase = createClient();
        if (supabase) {
          const { data } = await supabase
            .from('internship_tasks')
            .select('*')
            .order('week_number', { ascending: true });
          setTasks((data as InternshipTask[]) || []);
        } else {
          setTasks([]);
        }
      } catch (err) {
        console.error('Failed to load tasks overview:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalTasks = tasks.length;
  const publishedTasks = tasks.filter((t) => t.status === 'published').length;
  const draftTasks = tasks.filter((t) => t.status === 'draft').length;

  const filteredInternships = internships.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <PageHeading embedded title={<>
            <ListTodo className="w-6 h-6 text-amber-400" />
            <span>{isAz ? 'Tapşırıqlar İdarəetməsi' : 'Task Management'}</span>
          </>} description={<>
            {isAz
              ? 'Təcrübə proqramları üzrə həftəlik praktiki tapşırıqların hazırlanması və idarə edilməsi'
              : 'Manage and curate weekly hands-on tasks across all internship cohorts'}
          </>} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">
                {isAz ? 'Ümumi Tapşırıqlar' : 'Total Tasks'}
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalTasks}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <ListTodo className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">
                {isAz ? 'Dərc Olunmuş' : 'Published Tasks'}
              </p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{publishedTasks}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">
                {isAz ? 'Qaralama Halında' : 'Draft Tasks'}
              </p>
              <h3 className="text-2xl font-bold text-slate-300 mt-1">{draftTasks}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400 border border-slate-700">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            isAz
              ? 'Təcrübə proqramına görə axtar...'
              : 'Search by internship program...'
          }
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
      </div>

      {/* Cohorts List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-400" />
          <p className="text-xs">{isAz ? 'Yüklənir...' : 'Loading...'}</p>
        </div>
      ) : filteredInternships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInternships.map((internship) => {
            const cohortTasks = tasks.filter((t) => t.internship_id === internship.id);
            const pubCount = cohortTasks.filter((t) => t.status === 'published').length;
            const draftCount = cohortTasks.filter((t) => t.status === 'draft').length;

            return (
              <Card
                key={internship.id}
                className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all text-white flex flex-col justify-between"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      {internship.category}
                    </span>
                    <Badge variant={internship.status === 'published' ? 'outline' : 'default'} className={`text-[10px] ${internship.status === 'published' ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : ''}`}>
                      {internship.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-white line-clamp-1">
                    {internship.title}
                  </CardTitle>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {internship.description}
                  </p>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-slate-400">{isAz ? 'Tapşırıq sayı' : 'Tasks'}</span>
                      <p className="font-bold text-white">
                        {cohortTasks.length} {isAz ? 'tapşırıq' : 'tasks'}
                      </p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="text-slate-400">{isAz ? 'Status bölgüsü' : 'Status'}</span>
                      <p className="text-[11px] font-medium text-emerald-400">
                        {pubCount} {isAz ? 'dərc' : 'published'} • {draftCount} {isAz ? 'qaralama' : 'draft'}
                      </p>
                    </div>
                  </div>

                  <Link href={`/admin/internships/${internship.id}/tasks`} className="block">
                    <Button
                      size="sm"
                      className="w-full bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-white font-semibold text-xs justify-between transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <ListTodo className="w-4 h-4 text-amber-400" />
                        {isAz ? 'Tapşırıqları İdarə Et' : 'Manage Cohort Tasks'}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {isAz ? 'Təcrübə proqramı tapılmadı' : 'No Internships Found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
              {isAz
                ? 'Axtarışa uyğun proqram tapılmadı.'
                : 'No cohorts match your current query.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
