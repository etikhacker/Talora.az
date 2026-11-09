'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import {
  getPublishedCourseBySlug, getPublishedModules, getPublishedLessons,
  getMyCourseEnrollment, getLessonProgress, markLessonComplete,
  type Course, type CourseEnrollment, type CourseLesson, type CourseModule,
} from '@/lib/courses/service';

interface LessonRow { lesson: CourseLesson; module: CourseModule }

export default function LearnLessonPage({ params }: { params: Promise<{ courseSlug: string; lessonId: string }> }) {
  const { courseSlug, lessonId } = use(params);
  const { user, profile, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const az = language === 'az';
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [rows, setRows] = useState<LessonRow[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login?redirect=' + encodeURIComponent('/learn/' + courseSlug + '/' + lessonId)); return; }
    if (!profile?.id) return;
    let active = true;
    async function load() {
      try {
        const current = await getPublishedCourseBySlug(courseSlug);
        if (!current) throw new Error('Course not found.');
        const own = await getMyCourseEnrollment(current.id, profile!.id);
        if (!own || !['active','completed'].includes(own.status)) throw new Error('Enrollment required.');
        const modules = await getPublishedModules(current.id);
        const [lessonsByModule, progress] = await Promise.all([
          Promise.all(modules.map((module) => getPublishedLessons(module.id))),
          getLessonProgress(own.id),
        ]);
        if (active) {
          setCourse(current);
          setEnrollment(own);
          setRows(modules.flatMap((module, index) => lessonsByModule[index].map((lesson) => ({ module, lesson }))));
          setCompletedIds(progress.map((item) => item.lesson_id));
        }
      } catch (err) { if (active) setError(err instanceof Error ? err.message : 'Learning unavailable.'); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [authLoading, user, profile, courseSlug, lessonId, router]);

  const current = rows.find(({ lesson }) => lesson.id === lessonId);
  const required = useMemo(() => rows.filter(({ lesson }) => lesson.is_required), [rows]);
  const completedRequired = required.filter(({ lesson }) => completedIds.includes(lesson.id)).length;
  const percent = required.length ? Math.round(100 * completedRequired / required.length) : 0;
  const alreadyCompleted = completedIds.includes(lessonId);

  async function finishLesson() {
    if (!enrollment || !current || saving || alreadyCompleted) return;
    setSaving(true); setError(null);
    try {
      await markLessonComplete(enrollment.id, current.lesson.id);
      setCompletedIds((prev) => prev.includes(lessonId) ? prev : [...prev, lessonId]);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save progress.'); }
    finally { setSaving(false); }
  }

  return (
    <main id="main-content" className="min-h-screen bg-[var(--page)] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href={'/courses/' + encodeURIComponent(courseSlug)} className="mb-6 inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100">
          <ArrowLeft size={16}/>{az ? 'Kursa qayıt' : 'Back to course'}
        </Link>
        {loading || authLoading ? <p role="status">{az ? 'Dərs yüklənir...' : 'Loading lesson...'}</p>
          : error && !course ? <p role="alert" className="text-red-500">{error}</p>
          : course && <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
            <aside className="self-start rounded-2xl border border-slate-300/20 p-5">
              <h1 className="mb-4 text-lg font-semibold">{course.title}</h1>
              <div role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={az ? 'Kurs irəliləyişi' : 'Course progress'}
                className="mb-2 h-2 overflow-hidden rounded-full bg-slate-500/20">
                <div className="h-full bg-blue-600" style={{ width: percent + '%' }} />
              </div>
              <p className="mb-6 text-xs opacity-70">{percent}% {az ? 'tamamlanıb' : 'complete'}</p>
              <nav aria-label={az ? 'Dərslər' : 'Lessons'} className="space-y-1">
                {rows.map(({ lesson, module }) => <Link
                  key={lesson.id}
                  href={'/learn/' + encodeURIComponent(courseSlug) + '/' + encodeURIComponent(lesson.id)}
                  aria-current={lesson.id === lessonId ? 'page' : undefined}
                  className={'flex items-start gap-2 rounded-lg px-3 py-2 text-sm ' + (lesson.id === lessonId ? 'bg-blue-600/10 font-semibold text-blue-500' : 'hover:bg-slate-500/10')}>
                  {completedIds.includes(lesson.id) ? <CheckCircle2 size={17} className="shrink-0 text-emerald-500"/> : <Circle size={17} className="shrink-0 opacity-50"/>}
                  <span><span className="block text-xs opacity-55">{module.title}</span>{lesson.title}</span>
                </Link>)}
              </nav>
            </aside>
            <article className="rounded-2xl border border-slate-300/20 p-6 sm:p-10">
              {current ? <>
                <p className="eyebrow mb-3">{current.module.title}</p>
                <h2 className="mb-6 text-3xl font-bold">{current.lesson.title}</h2>
                <div className="mb-8 whitespace-pre-wrap leading-8">{current.lesson.content_md || (az ? 'Bu dərs üçün mətn yoxdur.' : 'No text content for this lesson.')}</div>
                {current.lesson.resource_url && <a href={current.lesson.resource_url} target="_blank" rel="noopener noreferrer"
                  className="mb-8 inline-flex items-center gap-2 font-semibold text-blue-600 hover:underline">
                  {az ? 'Tədris resursunu aç' : 'Open learning resource'} <ExternalLink size={16}/>
                </a>}
                <div className="border-t border-slate-300/20 pt-6">
                  <button type="button" disabled={alreadyCompleted || saving} onClick={() => void finishLesson()}
                    className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {alreadyCompleted ? (az ? 'Tamamlanıb' : 'Completed') : saving ? (az ? 'Saxlanılır...' : 'Saving...') : az ? 'Dərsi tamamla' : 'Mark as completed'}
                  </button>
                  {error && <p role="alert" className="mt-3 text-sm text-red-500">{error}</p>}
                </div>
              </> : <p role="alert">{az ? 'Dərs tapılmadı və ya giriş icazəsi yoxdur.' : 'Lesson not found or access denied.'}</p>}
            </article>
          </div>}
      </div>
    </main>
  );
}
