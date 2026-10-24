'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { TaskInstructions } from '@/components/tasks/task-instructions';
import { useLanguage } from '@/lib/i18n/language-context';
import { useAuth } from '@/lib/auth/auth-context';
import {
  getSubmissionById,
  reviewSubmission,
  getSubmissionFileUrl,
} from '@/lib/submissions/service';
import { TaskSubmission, SubmissionStatus } from '@/types/database';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ExternalLink,
  Github,
  Download,
  FileText,
  Loader2,
  FileCheck2,
  MessageSquare,
} from 'lucide-react';

export default function AdminSingleSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const submissionId = resolvedParams.id;

  const { language } = useLanguage();
  const isAz = language === 'az';
  const { user } = useAuth();
  const router = useRouter();

  const [submission, setSubmission] = useState<TaskSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminFeedback, setAdminFeedback] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSubmissionById(submissionId);
        setSubmission(data);
        if (data) {
          setAdminFeedback(data.admin_feedback || '');
        }
      } catch (err) {
        console.error('Failed to load submission:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [submissionId]);

  const handleExecuteReview = async (action: 'approve' | 'revision_requested' | 'reject') => {
    if (!submission) return;
    setReviewError('');

    if ((action === 'revision_requested' || action === 'reject') && (!adminFeedback || adminFeedback.trim().length < 5)) {
      setReviewError(
        isAz
          ? 'Düzəliş tələb edildikdə və ya rədd edildikdə tələbə üçün ətraflı rəy qeyd etmək məcburidir (ən azı 5 simvol).'
          : 'Detailed feedback is required when requesting revisions or rejecting (at least 5 characters).'
      );
      return;
    }

    setReviewing(true);
    try {
      const res = await reviewSubmission({
        submissionId: submission.id,
        action,
        adminFeedback: adminFeedback.trim(),
        reviewerId: user?.id,
      });

      if (res.success && res.submission) {
        setSubmission(res.submission);
        router.push('/admin/submissions');
      } else {
        setReviewError(res.error || 'Qərar qeyd edilərkən xəta baş verdi.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xəta baş verdi.';
      setReviewError(msg);
    } finally {
      setReviewing(false);
    }
  };

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" />
            {isAz ? 'Təsdiqlənib' : 'Approved'}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
            <Clock className="w-3.5 h-3.5" />
            {isAz ? 'Gözləmədə' : 'Pending Review'}
          </span>
        );
      case 'revision_requested':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            {isAz ? 'Düzəliş Tələb Edilib' : 'Revision Requested'}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            {isAz ? 'Rədd Edilib' : 'Rejected'}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-400" />
        <p className="text-xs">{isAz ? 'Təqdimat yüklənir...' : 'Loading submission...'}</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/submissions"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {isAz ? 'Bütün təqdimatlara qayıt' : 'Back to Submissions'}
        </Link>
        <Card className="bg-slate-900 border-slate-800 text-white p-8 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white">
            {isAz ? 'Təqdimat tapılmadı' : 'Submission not found'}
          </h3>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link
          href="/admin/submissions"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {isAz ? 'Bütün təqdimatlara qayıt' : 'Back to Submissions'}
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              {isAz ? 'Tələbə Həlli Qiymətləndirməsi' : 'Submission Evaluation'}
            </span>
            <PageHeading embedded title={<>
              {submission.task?.title}
            </>} description={<>
              {isAz ? 'Həftə' : 'Week'} {submission.task?.week_number} • {isAz ? 'Tapşırıq' : 'Task'} #{submission.task?.task_number}
            </>} />
          </div>
          <div>
            {getStatusBadge(submission.status)}
          </div>
        </div>

        {/* Student details */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
          <Avatar
            src={submission.student?.avatar_url}
            fallback={submission.student?.full_name || 'TL'}
            size="md"
            className="ring-slate-700"
          />
          <div>
            <h3 className="text-sm font-bold text-white">
              {submission.student?.full_name}
            </h3>
            <p className="text-xs text-slate-400">
              {submission.student?.email} • {submission.student?.university || 'Tələbə'}
            </p>
          </div>
        </div>

        {/* Task Instructions */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {isAz ? 'Tapşırığın İlkin Tələbləri' : 'Task Requirements'}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {submission.task?.description}
          </p>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <TaskInstructions text={submission.task?.instructions ?? ''} variant="dark" />
          </div>
        </div>

        {/* Student Submission Content */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span>{isAz ? 'Tələbənin Təqdim Etdiyi İş' : 'Submitted Solution'}</span>
          </h4>

          {submission.text_answer && (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">
                {isAz ? 'Mətn İzahı:' : 'Written Answer:'}
              </span>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {submission.text_answer}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {submission.submission_url && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  Live URL:
                </span>
                <a
                  href={submission.submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-sky-400 hover:underline break-all block"
                >
                  {submission.submission_url}
                </a>
              </div>
            )}

            {submission.github_url && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Github className="w-3.5 h-3.5 text-purple-400" />
                  GitHub Repo:
                </span>
                <a
                  href={submission.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-purple-400 hover:underline break-all block"
                >
                  {submission.github_url}
                </a>
              </div>
            )}
          </div>

          {submission.file_path && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-medium text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                {submission.file_name || (isAz ? 'Fayl qoşması' : 'Attachment')}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (!submission.file_path) return;
                  const url = await getSubmissionFileUrl(submission.file_path);
                  if (url && url !== '#') {
                    window.open(url, '_blank');
                  }
                }}
                className="border-slate-700 text-xs gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                {isAz ? 'Yüklə' : 'Download'}
              </Button>
            </div>
          )}

          {submission.comment && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 italic">
              <span className="font-semibold text-amber-400 not-italic mr-1.5">
                {isAz ? 'Tələbə Qeydi:' : 'Student Note:'}
              </span>
              &ldquo;{submission.comment}&rdquo;
            </div>
          )}
        </div>

        {/* Review Action Form */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            {isAz ? 'Rəy və Qərar Qəbulu' : 'Decision & Feedback'}
          </h4>

          {reviewError && (
            <div className="p-3 bg-red-950/50 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{reviewError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="adminFeedback" className="text-xs font-semibold text-slate-200">
              {isAz ? 'Tələbə üçün Rəy (Feedback)' : 'Feedback for Student'}
            </Label>
            <textarea
              id="adminFeedback"
              rows={3}
              value={adminFeedback}
              onChange={(e) => setAdminFeedback(e.target.value)}
              placeholder={
                isAz
                  ? 'Tapşırıq haqqında qiymətləndirmə və ya düzəliş tələbləri...'
                  : 'Write constructive review feedback...'
              }
              className="w-full rounded-md bg-slate-950 border border-slate-800 text-white text-xs p-3 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              disabled={reviewing}
              onClick={() => handleExecuteReview('reject')}
              className="bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-semibold gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              {isAz ? 'Rədd Et' : 'Reject'}
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={reviewing}
              onClick={() => handleExecuteReview('revision_requested')}
              className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 text-xs font-semibold gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {isAz ? 'Düzəliş Tələb Et' : 'Request Revision'}
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={reviewing}
              onClick={() => handleExecuteReview('approve')}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold gap-1.5 shadow-xs"
            >
              {reviewing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              {isAz ? 'Təsdiqlə (Approve)' : 'Approve'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
