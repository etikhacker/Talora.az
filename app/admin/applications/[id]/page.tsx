'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { getApplicationById, reviewApplication } from '@/lib/applications/service';
import { Application, ApplicationStatus } from '@/types/database';
import { formatDate as formatDisplayDate } from '@/lib/utils/date';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  School,
  Phone,
  Globe,
  Github,
  Linkedin,
  Calendar,
  Briefcase,
  AlertCircle,
  ShieldCheck,
  Undo2,
  MessageSquare,
} from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function AdminApplicationReviewPage({ params }: Props) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const { user, profile } = useAuth();
  const { language, t } = useLanguage();
  const isAz = language === 'az';

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      const data = await getApplicationById(id);
      if (data) {
        setApplication(data);
        if (data.admin_note) {
          setAdminNote(data.admin_note);
        }
      }
    } catch (err) {
      console.error('Failed to load application:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await getApplicationById(id);
        if (isMounted && data) {
          setApplication(data);
          if (data.admin_note) {
            setAdminNote(data.admin_note);
          }
        }
      } catch (err) {
        console.error('Failed to load application:', err);
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
  }, [id]);

  const handleDecision = async (decision: 'accepted' | 'rejected') => {
    if (!application) return;
    setErrorMessage(null);
    setSuccessNotice(null);

    const actionText = decision === 'accepted' ? (isAz ? 'qəbul etmək' : 'accept') : (isAz ? 'rədd etmək' : 'reject');
    const confirm = window.confirm(
      isAz
        ? `Namizədi bu proqrama ${actionText} istədiyinizə əminsiniz?`
        : `Are you sure you want to ${actionText} this applicant?`
    );
    if (!confirm) return;

    setActionLoading(true);
    try {
      const res = await reviewApplication({
        applicationId: id,
        action: decision === 'accepted' ? 'accept' : 'reject',
        adminNote: adminNote.trim() || undefined,
        adminProfile: profile || {
          id: user?.id || 'admin',
          user_id: user?.id || 'admin',
          email: user?.email || 'admin@talora.az',
          full_name: 'İnzibatçı',
          role: 'admin',
          avatar_url: null,
          phone: null,
          university: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });

      if (!res.success) {
        setErrorMessage(res.error || t('generalError'));
        setActionLoading(false);
        return;
      }

      const successMessage = decision === 'accepted'
        ? (isAz ? 'Müraciət qəbul edildi və tələbə proqrama qeydiyyata alındı!' : 'Application accepted and student enrolled successfully!')
        : (isAz ? 'Müraciət rədd edildi.' : 'Application rejected.');
      setSuccessNotice(
        res.emailWarning
          ? `${successMessage} E-poçt bildirişi göndərilmədi: ${res.emailWarning}`
          : successMessage
      );
      await refreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('generalError');
      setErrorMessage(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    return dateStr ? formatDisplayDate(dateStr) : '—';
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {t('statusAccepted')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 font-semibold gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            {t('statusRejected')}
          </Badge>
        );
      case 'withdrawn':
        return (
          <Badge className="bg-slate-700/50 text-slate-400 border-slate-600 font-semibold gap-1">
            <Undo2 className="w-3.5 h-3.5 text-slate-400" />
            {t('statusWithdrawn')}
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-semibold gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            {t('statusPending')}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-8 text-center text-white">
        <p>{isAz ? 'Müraciət tapılmadı' : 'Application not found'}</p>
        <Link href="/admin/applications">
          <Button variant="outline" size="sm" className="mt-4">
            {isAz ? 'Geri qayıt' : 'Go back'}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/admin/applications">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {getStatusBadge(application.status)}
              <span className="text-2xs text-slate-500 font-mono">
                ID: {application.id.slice(0, 8)}...
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {application.student?.full_name || (isAz ? 'Namizəd Müraciəti' : 'Applicant Review')}
            </h1>
          </div>
        </div>

        <span className="text-xs text-slate-400 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          {formatDate(application.created_at)}
        </span>
      </div>

      {/* Notifications */}
      {successNotice && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Target Internship Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-2xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
            {isAz ? 'Müraciət Edilən Proqram' : 'Target Internship'}
          </span>
          <h2 className="text-base font-bold text-white">
            {application.internship?.title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {application.internship?.category} • {application.internship?.duration_weeks} {t('durationWeeks')}
          </p>
        </div>
        <Link href={`/internships/${application.internship?.slug}`} target="_blank">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs">
            {isAz ? 'Proqram səhifəsi' : 'Program Details'}
          </Button>
        </Link>
      </div>

      {/* Student Details Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-amber-400" />
          {isAz ? 'Namizədin Profil Məlumatları' : 'Applicant Profile'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 block mb-1">{isAz ? 'Ad və Soyad' : 'Full Name'}</span>
            <span className="text-white font-semibold text-sm">{application.student?.full_name || '—'}</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 block mb-1">{isAz ? 'E-poçt' : 'Email'}</span>
            <span className="text-white font-semibold break-all">{application.student?.email || '—'}</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 block mb-1">{isAz ? 'Universitet' : 'University'}</span>
            <span className="text-white font-semibold">{application.student?.university || (isAz ? 'Qeyd edilməyib' : 'Not set')}</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 block mb-1">{isAz ? 'Telefon' : 'Phone'}</span>
            <span className="text-white font-semibold">{application.student?.phone || (isAz ? 'Qeyd edilməyib' : 'Not set')}</span>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/60">
          {application.portfolio_url ? (
            <a
              href={application.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Portfel</span>
            </a>
          ) : null}

          {application.github_url ? (
            <a
              href={application.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700"
            >
              <Github className="w-3.5 h-3.5 text-purple-400" />
              <span>GitHub</span>
            </a>
          ) : null}

          {application.linkedin_url ? (
            <a
              href={application.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700"
            >
              <Linkedin className="w-3.5 h-3.5 text-blue-400" />
              <span>LinkedIn</span>
            </a>
          ) : null}
        </div>
      </div>

      {/* Application Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
          {t('motivationLabel')}
        </h3>
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
          {application.motivation}
        </div>

        {application.experience && (
          <div className="pt-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {t('experienceLabel')}
            </h4>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
              {application.experience}
            </div>
          </div>
        )}
      </div>

      {/* Admin Notes & Decision Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          {isAz ? 'İnzibatçı Qeydi və Qərar' : 'Admin Feedback & Decision'}
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            {t('adminNoteLabel')}
          </label>
          <Textarea
            rows={3}
            placeholder={isAz ? 'Tələbəyə bildiriş üçün və ya daxili qeydlər...' : 'Internal notes or feedback for the student...'}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            className="bg-slate-950 border-slate-800 text-white text-xs placeholder-slate-600"
          />
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-2xs text-slate-500">
            {application.reviewed_at && (
              <span>
                {isAz ? 'Son baxılma:' : 'Reviewed on:'} {formatDate(application.reviewed_at)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              disabled={actionLoading}
              onClick={() => handleDecision('rejected')}
              className="flex-1 sm:flex-none border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>{isAz ? 'Rədd et' : 'Reject'}</span>
            </Button>

            <Button
              type="button"
              disabled={actionLoading}
              onClick={() => handleDecision('accepted')}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-xs"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isAz ? 'Qəbul et və Qeydiyyata al' : 'Accept & Enroll'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
