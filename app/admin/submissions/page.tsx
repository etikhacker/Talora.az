'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { TaskInstructions } from '@/components/tasks/task-instructions';
import { useLanguage } from '@/lib/i18n/language-context';
import { useAuth } from '@/lib/auth/auth-context';
import {
  getAllSubmissions,
  reviewSubmission,
  getSubmissionFileUrl,
} from '@/lib/submissions/service';
import { TaskSubmission, SubmissionStatus } from '@/types/database';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  FileCheck2,
  ExternalLink,
  Github,
  Download,
  FileText,
  Search,
  Filter,
  Loader2,
  X,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Send,
  Eye,
} from 'lucide-react';

export default function AdminSubmissionsPage() {
  const { language } = useLanguage();
  const isAz = language === 'az';
  const { user } = useAuth();

  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Review Modal State
  const [selectedSub, setSelectedSub] = useState<TaskSubmission | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'revision_requested' | 'reject'>('approve');
  const [adminFeedback, setAdminFeedback] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await getAllSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const fetchAsync = async () => {
      try {
        const data = await getAllSubmissions();
        if (active) setSubmissions(data);
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAsync();
    return () => {
      active = false;
    };
  }, []);

  const openReviewModal = (sub: TaskSubmission) => {
    setSelectedSub(sub);
    setReviewAction(sub.status === 'revision_requested' ? 'revision_requested' : sub.status === 'rejected' ? 'reject' : 'approve');
    setAdminFeedback(sub.admin_feedback || '');
    setReviewError('');
  };

  const handleExecuteReview = async (action: 'approve' | 'revision_requested' | 'reject') => {
    if (!selectedSub) return;
    setReviewError('');

    // If revision or reject, feedback is required!
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
        submissionId: selectedSub.id,
        action,
        adminFeedback: adminFeedback.trim(),
        reviewerId: user?.id,
      });

      if (res.success) {
        setSelectedSub(null);
        await loadData();
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
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3" />
            {isAz ? 'Təsdiqlənib' : 'Approved'}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
            <Clock className="w-3 h-3" />
            {isAz ? 'Gözləmədə' : 'Pending Review'}
          </span>
        );
      case 'revision_requested':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
            <AlertCircle className="w-3 h-3" />
            {isAz ? 'Düzəliş Tələb Edilib' : 'Revision Requested'}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            {isAz ? 'Rədd Edilib' : 'Rejected'}
          </span>
        );
    }
  };

  const filtered = submissions.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const studentName = item.student?.full_name?.toLowerCase() || '';
      const studentEmail = item.student?.email?.toLowerCase() || '';
      const taskTitle = item.task?.title?.toLowerCase() || '';
      return studentName.includes(q) || studentEmail.includes(q) || taskTitle.includes(q);
    }
    return true;
  });

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const revisionCount = submissions.filter((s) => s.status === 'revision_requested').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <PageHeading embedded title={<>
            <CheckCircle className="w-6 h-6 text-amber-400" />
            <span>{isAz ? 'Tapşırıq Təqdimatları və Qiymətləndirmə' : 'Task Submissions & Grading'}</span>
          </>} description={<>
            {isAz
              ? 'Tələbələrin göndərdiyi həlləri yoxlayın, təsdiqləyin və ya ətraflı düzəliş rəyi bildirin'
              : 'Review submitted task solutions, approve milestones, or request code revisions'}
          </>} />
        </div>
      </div>

      {/* Filter Tabs & Counters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {isAz ? 'Bütün Təqdimatlar' : 'All Submissions'} ({submissions.length})
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            statusFilter === 'pending'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          {isAz ? 'Gözləmədə' : 'Pending'} ({pendingCount})
        </button>

        <button
          onClick={() => setStatusFilter('revision_requested')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === 'revision_requested'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {isAz ? 'Düzəliş Gözləyən' : 'Revision Requested'} ({revisionCount})
        </button>

        <button
          onClick={() => setStatusFilter('approved')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === 'approved'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {isAz ? 'Təsdiqlənmiş' : 'Approved'} ({approvedCount})
        </button>

        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === 'rejected'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {isAz ? 'Rədd Edilmiş' : 'Rejected'} ({rejectedCount})
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            isAz
              ? 'Tələbə adı, email və ya tapşırıq başlığı ilə axtar...'
              : 'Search by student name, email, or task title...'
          }
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-400" />
          <p className="text-xs">{isAz ? 'Təqdimatlar yüklənir...' : 'Loading submissions...'}</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all text-white shadow-xs"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Student & Task Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <Avatar
                      src={item.student?.avatar_url}
                      fallback={item.student?.full_name || 'TL'}
                      size="md"
                      className="ring-slate-700 shrink-0 mt-0.5"
                    />

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {item.student?.full_name || (isAz ? 'Tələbə' : 'Student')}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({item.student?.email})
                        </span>
                        {getStatusBadge(item.status)}
                      </div>

                      <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
                        <span className="font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 text-[11px]">
                          {item.task?.week_number ? `${isAz ? 'Həftə' : 'Week'} ${item.task.week_number} • #${item.task.task_number}` : ''}
                        </span>
                        <span className="font-semibold text-white">
                          {item.task?.title || (isAz ? 'Praktiki Tapşırıq' : 'Hands-on Task')}
                        </span>
                      </div>

                      {/* Links preview row */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                        {item.submission_url && (
                          <a
                            href={item.submission_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Live URL
                          </a>
                        )}
                        {item.github_url && (
                          <a
                            href={item.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 hover:underline"
                          >
                            <Github className="w-3.5 h-3.5" />
                            GitHub Repo
                          </a>
                        )}
                        {item.text_answer && (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <FileText className="w-3.5 h-3.5 text-amber-400" />
                            {isAz ? 'Mətn cavabı mövcuddur' : 'Text answer included'}
                          </span>
                        )}
                        {item.file_path && (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <Download className="w-3.5 h-3.5" />
                            {item.file_name || (isAz ? 'Qoşma fayl' : 'Attachment')}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 pt-0.5">
                        {isAz ? 'Göndərilib:' : 'Submitted:'}{' '}
                        {new Date(item.submitted_at).toLocaleString(isAz ? 'az-AZ' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right: Action */}
                  <div className="flex items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    <Button
                      onClick={() => openReviewModal(item)}
                      size="sm"
                      className={`text-xs gap-1.5 font-bold shadow-xs ${
                        item.status === 'pending'
                          ? 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {item.status === 'pending'
                        ? isAz
                          ? 'Yoxla & Qiymətləndir'
                          : 'Review Solution'
                        : isAz
                        ? 'Bax və ya Yenidən Qiymətləndir'
                        : 'View & Re-grade'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {isAz ? 'Təqdimat tapılmadı' : 'No Submissions Found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {isAz
                ? 'Seçilmiş filter üzrə heç bir tələbə təqdimatı mövcud deyil.'
                : 'There are no student submissions matching the current filter.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review & Grading Drawer / Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  {isAz ? 'Koordinator Qiymətləndirməsi' : 'Coordinator Review'}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedSub.task?.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAz ? 'Həftə' : 'Week'} {selectedSub.task?.week_number} • {isAz ? 'Tapşırıq' : 'Task'} #{selectedSub.task?.task_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Info Card */}
            <div className="mt-4 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  src={selectedSub.student?.avatar_url}
                  fallback={selectedSub.student?.full_name || 'TL'}
                  size="md"
                  className="ring-slate-700"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {selectedSub.student?.full_name}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {selectedSub.student?.email} • {selectedSub.student?.university || 'Tələbə'}
                  </p>
                </div>
              </div>

              <div>
                {getStatusBadge(selectedSub.status)}
              </div>
            </div>

            {/* Task Instructions Accordion/Box */}
            <div className="mt-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-2">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {isAz ? 'Tapşırıq Təlimatı və Tələblər' : 'Task Instructions'}
              </h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedSub.task?.description}
              </p>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <TaskInstructions text={selectedSub.task?.instructions ?? ''} variant="dark" />
              </div>
            </div>

            {/* Student Submitted Content */}
            <div className="mt-4 space-y-3">
              <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span>{isAz ? 'Tələbənin Təqdim Etdiyi İş' : 'Student Submission Content'}</span>
              </h5>

              {/* Text answer */}
              {selectedSub.text_answer && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {isAz ? 'Mətn İzahı / Həll:' : 'Written Answer:'}
                  </span>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selectedSub.text_answer}
                  </div>
                </div>
              )}

              {/* External URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedSub.submission_url && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                      {isAz ? 'Canlı Vebsayt / Demo:' : 'Live Website / Demo:'}
                    </span>
                    <a
                      href={selectedSub.submission_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-sky-400 hover:text-sky-300 hover:underline break-all block"
                    >
                      {selectedSub.submission_url}
                    </a>
                  </div>
                )}

                {selectedSub.github_url && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Github className="w-3.5 h-3.5 text-purple-400" />
                      {isAz ? 'GitHub Repozitoriyası:' : 'GitHub Repository:'}
                    </span>
                    <a
                      href={selectedSub.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-purple-400 hover:text-purple-300 hover:underline break-all block"
                    >
                      {selectedSub.github_url}
                    </a>
                  </div>
                )}
              </div>

              {/* File download */}
              {selectedSub.file_path && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {selectedSub.file_name || (isAz ? 'Yüklənmiş Həll Faylı' : 'Uploaded File')}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {selectedSub.file_path}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!selectedSub.file_path) return;
                      const url = await getSubmissionFileUrl(selectedSub.file_path);
                      if (url && url !== '#') {
                        window.open(url, '_blank');
                      } else {
                        alert(isAz ? 'Fayl önbaxışı aktivdir' : 'File preview active');
                      }
                    }}
                    className="border-slate-700 text-xs gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {isAz ? 'Yüklə' : 'Download'}
                  </Button>
                </div>
              )}

              {/* Student Comment */}
              {selectedSub.comment && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {isAz ? 'Tələbənin Əlavə Qeydi:' : 'Student Comment:'}
                  </span>
                  <p className="text-xs text-slate-300 italic">
                    &ldquo;{selectedSub.comment}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Previous Feedback */}
            {selectedSub.admin_feedback && (
              <div className="mt-4 p-3 bg-amber-400/10 rounded-xl border border-amber-400/20 space-y-1">
                <span className="text-[11px] font-semibold text-amber-300">
                  {isAz ? 'Əvvəlki İnzibatçı Rəyi:' : 'Previous Admin Feedback:'}
                </span>
                <p className="text-xs text-amber-200">
                  {selectedSub.admin_feedback}
                </p>
              </div>
            )}

            {/* Error Message */}
            {reviewError && (
              <div className="mt-4 p-3 bg-red-950/50 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{reviewError}</span>
              </div>
            )}

            {/* Admin Decision Section */}
            <div className="mt-6 pt-4 border-t border-slate-800 space-y-4">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                {isAz ? 'Qərar və Rəy Qeydiyyatı' : 'Decision & Feedback'}
              </h5>

              <div className="space-y-1.5">
                <Label htmlFor="adminFeedback" className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span>
                    {isAz ? 'Tələbəyə Rəy və Qeydlər' : 'Feedback for Student'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {isAz
                      ? '(Təsdiq üçün seçimli, düzəliş/rədd üçün məcburidir)'
                      : '(Optional for approve, mandatory for revision/reject)'}
                  </span>
                </Label>
                <textarea
                  id="adminFeedback"
                  rows={3}
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  placeholder={
                    isAz
                      ? 'Məs: Komponent strukturu əladır, lakin zəhmət olmasa responsive navbar menyusundakı xətanı aradan qaldırın...'
                      : 'Provide constructive feedback, praise, or specify required corrections...'
                  }
                  className="w-full rounded-md bg-slate-950 border border-slate-800 text-white text-xs p-3 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* 3 Decision Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSub(null)}
                  className="border-slate-800 text-slate-400 hover:text-white w-full sm:w-auto text-xs"
                >
                  {isAz ? 'Bağla' : 'Close'}
                </Button>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Reject */}
                  <Button
                    type="button"
                    size="sm"
                    disabled={reviewing}
                    onClick={() => handleExecuteReview('reject')}
                    className="bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-semibold gap-1.5 flex-1 sm:flex-initial"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    {isAz ? 'Rədd Et' : 'Reject'}
                  </Button>

                  {/* Request Revision */}
                  <Button
                    type="button"
                    size="sm"
                    disabled={reviewing}
                    onClick={() => handleExecuteReview('revision_requested')}
                    className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 text-xs font-semibold gap-1.5 flex-1 sm:flex-initial"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {isAz ? 'Düzəliş Tələb Et' : 'Request Revision'}
                  </Button>

                  {/* Approve */}
                  <Button
                    type="button"
                    size="sm"
                    disabled={reviewing}
                    onClick={() => handleExecuteReview('approve')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold gap-1.5 shadow-xs flex-1 sm:flex-initial"
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
        </div>
      )}
    </div>
  );
}
