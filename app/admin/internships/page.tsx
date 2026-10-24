'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/i18n/language-context';
import { getAllInternships, updateInternship } from '@/lib/internships/service';
import { Internship, InternshipStatus } from '@/types/database';
import {
  Briefcase,
  Plus,
  Edit,
  ExternalLink,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  ListTodo,
} from 'lucide-react';

export default function AdminInternshipsPage() {
  const { language, t } = useLanguage();
  const isAz = language === 'az';

  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const refreshList = async () => {
    try {
      const data = await getAllInternships();
      setInternships(data);
    } catch (err) {
      console.error('Failed to load admin internships:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await getAllInternships();
        if (isMounted) {
          setInternships(data);
        }
      } catch (err) {
        console.error('Failed to load admin internships:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTogglePublish = async (internship: Internship) => {
    const nextStatus: InternshipStatus = internship.status === 'published' ? 'draft' : 'published';
    const actionLabel = nextStatus === 'published' ? (isAz ? 'dərc etmək' : 'publish') : (isAz ? 'qaralamaya keçirmək' : 'unpublish');
    const confirm = window.confirm(
      isAz
        ? `Bu təcrübə proqramını ${actionLabel} istədiyinizə əminsiniz?`
        : `Are you sure you want to ${actionLabel} this internship?`
    );
    if (!confirm) return;

    try {
      const res = await updateInternship(internship.id, { status: nextStatus });
      if (res.success) {
        if (res.notificationWarning) {
          window.alert(isAz
            ? `Proqramın statusu dəyişdi, amma e-poçt bildirişi göndərilmədi: ${res.notificationWarning}`
            : `The program status changed, but its email notification failed: ${res.notificationWarning}`);
        }
        await refreshList();
      } else {
        alert(res.error || t('generalError'));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filtered = internships.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: InternshipStatus) => {
    switch (status) {
      case 'published':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold text-2xs">
            {isAz ? 'Dərc edilib' : 'Published'}
          </Badge>
        );
      case 'draft':
        return (
          <Badge className="bg-slate-700/50 text-slate-300 border-slate-600 font-semibold text-2xs">
            {isAz ? 'Qaralama' : 'Draft'}
          </Badge>
        );
      case 'closed':
        return (
          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 font-semibold text-2xs">
            {isAz ? 'Bağlanıb' : 'Closed'}
          </Badge>
        );
      case 'archived':
        return (
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-semibold text-2xs">
            {isAz ? 'Arxiv' : 'Archived'}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <PageHeading embedded title={<>
            {t('adminInternshipsTitle')}
          </>} description={<>
            {t('adminInternshipsSubtitle')}
          </>} />
        </div>
        <Link href="/admin/internships/new">
          <Button size="sm" className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold gap-1.5 shadow-xs">
            <Plus className="w-4 h-4" />
            {t('createNewInternship')}
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isAz ? 'Proqram adı və ya slug axtarın...' : 'Search title or slug...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'published', 'draft', 'closed', 'archived'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-amber-400 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {st === 'all'
                ? (isAz ? 'Hamısı' : 'All')
                : st === 'published'
                ? (isAz ? 'Dərc edilib' : 'Published')
                : st === 'draft'
                ? (isAz ? 'Qaralama' : 'Draft')
                : st === 'closed'
                ? (isAz ? 'Bağlı' : 'Closed')
                : (isAz ? 'Arxiv' : 'Archived')}
            </button>
          ))}
        </div>
      </div>

      {/* Internships List */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(item.status)}
                  <span className="text-2xs font-medium text-slate-400 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  <span className="text-2xs text-slate-500 font-mono">
                    /{item.slug}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white truncate">
                  {item.title}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {item.duration_weeks} {t('durationWeeks')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    {item.max_students ? `${item.max_students} yer` : (isAz ? 'Limitsiz' : 'Open')}
                  </span>
                  <span className="capitalize text-slate-500">
                    {item.difficulty}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800 shrink-0">
                <button
                  onClick={() => handleTogglePublish(item)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    item.status === 'published'
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                  }`}
                >
                  {item.status === 'published' ? (isAz ? 'Qaralamaya at' : 'Unpublish') : (isAz ? 'Dərc et' : 'Publish')}
                </button>

                <Link href={`/admin/internships/${item.id}/tasks`}>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-200">
                    <ListTodo className="w-3.5 h-3.5" />
                    {isAz ? 'Tapşırıqlar' : 'Tasks'}
                  </Button>
                </Link>

                <Link href={`/admin/internships/${item.id}/edit`}>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white">
                    <Edit className="w-3.5 h-3.5" />
                    {isAz ? 'Redaktə' : 'Edit'}
                  </Button>
                </Link>

                <Link href={`/internships/${item.slug}`} target="_blank">
                  <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-white hover:bg-slate-800 p-2" title={isAz ? 'Saytda bax' : 'View on site'}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
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
                ? 'Yeni təcrübə proqramı yaratmaq üçün yuxarıdakı "Yeni Təcrübə Yarat" düyməsindən istifadə edin.'
                : 'Get started by creating your first corporate internship cohort.'}
            </p>
            <Link href="/admin/internships/new">
              <Button size="sm" className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold gap-1.5">
                <Plus className="w-4 h-4" />
                {t('createNewInternship')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
