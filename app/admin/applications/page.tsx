'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/i18n/language-context';
import { getAllApplications } from '@/lib/applications/service';
import { Application, ApplicationStatus } from '@/types/database';
import { formatDate as formatDisplayDate } from '@/lib/utils/date';
import {
  FileCheck2,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Undo2,
  ArrowRight,
  GraduationCap,
  Calendar,
  User,
  Filter,
} from 'lucide-react';

export default function AdminApplicationsPage() {
  const { language, t } = useLanguage();
  const isAz = language === 'az';

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await getAllApplications();
        if (isMounted) {
          setApplications(data);
        }
      } catch (err) {
        console.error('Failed to load applications:', err);
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

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length;
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length;

  const filtered = applications.filter((app) => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const studentName = app.student?.full_name?.toLowerCase() || '';
      const studentEmail = app.student?.email?.toLowerCase() || '';
      const internshipTitle = app.internship?.title?.toLowerCase() || '';
      return (
        studentName.includes(q) ||
        studentEmail.includes(q) ||
        internshipTitle.includes(q)
      );
    }
    return true;
  });

  const formatDate = (dateStr: string | null) => {
    return dateStr ? formatDisplayDate(dateStr) : '';
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold text-2xs gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            {t('statusAccepted')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 font-semibold text-2xs gap-1">
            <XCircle className="w-3 h-3 text-rose-400" />
            {t('statusRejected')}
          </Badge>
        );
      case 'withdrawn':
        return (
          <Badge className="bg-slate-700/50 text-slate-400 border-slate-600 font-semibold text-2xs gap-1">
            <Undo2 className="w-3 h-3 text-slate-400" />
            {t('statusWithdrawn')}
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-semibold text-2xs gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            {t('statusPending')}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <PageHeading embedded title={<>
            {t('adminApplicationsTitle')}
          </>} description={<>
            {t('adminApplicationsSubtitle')}
          </>} />
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {pendingCount} {isAz ? 'baxılmamış müraciət' : 'pending review'}
            </span>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isAz ? 'Tələbə adı, e-poçt və ya proqram...' : 'Search student or internship...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: isAz ? 'Hamısı' : 'All', count: applications.length },
            { id: 'pending', label: t('statusPending'), count: pendingCount },
            { id: 'accepted', label: t('statusAccepted'), count: acceptedCount },
            { id: 'rejected', label: t('statusRejected'), count: rejectedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-amber-400 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-2xs px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(app.status)}
                  <span className="text-2xs font-semibold text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded">
                    {app.internship?.category || 'İnternship'}
                  </span>
                  <span className="text-2xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(app.created_at)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                  <h3 className="text-base font-bold text-white">
                    {app.student?.full_name || (isAz ? 'Anonim Tələbə' : 'Applicant')}
                  </h3>
                  <span className="text-xs text-slate-400">
                    ({app.student?.email})
                  </span>
                </div>

                <p className="text-xs text-amber-400/90 font-medium">
                  {isAz ? 'Müraciət edilən proqram:' : 'Target program:'}{' '}
                  <span className="text-white font-semibold">{app.internship?.title}</span>
                </p>

                <p className="text-xs text-slate-400 line-clamp-1 italic">
                  &ldquo;{app.motivation}&rdquo;
                </p>
              </div>

              {/* Action */}
              <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800 shrink-0">
                <Link href={`/admin/applications/${app.id}`}>
                  <Button
                    size="sm"
                    className={`gap-1.5 text-xs font-semibold ${
                      app.status === 'pending'
                        ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <span>{app.status === 'pending' ? (isAz ? 'İcmal et və Qərar ver' : 'Review & Decide') : (isAz ? 'Detallara bax' : 'View Details')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
              <FileCheck2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {isAz ? 'Müraciət tapılmadı' : 'No Applications Found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {isAz
                ? 'Seçilmiş filtr üzrə heç bir tələbə müraciəti mövcud deyil.'
                : 'No student applications match the selected criteria.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
