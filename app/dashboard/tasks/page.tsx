'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { getStudentEnrollments } from '@/lib/enrollments/service';
import { getAllTasksForInternship } from '@/lib/tasks/service';
import { getStudentSubmissionsForEnrollment } from '@/lib/submissions/service';
import { extractLocalizedTaskText } from '@/lib/tasks/content.mjs';
import { getLocalizedTaskTitle } from '@/lib/tasks/localized-title.mjs';
import { groupStudentTasks } from '@/lib/tasks/student-task-list.mjs';
import type { Enrollment, InternshipTask, TaskSubmission, TaskDifficulty } from '@/types/database';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Clock3,
  ExternalLink,
  Loader2,
  ListTodo,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

type TaskFilter = 'all' | 'not_submitted' | 'pending' | 'needs_revision' | 'approved';

function statusLabel(status: string, isAz: boolean) {
  switch (status) {
    case 'approved': return isAz ? 'Təsdiqlənib' : 'Approved';
    case 'pending': return isAz ? 'Yoxlanılır' : 'Under review';
    case 'revision_requested': return isAz ? 'Düzəliş tələb olunur' : 'Revision requested';
    case 'rejected': return isAz ? 'Rədd edilib' : 'Rejected';
    default: return isAz ? 'Təqdim edilməyib' : 'Not submitted';
  }
}

function statusClasses(status: string) {
  switch (status) {
    case 'approved': return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'pending': return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'revision_requested': return 'border-orange-200 bg-orange-50 text-orange-800';
    case 'rejected': return 'border-rose-200 bg-rose-50 text-rose-700';
    default: return 'border-slate-200 bg-slate-100 text-slate-600';
  }
}

function difficultyLabel(difficulty: TaskDifficulty, isAz: boolean) {
  switch (difficulty) {
    case 'beginner': return isAz ? 'Başlanğıc' : 'Beginner';
    case 'intermediate': return isAz ? 'Orta səviyyə' : 'Intermediate';
    case 'advanced': return isAz ? 'İrəli səviyyə' : 'Advanced';
  }
}

function isVisibleForFilter(status: string, filter: TaskFilter) {
  if (filter === 'all') return true;
  if (filter === 'needs_revision') return status === 'revision_requested' || status === 'rejected';
  return status === filter;
}

