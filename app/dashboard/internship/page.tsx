'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { getStudentEnrollments, leaveInternship } from '@/lib/enrollments/service';
import { getAllTasksForInternship } from '@/lib/tasks/service';
import { extractLocalizedTaskText } from '@/lib/tasks/content.mjs';
import { getStudentSubmissionsForEnrollment } from '@/lib/submissions/service';
import { formatDate as formatDisplayDate } from '@/lib/utils/date';
import { calculateInternshipProgress, ProgressResult } from '@/lib/tasks/progress';
import {
  Enrollment,
  InternshipTask,
  TaskSubmission,
  TaskDifficulty,
  TaskSubmissionType,
  SubmissionStatus,
} from '@/types/database';
import {
  Briefcase,
  ArrowRight,
  Clock,
  Calendar,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Award,
  ListTodo,
  FileText,
  Link as LinkIcon,
  Github,
  Upload,
  AlertCircle,
  XCircle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Loader2,
} from 'lucide-react';

export default function StudentMyInternshipPage() {
  const { profile } = useAuth();
  const { language, t } = useLanguage();
  const isAz = language === 'az';

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [tasks, setTasks] = useState<InternshipTask[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [progress, setProgress] = useState<ProgressResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [leavingInternship, setLeavingInternship] = useState(false);

  const loadEnrollmentDetails = async (active: Enrollment, studentId: string) => {
    const [taskList, subList] = await Promise.all([
      getAllTasksForInternship(active.internship_id, false),
      getStudentSubmissionsForEnrollment(studentId, active.id),
    ]);
    setEnrollment(active);
    setTasks(taskList);
    setSubmissions(subList);
    setProgress(calculateInternshipProgress(taskList, subList));
  };

  const selectEnrollment = async (active: Enrollment) => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      await loadEnrollmentDetails(active, profile.id);
    } catch (err) {
      console.error('Failed to load selected internship:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function load() {
      if (!profile?.id) return;
      setLoading(true);
      try {
        const all = await getStudentEnrollments(profile.id);
        const activeList = all.filter((e) => e.status === 'active' && e.internship);
        setEnrollments(activeList);
        if (activeList.length > 0) {
          await loadEnrollmentDetails(activeList[0], profile.id);
        } else {
          setEnrollment(null);
          setTasks([]);
          setSubmissions([]);
          setProgress(null);
        }
      } catch (err) {
        console.error('Failed to load active enrollments and tasks:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile?.id]);

  const handleLeaveInternship = async () => {
    if (!profile?.id || !enrollment?.id) return;
    const confirmed = window.confirm(isAz
      ? 'Bu təcrübədən çıxmaq istədiyinizə əminsiniz? İrəliləyişiniz saxlanacaq, lakin aktiv tapşırıqları təqdim edə bilməyəcəksiniz.'
      : 'Are you sure you want to leave this internship? Your progress will be retained, but you will no longer be able to submit tasks.');
    if (!confirmed) return;
    setLeavingInternship(true);
    try {
      const result = await leaveInternship(enrollment.id, profile.id);
      if (!result.success) {
        window.alert(result.error || (isAz ? 'Əməliyyat alınmadı.' : 'Could not leave internship.'));
        return;
      }
      const remaining = enrollments.filter((item) => item.id !== enrollment.id);
      setEnrollments(remaining);
      if (remaining.length > 0) {
        await loadEnrollmentDetails(remaining[0], profile.id);
      } else {
        setEnrollment(null);
        setTasks([]);
        setSubmissions([]);
        setProgress(null);
      }
      window.alert(isAz ? 'Təcrübədən çıxış tamamlandı.' : 'You have left the internship.');
    } finally {
      setLeavingInternship(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    return dateStr ? formatDisplayDate(dateStr) : null;
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
        return isAz ? 'Canlı Link' : 'Live URL';
      case 'github':
        return 'GitHub Repo';
      case 'file':
        return isAz ? 'Fayl' : 'File';
      case 'multiple':
        return isAz ? 'Kompleks' : 'Multiple';
    }
  };

  const getStudentTaskStatus = (task: InternshipTask) => {
    const sub = submissions.find((s) => s.task_id === task.id);
    if (!sub) {
      return {
        status: 'not_submitted',
        label: isAz ? 'Təqdim edilməyib' : 'Not submitted',
        badge: (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {isAz ? 'Yeni Tapşırıq' : 'New Task'}
          </span>
        ),
        submission: null,
      };
    }

    switch (sub.status) {
      case 'approved':
        return {
          status: 'approved',
          label: isAz ? 'Təsdiqlənib' : 'Approved',
          badge: (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {isAz ? 'Təsdiqlənib' : 'Approved'}
            </span>
          ),
          submission: sub,
        };
      case 'pending':
        return {
          status: 'pending',
          label: isAz ? 'Yoxlanılır' : 'Under Review',
          badge: (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              {isAz ? 'Yoxlanışdadır' : 'Pending Review'}
            </span>
          ),
          submission: sub,
        };
      case 'revision_requested':
        return {
          status: 'revision_requested',
          label: isAz ? 'Düzəliş tələb olunur' : 'Revision Requested',
          badge: (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
              {isAz ? 'Düzəliş Tələb Olunur' : 'Revision Requested'}
            </span>
          ),
          submission: sub,
        };
      case 'rejected':
        return {
          status: 'rejected',
          label: isAz ? 'Rədd edilib' : 'Rejected',
          badge: (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              {isAz ? 'Rədd Edilib' : 'Rejected'}
            </span>
          ),
          submission: sub,
        };
    }
  };

  // Group tasks by week number
  const weekNumbers = Array.from(new Set(tasks.map((t) => t.week_number))).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {t('activeInternshipTitle')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('activeInternshipSubtitle')}
        </p>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : enrollment && enrollment.internship ? (
        <div className="space-y-6">
          {enrollments.length > 1 && (
            <section className="rounded-xl border border-slate-200 bg-slate-900/40 p-4 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{isAz ? 'Aktiv təcrübələrim' : 'My active internships'}</h3>
                <p className="text-xs text-slate-400 mt-1">{isAz ? 'Tapşırıqlara baxmaq üçün təcrübə seçin.' : 'Choose an internship to view its tasks.'}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {enrollments.map((item) => (
                  <button key={item.id} type="button" onClick={() => selectEnrollment(item)}
                    className={`rounded-lg border p-3 text-left transition-colors ${item.id === enrollment.id ? 'border-emerald-500 bg-emerald-950/50' : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'}`}>
                    <span className={`block text-sm font-semibold ${item.id === enrollment.id ? 'text-emerald-200' : 'text-slate-100'}`}>{item.internship?.title || (isAz ? 'Təcrübə proqramı' : 'Internship')}</span>
                    <span className="mt-1 block text-xs text-slate-400">{item.internship?.duration_weeks} {t('durationWeeks')}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {/* Active Program Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-2xs uppercase font-semibold">
                  {enrollment.internship.category}
                </Badge>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {isAz ? 'Aktiv Təcrübə' : 'Active Enrollment'}
                </Badge>
              </div>
              <span className="text-xs text-slate-400">
                {isAz ? 'Qəbul tarixi:' : 'Enrolled on:'} {formatDate(enrollment.enrolled_at)}
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                {enrollment.internship.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                {enrollment.internship.short_description}
              </p>
            </div>

            {/* Program Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <span className="text-2xs text-slate-400 block mb-1 uppercase font-semibold">{t('durationWeeks')}</span>
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  {enrollment.internship.duration_weeks} {t('durationWeeks')}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <span className="text-2xs text-slate-400 block mb-1 uppercase font-semibold">{t('startDate')}</span>
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {formatDate(enrollment.internship.start_date) || (isAz ? 'Dərhal' : 'Immediate')}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <span className="text-2xs text-slate-400 block mb-1 uppercase font-semibold">
                  {isAz ? 'Tapşırıq İcrası' : 'Tasks Status'}
                </span>
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-emerald-600" />
                  {progress ? `${progress.approvedCount} / ${progress.totalTasks}` : `${tasks.length} tapşırıq`}
                </span>
              </div>
            </div>

            {/* Progress Section */}
            {progress && (
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {isAz ? 'Ümumi İrəliləyiş Göstəricisi' : 'Overall Progress'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {progress.percentage}% {isAz ? 'tamamlandı' : 'completed'} ({progress.approvedCount} / {progress.requiredTasks || progress.totalTasks})
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>

                {/* All Required Tasks Completed Badge */}
                {progress.isAllRequiredCompleted && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 font-semibold shadow-2xs">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {isAz
                        ? 'Təbriklər! Bütün tələb olunan praktiki tapşırıqları müvəffəqiyyətlə tamamladınız!'
                        : 'Congratulations! You have successfully completed all required internship tasks!'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-red-500/40 bg-red-950/35 p-4">
            <div>
              <p className="text-sm font-semibold text-red-200">{isAz ? 'Təcrübəni dayandırmaq istəyirsiniz?' : 'Want to leave this internship?'}</p>
              <p className="mt-1 text-xs text-red-300">{isAz ? 'Bu əməliyyat aktiv qeydiyyatı ləğv edir. Təsdiqdən sonra tapşırıq təqdim edə bilməyəcəksiniz.' : 'This cancels your active enrollment. You will no longer be able to submit tasks.'}</p>
            </div>
            <Button type="button" variant="outline" disabled={leavingInternship} onClick={handleLeaveInternship} className="shrink-0 border-red-400/60 bg-red-950/30 text-red-200 hover:bg-red-900/60 hover:text-white">
              {leavingInternship ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              {isAz ? 'Təcrübədən çıx' : 'Leave internship'}
            </Button>
          </div>

          {/* Weekly Tasks Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-emerald-600" />
                  {isAz ? 'Həftəlik Praktiki Tapşırıqlar' : 'Weekly Practical Assignments'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAz
                    ? 'Hər tapşırığın üzərinə klikləyərək təlimatları oxuyun və həllinizi təqdim edin'
                    : 'Click on each assignment to read instructions and submit your work'}
                </p>
              </div>
            </div>

            {tasks.length > 0 ? (
              <div className="space-y-6">
                {weekNumbers.map((week) => {
                  const weekTasks = tasks.filter((t) => t.week_number === week);
                  const weekApproved = weekTasks.filter((t) => {
                    const st = getStudentTaskStatus(t);
                    return st.status === 'approved';
                  }).length;

                  return (
                    <div key={week} className="space-y-3">
                      {/* Week Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                            {week}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">
                            {isAz ? `${week}-ci Həftə Tapşırıqları` : `Week ${week} Tasks`}
                          </h4>
                        </div>
                        <span className="text-xs font-medium text-slate-500">
                          {weekApproved} / {weekTasks.length} {isAz ? 'təsdiqlənib' : 'approved'}
                        </span>
                      </div>

                      {/* Tasks in this Week */}
                      <div className="space-y-3">
                        {weekTasks.map((task) => {
                          const itemStatus = getStudentTaskStatus(task);
                          return (
                            <Card
                              key={task.id}
                              className={`border transition-all hover:shadow-md ${
                                itemStatus.status === 'approved'
                                  ? 'border-emerald-200 bg-emerald-50/20'
                                  : itemStatus.status === 'revision_requested'
                                  ? 'border-orange-300 bg-orange-50/20'
                                  : itemStatus.status === 'pending'
                                  ? 'border-amber-200 bg-amber-50/20'
                                  : 'border-slate-200 bg-white'
                              }`}
                            >
                              <CardContent className="p-4 sm:p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                        #{task.task_number}
                                      </span>
                                      {itemStatus.badge}
                                      {getDifficultyBadge(task.difficulty)}
                                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                        {getSubmissionIcon(task.submission_type)}
                                        {getSubmissionLabel(task.submission_type)}
                                      </span>
                                      {task.is_required && (
                                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                          {isAz ? 'Məcburi' : 'Required'}
                                        </span>
                                      )}
                                    </div>

                                    <h4 className="text-base font-bold text-slate-900">
                                      {task.title}
                                    </h4>

                                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                      {extractLocalizedTaskText(task.description, language)}
                                    </p>

                                    {/* Admin Feedback Callout if Revision Requested */}
                                    {itemStatus.status === 'revision_requested' && itemStatus.submission?.admin_feedback && (
                                      <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs space-y-1">
                                        <span className="font-bold text-orange-900 flex items-center gap-1.5">
                                          <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
                                          {isAz ? 'İnzibatçı / Mentor Düzəliş Rəyi:' : 'Mentor Feedback:'}
                                        </span>
                                        <p className="text-orange-800 leading-relaxed">
                                          &ldquo;{itemStatus.submission.admin_feedback}&rdquo;
                                        </p>
                                      </div>
                                    )}

                                    {task.deadline && (
                                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        <span>
                                          {isAz ? 'Son təhvil:' : 'Deadline:'}{' '}
                                          {formatDisplayDate(task.deadline)}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Right CTA */}
                                  <div className="shrink-0 pt-2 sm:pt-0">
                                    <Link href={`/dashboard/internship/tasks/${task.id}`}>
                                      <Button
                                        size="sm"
                                        className={`w-full sm:w-auto text-xs font-semibold gap-1.5 shadow-2xs ${
                                          itemStatus.status === 'approved'
                                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                            : itemStatus.status === 'revision_requested'
                                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                            : itemStatus.status === 'pending'
                                            ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold'
                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                        }`}
                                      >
                                        {itemStatus.status === 'approved'
                                          ? isAz
                                            ? 'Təsdiqlənmiş Həllə Bax'
                                            : 'View Approved Work'
                                          : itemStatus.status === 'revision_requested'
                                          ? isAz
                                            ? 'Düzəliş Et və Yenidən Göndər'
                                            : 'Revise & Resubmit'
                                          : itemStatus.status === 'pending'
                                          ? isAz
                                            ? 'Təqdimata Bax'
                                            : 'View Submission'
                                          : isAz
                                          ? 'Tapşırığı İcra Et'
                                          : 'Start & Submit'}
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      </Button>
                                    </Link>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <ListTodo className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  {isAz ? 'Tapşırıqlar Tezliklə Əlavə Olunacaq' : 'Assignments Scheduled Soon'}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {isAz
                    ? 'Mentorunuz hazırda bu təcrübə proqramı üçün praktiki tapşırıqları hazırlayır.'
                    : 'Your program coordinator is currently publishing weekly tasks.'}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {t('noActiveInternship')}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
              {t('noActiveInternshipDesc')}
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
