'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { extractLocalizedTaskText } from '@/lib/tasks/content.mjs';
import { getLocalizedTaskTitle } from '@/lib/tasks/localized-title.mjs';
import { TaskInstructionArticle } from '@/components/tasks/instruction-article.mjs';
import { getStudentEnrollments } from '@/lib/enrollments/service';
import { getTaskEnrollment } from '@/lib/tasks/task-enrollment.mjs';
import { getTaskById } from '@/lib/tasks/service';
import {
  getSubmissionForTask,
  submitTaskSolution,
  getSubmissionFileUrl,
} from '@/lib/submissions/service';
import {
  InternshipTask,
  TaskSubmission,
  TaskDifficulty,
  TaskSubmissionType,
  Enrollment,
} from '@/types/database';
import { formatDate } from '@/lib/utils/date';
import {
  ArrowLeft,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Link as LinkIcon,
  Github,
  Upload,
  Layers,
  Send,
  Loader2,
  ExternalLink,
  Download,
  MessageSquare,
  Sparkles,
  HelpCircle,
  FileCheck,
} from 'lucide-react';

export default function StudentTaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const resolvedParams = use(params);
  const taskId = resolvedParams.taskId;

  const { profile } = useAuth();
  const { language } = useLanguage();
  const isAz = language === 'az';

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [task, setTask] = useState<InternshipTask | null>(null);
  const [submission, setSubmission] = useState<TaskSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [githubUrl, setGithubUrl] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const studentId = profile?.id;

  useEffect(() => {
    let active = true;
    const fetchAsync = async () => {
      if (!studentId) return;
      try {
        const [taskData, enrollments] = await Promise.all([
          getTaskById(taskId),
          getStudentEnrollments(studentId),
        ]);
        if (!active) return;
        setTask(taskData);
        setEnrollment(getTaskEnrollment(enrollments, taskData?.internship_id));

        if (taskData) {
          const sub = await getSubmissionForTask(taskId, studentId);
          if (!active) return;
          setSubmission(sub);
          if (sub) {
            setGithubUrl(sub.github_url || '');
            setSubmissionUrl(sub.submission_url || '');
            setTextAnswer(sub.text_answer || '');
            setComment(sub.comment || '');
          }
        }
      } catch (err) {
        console.error('Failed to load task details:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAsync();
    return () => {
      active = false;
    };
  }, [taskId, studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!profile?.id || !enrollment?.id || !task) {
      setFormError(isAz ? 'Aktiv qeydiyyat və ya sessiya tapılmadı.' : 'Session or enrollment not found.');
      return;
    }

    // Tasks whose deliverables are visual or UI-based must include evidence.
    const screenshotRequired = /wireframe|prototype|dashboard|visuali[sz]|diagram|flowchart|user flow|screen|responsive|mobile ux|high-fidelity|landing page|design system|ui component|chart|graph|interface|accessibility review/i.test(
      `${task.title} ${task.instructions || ''}`
    );
    if (screenshotRequired && !file && !submission?.file_path) {
      setFormError(isAz
        ? 'Bu tapşırıq üçün ekran görüntüsü və ya nəticə faylı əlavə etmək məcburidir.'
        : 'A screenshot or evidence file is required for this task.');
      return;
    }

    // Basic frontend checks based on submission_type
    if ((task.submission_type === 'github' || task.submission_type === 'multiple') && !githubUrl.trim()) {
      setFormError(isAz ? 'Zəhmət olmasa GitHub repozitoriya linkini daxil edin.' : 'Please provide GitHub repository link.');
      return;
    }
    if (task.submission_type === 'link' && !submissionUrl.trim()) {
      setFormError(isAz ? 'Zəhmət olmasa canlı layihə linkini daxil edin.' : 'Please provide live project URL.');
      return;
    }
    if (task.submission_type === 'text' && !textAnswer.trim()) {
      setFormError(isAz ? 'Zəhmət olmasa həllinizi mətn şəklində qeyd edin.' : 'Please write your textual solution.');
      return;
    }
    if (task.submission_type === 'file' && !file && !submission?.file_path) {
      setFormError(isAz ? 'Zəhmət olmasa tələb olunan faylı seçin.' : 'Please choose a file to upload.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitTaskSolution({
        taskId: task.id,
        studentId: profile.id,
        enrollmentId: enrollment.id,
        textAnswer: textAnswer.trim() || undefined,
        submissionUrl: submissionUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
        file: file || undefined,
        comment: comment.trim() || undefined,
      });

      if (res.success && res.submission) {
        setSubmission(res.submission);
        setIsEditing(false);
        setFormSuccess(
          isAz
            ? 'Tapşırıq həlliniz uğurla göndərildi! Mentor yoxladıqdan sonra status yenilənəcəkdir.'
            : 'Your submission has been sent for review!'
        );
      } else {
        setFormError(res.error || (isAz ? 'Xəta baş verdi.' : 'Submission failed.'));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xəta baş verdi.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyBadge = (difficulty: TaskDifficulty) => {
    switch (difficulty) {
      case 'beginner':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            {isAz ? 'Başlanğıc' : 'Beginner'}
          </span>
        );
      case 'intermediate':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            {isAz ? 'Orta Səviyyə' : 'Intermediate'}
          </span>
        );
      case 'advanced':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
            {isAz ? 'İrəli Səviyyə' : 'Advanced'}
          </span>
        );
    }
  };

  const getSubmissionIcon = (type: TaskSubmissionType) => {
    switch (type) {
      case 'text':
        return <FileText className="w-3.5 h-3.5 text-sky-600" />;
      case 'link':
        return <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />;
      case 'github':
        return <Github className="w-3.5 h-3.5 text-purple-600" />;
      case 'file':
        return <Upload className="w-3.5 h-3.5 text-amber-600" />;
      case 'multiple':
        return <Layers className="w-3.5 h-3.5 text-rose-600" />;
    }
  };

  const getSubmissionLabel = (type: TaskSubmissionType) => {
    switch (type) {
      case 'text':
        return isAz ? 'Mətn cavabı' : 'Text answer';
      case 'link':
        return isAz ? 'Canlı Link (URL)' : 'Live URL';
      case 'github':
        return 'GitHub Repo';
      case 'file':
        return isAz ? 'Fayl yükləmə' : 'File upload';
      case 'multiple':
        return isAz ? 'Kompleks format' : 'Multiple formats';
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
        <p className="text-xs">{isAz ? 'Tapşırıq məlumatları yüklənir...' : 'Loading task details...'}</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/tasks"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {isAz ? 'Təcrübə panelinə qayıt' : 'Back to Internship'}
        </Link>
        <Card className="border-slate-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">
              {isAz ? 'Tapşırıq tapılmadı' : 'Task not found'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAz
                ? 'Axtarılan tapşırıq mövcud deyil və ya silinib.'
                : 'The requested task does not exist or has been removed.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const taskDescription = extractLocalizedTaskText(task.description, language);
  const taskInstructions = extractLocalizedTaskText(task.instructions, language);
  const showForm = !submission || submission.status === 'revision_requested' || submission.status === 'rejected' || isEditing;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href={`/dashboard/tasks?program=${encodeURIComponent(task.internship_id)}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-700 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {isAz ? 'Təcrübə proqramına və tapşırıqlar siyahısına qayıt' : 'Back to Tasks List'}
        </Link>
      </div>

      {/* Task Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
              {isAz ? `${task.week_number}-ci Həftə • Tapşırıq #${task.task_number}` : `Week ${task.week_number} • Task #${task.task_number}`}
            </span>
            {getDifficultyBadge(task.difficulty)}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
              {getSubmissionIcon(task.submission_type)}
              {getSubmissionLabel(task.submission_type)}
            </span>
            {task.is_required && (
              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                {isAz ? 'Məcburi' : 'Required'}
              </span>
            )}
          </div>

          {task.deadline && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {isAz ? 'Son təhvil tarixi:' : 'Deadline:'}{' '}
                {formatDate(task.deadline)}
              </span>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {getLocalizedTaskTitle(task.title, isAz ? 'az' : 'en')}
          </h1>
          <p className="text-[15px] sm:text-base text-slate-600 leading-7 mt-2 max-w-3xl whitespace-pre-wrap">
            {taskDescription}
          </p>
        </div>
      </div>

      {/* Detailed, readable task brief */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-2xs">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <FileText className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              {isAz ? 'Tapşırığın ətraflı izahı' : 'Detailed task brief'}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {isAz
                ? 'Məqsədi, icra addımlarını, təhvil veriləcək nəticələri və qiymətləndirmə meyarlarını izləyin.'
                : 'Use the objective, steps, deliverables, and evaluation criteria to guide your work.'}
            </p>
          </div>
        </div>

        <div className="pt-5">
          <TaskInstructionArticle content={taskInstructions} />
        </div>
      </section>

      {/* Submission Status Display (If Already Submitted) */}
      {submission && (
        <div className="space-y-4">
          {submission.status === 'approved' && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-emerald-900">
                  {isAz ? 'Tapşırıq Təsdiqlənib!' : 'Assignment Approved!'}
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {isAz
                    ? 'Təbrik edirik! Mentor həllinizi yoxlayıb təsdiqlədi və irəliləyiş göstəricinizə əlavə olundu.'
                    : 'Congratulations! Your submission has been reviewed and approved.'}
                </p>
                {submission.admin_feedback && (
                  <div className="mt-2 p-2.5 bg-white/80 rounded-lg border border-emerald-200 text-xs text-emerald-900">
                    <span className="font-bold">{isAz ? 'Mentor Rəyi:' : 'Mentor Feedback:'}</span>{' '}
                    {submission.admin_feedback}
                  </div>
                )}
              </div>
            </div>
          )}

          {submission.status === 'pending' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start justify-between gap-3" role="status">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-amber-900">
                    {isAz ? 'Yoxlanışdadır (Gözləmədə)' : 'Under Review'}
                  </h4>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    {isAz
                      ? 'Həlliniz qəbul edilib və tezliklə koordinator tərəfindən qiymətləndiriləcəkdir.'
                      : 'Your submission is queued for review by the coordinator.'}
                  </p>
                  <p className="text-sm text-amber-800">
                    {isAz ? 'Göndərilmə tarixi:' : 'Submitted on:'}{' '}
                    {new Date(submission.submitted_at).toLocaleString(isAz ? 'az-AZ' : 'en-US')}
                  </p>
                </div>
              </div>

              {!isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="min-h-11 text-sm border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0"
                >
                  {isAz ? 'Düzəliş et' : 'Edit submission'}
                </Button>
              )}
            </div>
          )}

          {submission.status === 'revision_requested' && (
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-300 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-orange-900">
                    {isAz ? 'Düzəliş Tələb Olunur' : 'Revision Requested'}
                  </h4>
                  <p className="text-xs text-orange-800 leading-relaxed">
                    {isAz
                      ? 'Mentor həllinizi yoxlayıb və aşağıdakı düzəlişləri etməyinizi xahiş edir. Düzəlişləri etdikdən sonra yenidən göndərin:'
                      : 'The coordinator reviewed your submission and requested updates before approval:'}
                  </p>
                </div>
              </div>

              {submission.admin_feedback && (
                <div className="p-3 bg-white rounded-xl border border-orange-200 text-sm text-orange-900 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-orange-900">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {isAz ? 'Mentorun Tələbi:' : 'Mentor Instructions:'}
                  </span>
                  <p className="italic leading-relaxed">
                    &ldquo;{submission.admin_feedback}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Submitted Work Overview (When NOT editing) */}
          {!isEditing && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>{isAz ? 'Təqdim Etdiyiniz Həll' : 'Your Submitted Solution'}</span>
              </h4>

              {submission.github_url && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                    <Github className="w-4 h-4 text-purple-600" />
                    GitHub Repo:
                  </span>
                  <a
                    href={submission.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-purple-600 hover:underline flex items-center gap-1"
                  >
                    {submission.github_url}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {submission.submission_url && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                    <ExternalLink className="w-4 h-4 text-sky-600" />
                    Live URL:
                  </span>
                  <a
                    href={submission.submission_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-sky-600 hover:underline flex items-center gap-1"
                  >
                    {submission.submission_url}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {submission.text_answer && (
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-600 font-medium">
                    {isAz ? 'Mətn Həlli:' : 'Written Answer:'}
                  </span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {submission.text_answer}
                  </div>
                </div>
              )}

              {submission.file_path && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                    <Download className="w-4 h-4 text-amber-600" />
                    {submission.file_name || (isAz ? 'Yüklənmiş fayl' : 'Uploaded file')}
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
                    className="text-xs gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {isAz ? 'Yüklə' : 'Download'}
                  </Button>
                </div>
              )}

              {submission.comment && (
                <div className="text-xs text-slate-500 italic pt-1">
                  <span className="font-semibold text-slate-700">{isAz ? 'Qeydiniz:' : 'Your note:'}</span> &ldquo;{submission.comment}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Solution Submission Form */}
      {showForm && (
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="p-6 pb-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              <span>
                {submission
                  ? isAz
                    ? 'Həlli Yenilə və Yenidən Təqdim Et'
                    : 'Update and Resubmit'
                  : isAz
                  ? 'Tapşırıq Həllini Təqdim Et'
                  : 'Submit Task Solution'}
              </span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              {isAz
                ? 'Tələb olunan formatlara uyğun olaraq məlumatları daxil edin və göndərin.'
                : 'Fill in the required information according to the submission requirements.'}
            </p>
          </CardHeader>

          <CardContent className="p-6">
            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* GitHub URL */}
              {(task.submission_type === 'github' || task.submission_type === 'multiple' || task.submission_type === 'file') && (
                <div className="space-y-1.5">
                  <Label htmlFor="githubUrl" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-purple-600" />
                    <span>{isAz ? `GitHub Repozitoriya URL-i${task.submission_type === 'file' ? ' (istəyə bağlı)' : ' *'}` : `GitHub Repository URL${task.submission_type === 'file' ? ' (optional)' : ' *'}`}</span>
                  </Label>
                  <Input
                    id="githubUrl"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/project-repo"
                    className="text-xs h-9"
                    required={task.submission_type === 'github' || task.submission_type === 'multiple'}
                  />
                  <p className="text-[11px] text-slate-400">
                    {isAz ? (task.submission_type === 'file' ? 'İşin davam etdiyi repozitoriyanın linkini əlavə edə bilərsiniz.' : 'Məs: https://github.com/username/internship-project') : (task.submission_type === 'file' ? 'Optionally add the repository where your work continues.' : 'E.g. https://github.com/username/internship-project')}
                  </p>
                </div>
              )}

              {/* Live Project URL */}
              {(task.submission_type === 'link' || task.submission_type === 'multiple') && (
                <div className="space-y-1.5">
                  <Label htmlFor="submissionUrl" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAz ? 'Canlı Vebsayt / Demo Linki (URL) *' : 'Live Website / Demo URL *'}</span>
                  </Label>
                  <Input
                    id="submissionUrl"
                    type="url"
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                    placeholder="https://my-app.vercel.app"
                    className="text-xs h-9"
                    required={task.submission_type === 'link'}
                  />
                </div>
              )}

              {/* Text Answer */}
              {(task.submission_type === 'text' || task.submission_type === 'multiple') && (
                <div className="space-y-1.5">
                  <Label htmlFor="textAnswer" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    <span>{isAz ? 'Yazılı Cavab və ya Həll İzahı *' : 'Written Solution *'}</span>
                  </Label>
                  <textarea
                    id="textAnswer"
                    rows={4}
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder={
                      isAz
                        ? 'Tapşırığı necə həll etdiyinizi və əsas texniki detalları qeyd edin...'
                        : 'Describe your implementation, architecture and how requirements were met...'
                    }
                    className="w-full rounded-md border border-slate-200 text-xs p-3 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required={task.submission_type === 'text'}
                  />
                </div>
              )}

              {/* File Upload */}
              {(task.submission_type === 'file' || task.submission_type === 'multiple' || task.submission_type === 'github' || task.submission_type === 'link' || task.submission_type === 'text') && (
                <div className="space-y-1.5">
                  <Label htmlFor="file" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isAz ? 'Fayl və ya ekran görüntüsü əlavə et (PDF, PNG, JPG, WEBP, DOCX, ZIP və s.)' : 'Attach a file or screenshot (PDF, PNG, JPG, WEBP, DOCX, ZIP, etc.)'}</span>
                  </Label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(false);
                      const dropped = e.dataTransfer.files?.[0] || null;
                      if (!dropped) return;
                      if (!/\.(pdf|png|jpe?g|webp|doc|docx|txt|csv|json|zip|md|xlsx|pptx)$/i.test(dropped.name)) {
                        setFormError(isAz ? 'Bu fayl formatı dəstəklənmir. PDF, PNG, JPG, WEBP, DOCX, ZIP və ya uyğun sənəd seçin.' : 'Unsupported file type. Choose PDF, PNG, JPG, WEBP, DOCX, ZIP, or a supported document.');
                        return;
                      }
                      if (dropped.size > 10 * 1024 * 1024) {
                        setFormError(isAz ? 'Faylın həcmi 10MB-dan çox ola bilməz.' : 'File size cannot exceed 10MB.');
                        return;
                      }
                      setFile(dropped);
                      setFormError(null);
                    }}
                    className={`p-4 border-2 border-dashed rounded-xl text-center transition-colors ${isDraggingFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'}`}
                  >
                    <input
                      id="file"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt,.csv,.json,.zip,.md,.xlsx,.pptx"
                      onChange={(e) => {
                        const selected = e.target.files?.[0] || null;
                        if (selected && !/\.(pdf|png|jpe?g|webp|doc|docx|txt|csv|json|zip|md|xlsx|pptx)$/i.test(selected.name)) {
                          setFile(null);
                          setFormError(isAz ? 'Bu fayl formatı dəstəklənmir. PDF, PNG, JPG, WEBP, DOCX, ZIP və ya uyğun sənəd seçin.' : 'Unsupported file type. Choose PDF, PNG, JPG, WEBP, DOCX, ZIP, or a supported document.');
                          e.currentTarget.value = '';
                          return;
                        }
                        if (selected && selected.size > 10 * 1024 * 1024) {
                          setFile(null);
                          setFormError(isAz ? 'Faylın həcmi 10MB-dan çox ola bilməz.' : 'File size cannot exceed 10MB.');
                          e.currentTarget.value = '';
                          return;
                        }
                        setFile(selected);
                        setFormError(null);
                      }}
                      className="hidden"
                    />
                    <label htmlFor="file" className="cursor-pointer block space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center mx-auto shadow-2xs">
                        <Upload className="w-5 h-5 text-emerald-600" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        {file ? file.name : (isAz ? 'Fayl seçmək üçün klikləyin və ya sürüşdürün' : 'Click to select or drag and drop')}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {file
                          ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                          : (isAz ? 'Maksimal həcm: 10MB' : 'Max size: 10MB')}
                      </p>
                    </label>
                  </div>
                </div>
              )}

              {/* Student Comment */}
              <div className="space-y-1.5">
                <Label htmlFor="comment" className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    {isAz ? 'Mentora Əlavə Qeyd (Seçimli)' : 'Additional Note for Mentor (Optional)'}
                  </span>
                </Label>
                <textarea
                  id="comment"
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    isAz
                      ? 'Nəzərə alınmasını istədiyiniz hər hansı qeyd və ya çətinlik...'
                      : 'Any thoughts or challenges encountered...'
                  }
                  className="w-full rounded-md border border-slate-200 text-xs p-3 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="text-xs"
                  >
                    {isAz ? 'İmtina' : 'Cancel'}
                  </Button>
                )}

                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-2xs"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {submission
                    ? isAz
                      ? 'Düzəliş Edilmiş Həlli Göndər'
                      : 'Resubmit Solution'
                    : isAz
                    ? 'Həlli Təqdim Et'
                    : 'Submit Solution'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