export default function StudentTasksPage() {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const isAz = language === 'az';
  const [programs, setPrograms] = useState<Array<{
    enrollment: Enrollment;
    tasks: InternshipTask[];
    submissions: TaskSubmission[];
  }>>([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskFilter>('all');

  useEffect(() => {
    let active = true;

    async function load() {
      if (!profile?.id) {
        setPrograms([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const enrollments = await getStudentEnrollments(profile.id);
        if (!active) return;
        const activePrograms = await Promise.all(enrollments
          .filter((item) => item.status === 'active')
          .map(async (item) => {
            const [tasks, submissions] = await Promise.all([
              getAllTasksForInternship(item.internship_id, false),
              getStudentSubmissionsForEnrollment(profile.id, item.id),
            ]);
            return { enrollment: item, tasks, submissions };
          }));
        if (!active) return;
        setPrograms(activePrograms);
        const requestedProgram = new URLSearchParams(window.location.search).get('program');
        setSelectedProgramId(activePrograms.find((item) => item.enrollment.internship_id === requestedProgram)?.enrollment.id
          || activePrograms[0]?.enrollment.id || '');
      } catch (error) {
        console.error('Tələbə tapşırıqları yüklənə bilmədi:', error);
        if (active) {
          setPrograms([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [profile?.id]);

  const selectedProgram = programs.find((item) => item.enrollment.id === selectedProgramId) || programs[0];
  const enrollment = selectedProgram?.enrollment;
  const tasks = useMemo(() => selectedProgram?.tasks ?? [], [selectedProgram]);
  const submissions = useMemo(() => selectedProgram?.submissions ?? [], [selectedProgram]);

  const groupedTasks = useMemo(
    () => groupStudentTasks(tasks, submissions),
    [tasks, submissions],
  );
  const weeks = useMemo(() => {
    const maxTaskWeek = groupedTasks.reduce((max, group) => Math.max(max, group.weekNumber), 0);
    const duration = Math.max(enrollment?.internship?.duration_weeks || 0, maxTaskWeek);
    return Array.from({ length: duration }, (_, index) => {
      const weekNumber = index + 1;
      const group = groupedTasks.find((item) => item.weekNumber === weekNumber);
      return {
        weekNumber,
        tasks: (group?.tasks ?? []).filter((entry) => isVisibleForFilter(entry.status, filter)),
        totalTasks: group?.tasks.length ?? 0,
      };
    });
  }, [enrollment?.internship?.duration_weeks, filter, groupedTasks]);

  const approvedCount = groupedTasks.flatMap((group) => group.tasks).filter((entry) => entry.status === 'approved').length;
  const pendingCount = groupedTasks.flatMap((group) => group.tasks).filter((entry) => entry.status === 'pending').length;
  const revisionCount = groupedTasks.flatMap((group) => group.tasks).filter((entry) => entry.status === 'revision_requested' || entry.status === 'rejected').length;
  const progress = tasks.length ? Math.round((approvedCount / tasks.length) * 100) : 0;
  const visibleTaskCount = weeks.reduce((sum, week) => sum + week.tasks.length, 0);

  const filterOptions: { key: TaskFilter; label: string }[] = [
    { key: 'all', label: isAz ? 'Hamısı' : 'All tasks' },
    { key: 'not_submitted', label: isAz ? 'Yeni' : 'Not submitted' },
    { key: 'pending', label: isAz ? 'Yoxlanılır' : 'Under review' },
    { key: 'needs_revision', label: isAz ? 'Düzəliş lazımdır' : 'Needs changes' },
    { key: 'approved', label: isAz ? 'Təsdiqlənib' : 'Approved' },
  ];

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
          {isAz ? 'Öyrənmə planı' : 'Learning path'}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {isAz ? 'Tapşırıqlarım' : 'My tasks'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isAz
            ? 'Həftələr üzrə tapşırıqları izləyin, təlimatı açın və həllinizi təqdim edin.'
            : 'Track weekly assignments, open the instructions, and submit your work.'}
        </p>
      </header>

      {loading ? (
        <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-sm text-slate-500" role="status">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          {isAz ? 'Tapşırıqlar yüklənir…' : 'Loading your tasks…'}
        </div>
      ) : !enrollment ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
            <CheckSquare className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {isAz ? 'Aktiv təcrübə proqramınız yoxdur' : 'No active internship yet'}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
            {isAz
              ? 'Proqrama qəbul olunduqdan sonra həmin istiqamətin həftəlik tapşırıqları burada görünəcək. Müraciətlərinizi və açıq proqramları yoxlaya bilərsiniz.'
              : 'Weekly assignments will appear here after you are accepted into a program. You can review your applications or browse open programs.'}
          </p>
          <Link
            href="/dashboard/internships"
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            {isAz ? 'Proqramlara bax' : 'Browse programs'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      ) : (
        <>
          {programs.length > 1 && (
            <section className="space-y-2">
              <label htmlFor="task-program" className="block text-sm font-semibold text-slate-900">
                {isAz ? 'Təcrübə proqramını seç' : 'Choose an internship program'}
              </label>
              <select
                id="task-program"
                value={enrollment.id}
                onChange={(event) => {
                  setSelectedProgramId(event.target.value);
                  setFilter('all');
                  const program = programs.find((item) => item.enrollment.id === event.target.value);
                  const url = new URL(window.location.href);
                  if (program) url.searchParams.set('program', program.enrollment.internship_id);
                  window.history.replaceState(null, '', url);
                }}
                className="min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {programs.map((item) => (
                  <option key={item.enrollment.id} value={item.enrollment.id}>
                    {item.enrollment.internship?.title || (isAz ? 'Təcrübə proqramı' : 'Internship program')} — {item.tasks.length} {isAz ? 'tapşırıq' : 'tasks'}
                  </option>
                ))}
              </select>
              <p className="text-sm text-slate-500">
                {isAz ? `${programs.length} aktiv proqramın tapşırıqlarına buradan keçə bilərsiniz.` : `Switch between assignments from your ${programs.length} active programs.`}
              </p>
            </section>
          )}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  {isAz ? 'Aktiv proqram' : 'Active program'}
                </span>
                <h2 className="mt-3 text-xl font-bold text-slate-900">
                  {enrollment.internship?.title || (isAz ? 'Təcrübə proqramı' : 'Internship program')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {isAz ? 'Tapşırıqlar proqramın həftələrinə görə qruplaşdırılıb.' : 'Assignments are grouped by program week.'}
                </p>
              </div>
              {enrollment.internship?.duration_weeks ? (
                <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  {enrollment.internship.duration_weeks} {isAz ? 'həftə' : 'weeks'}
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{isAz ? 'Tapşırıqlar' : 'Tasks'}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{tasks.length}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{isAz ? 'Təsdiqlənib' : 'Approved'}</p>
                <p className="mt-1 text-lg font-bold text-emerald-700">{approvedCount}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{isAz ? 'Yoxlanılır' : 'Under review'}</p>
                <p className="mt-1 text-lg font-bold text-amber-700">{pendingCount}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{isAz ? 'Düzəliş tələb olunur' : 'Needs changes'}</p>
                <p className="mt-1 text-lg font-bold text-orange-700">{revisionCount}</p>
              </div>
            </div>

            {tasks.length > 0 ? (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{isAz ? 'Təsdiqlənmiş işlərin irəliləyişi' : 'Approved-task progress'}</span>
                  <span className="font-bold text-emerald-800">{progress}%</span>
                </div>
                <div
                  className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label={isAz ? 'Tapşırıq irəliləyişi' : 'Task progress'}
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : null}
          </section>

          {tasks.length === 0 ? (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <ListTodo className="mx-auto h-8 w-8 text-slate-400" />
              <h3 className="mt-3 font-bold text-slate-900">
                {isAz ? 'Bu proqram üçün dərc olunmuş tapşırıq yoxdur' : 'No published tasks for this program'}
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
                {isAz
                  ? 'Qeydiyyatınız aktivdir, lakin tapşırıqlar hələ dərc edilməyib. Bir az sonra yenidən yoxlayın və ya proqram səhifəsini açın.'
                  : 'Your enrollment is active, but assignments have not been published yet. Check again later or open your program page.'}
              </p>
              <Link href="/dashboard/internship" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-900">
                {isAz ? 'Təcrübə səhifəsinə keç' : 'Open internship overview'} <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </section>
          ) : (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <ListTodo className="h-5 w-5 text-emerald-700" />
                    {isAz ? 'Həftəlik öyrənmə yolu' : 'Weekly learning path'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {isAz ? 'Tapşırığı açaraq addım-addım izahı və təqdimetmə qaydasını görün.' : 'Open a task to view the step-by-step guide and submission requirements.'}
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {visibleTaskCount} {isAz ? 'tapşırıq göstərilir' : 'tasks shown'}
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1" aria-label={isAz ? 'Tapşırıq filtrləri' : 'Task filters'}>
                {filterOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setFilter(option.key)}
                    aria-pressed={filter === option.key}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${filter === option.key ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {visibleTaskCount === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
                  {isAz ? 'Bu filtrə uyğun tapşırıq yoxdur.' : 'No tasks match this filter.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {weeks.map((week) => (
                    <section key={week.weekNumber} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
                        <h3 className="font-bold text-slate-900">
                          {isAz ? `${week.weekNumber}-ci həftə` : `Week ${week.weekNumber}`}
                        </h3>
                        <span className="text-xs text-slate-500">
                          {week.totalTasks} {isAz ? 'tapşırıq' : week.totalTasks === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>
                      {week.tasks.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {week.tasks.map(({ task, submission, status }) => {
                            const summary = extractLocalizedTaskText(task.description, isAz ? 'az' : 'en');
                            const dueDate = task.deadline
                              ? new Date(task.deadline).toLocaleDateString(isAz ? 'az-AZ' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                              : null;
                            return (
                              <article key={task.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                <div className="min-w-0 flex-1">
                                  <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-500">
                                      {isAz ? `Tapşırıq #${task.task_number}` : `Task #${task.task_number}`}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClasses(status)}`}>
                                      {status === 'approved' ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                                      {status === 'pending' ? <Clock3 className="h-3.5 w-3.5" /> : null}
                                      {status === 'revision_requested' || status === 'rejected' ? <RotateCcw className="h-3.5 w-3.5" /> : null}
                                      {statusLabel(status, isAz)}
                                    </span>
                                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                      {difficultyLabel(task.difficulty, isAz)}
                                    </span>
                                  </div>
                                  <h4 className="text-sm font-bold text-slate-900">{getLocalizedTaskTitle(task.title, isAz ? 'az' : 'en')}</h4>
                                  {summary ? <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">{summary}</p> : null}
                                  {submission?.admin_feedback && (status === 'revision_requested' || status === 'rejected') ? (
                                    <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-orange-800">
                                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                      <span>{submission.admin_feedback}</span>
                                    </p>
                                  ) : null}
                                  {dueDate ? (
                                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                                      <Clock3 className="h-3.5 w-3.5" />
                                      {isAz ? 'Son tarix:' : 'Due:'} {dueDate}
                                    </p>
                                  ) : null}
                                </div>
                                <Link
                                  href={`/dashboard/internship/tasks/${task.id}`}
                                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-700 px-3.5 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                                >
                                  {status === 'not_submitted'
                                    ? (isAz ? 'Tapşırığa başla' : 'Start task')
                                    : status === 'revision_requested' || status === 'rejected'
                                    ? (isAz ? 'Düzəliş et' : 'Revise task')
                                    : (isAz ? 'Təlimatı aç' : 'Open instructions')}
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              </article>
                            );
                          })}
                        </div>
                      ) : filter === 'all' ? (
                        <p className="px-4 py-4 text-sm text-slate-500 sm:px-5">
                          {isAz ? 'Bu həftə üçün dərc olunmuş tapşırıq yoxdur.' : 'No published task for this week.'}
                        </p>
                      ) : null}
                    </section>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
