'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { getStudentApplications, withdrawApplication } from '@/lib/applications/service';
import { Application } from '@/types/database';
import { formatDate as formatDisplayDate } from '@/lib/utils/date';
import {
  FileText,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
  Mail,
  Undo2,
} from 'lucide-react';

export default function StudentApplicationsPage() {
  const { profile } = useAuth();
  const { language, t } = useLanguage();
  const isAz = language === 'az';

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const refreshData = async () => {
    if (!profile?.id) return;
    try {
      const data = await getStudentApplications(profile.id);
      setApplications(data);
    } catch (err) {
      console.error('Failed to load student applications:', err);
    }
  };

  useEffect(() => {
    if (!profile?.id) return;
    let isMounted = true;
    async function load() {
      try {
        const data = await getStudentApplications(profile!.id);
        if (isMounted) {
          setApplications(data);
        }
      } catch (err) {
        console.error('Failed to load student applications:', err);
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
  }, [profile]);

  const handleWithdraw = async (appId: string) => {
    if (!profile?.id) return;
    const confirm = window.confirm(t('withdrawConfirm'));
    if (!confirm) return;

    setWithdrawingId(appId);
    try {
      const res = await withdrawApplication(appId, profile.id);
      if (res.success) {
        await refreshData();
      } else {
        alert(res.error || t('generalError'));
      }
    } catch (err) {
      console.error('Failed to withdraw application:', err);
    } finally {
      setWithdrawingId(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    return dateStr ? formatDisplayDate(dateStr) : '';
  };

  const getStatusBadge = (status: Application['status']) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {t('statusAccepted')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 gap-1 font-semibold">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            {t('statusRejected')}
          </Badge>
        );
      case 'withdrawn':
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 gap-1 font-medium">
            <Undo2 className="w-3.5 h-3.5 text-slate-400" />
            {t('statusWithdrawn')}
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1 font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {t('statusPending')}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <PageHeading embedded title={<>
            {t('myApplicationsTitle')}
          </>} description={<>
            {t('myApplicationsSubtitle')}
          </>} />
        </div>
        <Link href="/internships">
          <Button size="sm" className="gap-1.5 shadow-xs">
            {isAz ? 'Yeni Müraciət' : 'Explore Internships'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {!loading && applications.length > 0 && (
        <div role="note" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="leading-relaxed">{t('emailSpamFolderNotice')}</p>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="border-slate-200 shadow-2xs overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-2xs uppercase">
                        {app.internship?.category || 'İnternship'}
                      </Badge>
                      <span className="text-2xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {t('appliedOn')}: {formatDate(app.created_at)}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {app.internship?.title || (isAz ? 'Təcrübə Proqramı' : 'Internship Program')}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(app.status)}
                    {app.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={withdrawingId === app.id}
                        onClick={() => handleWithdraw(app.id)}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2.5"
                      >
                        {withdrawingId === app.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          t('withdrawApplication')
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Body Details */}
                <div className="pt-4 space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block mb-1">
                      {t('motivationLabel')}
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-3">
                      {app.motivation}
                    </p>
                  </div>

                  {/* Admin Note if provided */}
                  {app.admin_note && (
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
                      <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        {t('adminNoteLabel')}
                      </span>
                      <p className="text-blue-800 leading-relaxed">
                        {app.admin_note}
                      </p>
                    </div>
                  )}

                  {/* Accepted Next Steps */}
                  {app.status === 'accepted' && (
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {isAz
                          ? 'Təbriklər! Siz bu proqrama qəbul edildiniz.'
                          : 'Congratulations! You have been enrolled in this cohort.'}
                      </span>
                      <Link href="/dashboard/internship">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8">
                          {t('activeInternshipTitle')}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {t('noApplications')}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
              {isAz
                ? 'Açıq təcrübə proqramlarını nəzərdən keçirin və karyera hədəflərinizə uyğun qrupa müraciət edin.'
                : 'Browse available internship cohorts and apply for positions matching your career aspirations.'}
            </p>
            <Link href="/internships">
              <Button size="sm" className="gap-1.5 shadow-xs">
                {isAz ? 'Təcrübə proqramlarına bax' : 'Explore Internships'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
