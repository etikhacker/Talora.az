'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Plus, Save, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/language-context';
import {
  createCourseModule, createCourseLesson,
  type Course, type CourseModule, type CourseLesson, type CourseStatus,
} from '@/lib/courses/service';

export default function AdminCourseEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { language } = useLanguage();
  const az = language === 'az';
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [moduleTitle, setModuleTitle] = useState('');
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [content, setContent] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [lessonType, setLessonType] = useState<CourseLesson['lesson_type']>('text');
  const [lessonRequired, setLessonRequired] = useState(true);
  const [lessonStatus, setLessonStatus] = useState<CourseLesson['status']>('draft');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    const db = createClient();
    if (!db) throw new Error('Database is not configured.');
    const [courseRes, moduleRes] = await Promise.all([
      db.from('courses').select('*').eq('id', id).maybeSingle(),
      db.from('course_modules').select('*').eq('course_id', id).order('position'),
    ]);
    if (courseRes.error) throw new Error(courseRes.error.message);
    if (moduleRes.error) throw new Error(moduleRes.error.message);
    const currentModules = (moduleRes.data ?? []) as CourseModule[];
    let currentLessons: CourseLesson[] = [];
    if (currentModules.length) {
      const lessonRes = await db.from('course_lessons').select('*')
        .in('module_id', currentModules.map((module) => module.id)).order('position');
      if (lessonRes.error) throw new Error(lessonRes.error.message);
      currentLessons = (lessonRes.data ?? []) as CourseLesson[];
    }
    setCourse((courseRes.data as Course | null) ?? null);
    setModules(currentModules);
    setLessons(currentLessons);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const db = createClient();
        if (!db) throw new Error('Database is not configured.');
        const [courseRes, moduleRes] = await Promise.all([
          db.from('courses').select('*').eq('id', id).maybeSingle(),
          db.from('course_modules').select('*').eq('course_id', id).order('position'),
        ]);
        if (courseRes.error) throw new Error(courseRes.error.message);
        if (moduleRes.error) throw new Error(moduleRes.error.message);
        const currentModules = (moduleRes.data ?? []) as CourseModule[];
        let currentLessons: CourseLesson[] = [];
        if (currentModules.length) {
          const lessonRes = await db.from('course_lessons').select('*')
            .in('module_id', currentModules.map((m) => m.id)).order('position');
          if (lessonRes.error) throw new Error(lessonRes.error.message);
          currentLessons = (lessonRes.data ?? []) as CourseLesson[];
        }
        if (active) {
          setCourse((courseRes.data as Course | null) ?? null);
          setModules(currentModules); setLessons(currentLessons);
        }
      } catch (err) { if (active) setError(err instanceof Error ? err.message : 'Load failed.'); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [id]);

  async function execute(action: () => Promise<void>) {
    setWorking(true); setError(null); setNotice(null);
    try { await action(); await refresh(); setNotice(az ? 'Dəyişiklik saxlanıldı.' : 'Changes saved.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Operation failed.'); }
    finally { setWorking(false); }
  }

  function selectLesson(lesson: CourseLesson) {
    setSelectedLesson(lesson.id); setLessonTitle(lesson.title);
    setContent(lesson.content_md); setResourceUrl(lesson.resource_url ?? '');
    setLessonType(lesson.lesson_type); setLessonRequired(lesson.is_required);
    setLessonStatus(lesson.status);
  }

  async function saveLesson() {
    if (!selectedLesson || !lessonTitle.trim()) return;
    const url = resourceUrl.trim();
    if (lessonType !== 'text' && !url) { setError('Provide an HTTPS resource URL.'); return; }
    if (url && (!url.startsWith('https://') || !URL.canParse(url))) { setError('Resource URL must be valid HTTPS.'); return; }
    await execute(async () => {
      const db = createClient();
      if (!db) throw new Error('Database is not configured.');
      const { error: updateError } = await db.from('course_lessons').update({
        title: lessonTitle.trim(), content_md: content, resource_url: url || null,
        lesson_type: lessonType, is_required: lessonRequired, status: lessonStatus,
      }).eq('id', selectedLesson);
      if (updateError) throw new Error(updateError.message);
    });
  }

  async function changeCourseStatus(status: CourseStatus) {
    if (!course) return;
    if (status === 'published' && !modules.some((m) =>
      m.status === 'published' && lessons.some((lesson) => lesson.module_id === m.id && lesson.status === 'published'))) {
      setError(az ? 'Əvvəl ən az bir modul və dərs dərc edilməlidir.' : 'Publish at least one module and lesson first.');
      return;
    }
    await execute(async () => {
      const db = createClient();
      if (!db) throw new Error('Database is not configured.');
      const { error: updateError } = await db.from('courses').update({ status }).eq('id', course.id);
      if (updateError) throw new Error(updateError.message);
    });
  }

  return (
    <div className="space-y-7 pb-10">
      <Link href="/admin/courses" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16}/>{az ? 'Kurslara qayıt' : 'Back to courses'}</Link>
      {loading ? <p role="status">{az ? 'Yüklənir...' : 'Loading...'}</p>
        : !course && !error ? <p>{az ? 'Kurs tapılmadı.' : 'Course not found.'}</p>
        : course && <>
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="mb-2 text-xs uppercase tracking-widest text-blue-400">{course.status}</p><h1 className="text-3xl font-bold">{course.title}</h1></div>
            <div className="flex flex-wrap gap-2">
              {course.status === 'published' && <Link href={'/courses/' + course.slug} className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm"><ExternalLink size={15}/>{az ? 'Baxış' : 'View'}</Link>}
              <button disabled={working} onClick={() => void changeCourseStatus(course.status === 'published' ? 'draft' : 'published')}
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">
                {course.status === 'published' ? (az ? 'Qaralamaya keç' : 'Unpublish') : az ? 'Kursu dərc et' : 'Publish course'}
              </button>
            </div>
          </header>
          <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><BookOpen size={19}/>{az ? 'Modullar və dərslər' : 'Modules & lessons'}</h2>
            {modules.map((module) => <article key={module.id} className="mb-4 rounded-lg border border-slate-700 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold">{module.position}. {module.title} <span className="text-xs font-normal text-slate-400">({module.status})</span></h3>
                <button disabled={working} onClick={() => void execute(async () => {
                  const db = createClient(); if (!db) throw new Error('Database is not configured.');
                  const { error: issue } = await db.from('course_modules').update({ status: module.status === 'published' ? 'draft' : 'published' }).eq('id', module.id);
                  if (issue) throw new Error(issue.message);
                })} className="rounded-md border border-slate-600 px-3 py-1 text-xs disabled:opacity-50">
                  {module.status === 'published' ? (az ? 'Gizlət' : 'Unpublish') : az ? 'Dərc et' : 'Publish'}
                </button>
              </div>
              <div className="space-y-2">
                {lessons.filter((lesson) => lesson.module_id === module.id).map((lesson) =>
                  <button type="button" key={lesson.id} onClick={() => selectLesson(lesson)}
                    className={'block w-full rounded-lg border px-3 py-2 text-left text-sm ' + (selectedLesson === lesson.id ? 'border-blue-500' : 'border-slate-700 hover:border-slate-500')}>
                    {lesson.position}. {lesson.title} <span className="text-xs text-slate-400"> · {lesson.status}</span>
                  </button>)}
              </div>
              {activeModule === module.id ? <form className="mt-4 flex flex-wrap gap-2" onSubmit={(e) => {
                e.preventDefault();
                void execute(async () => {
                  const position = Math.max(0,...lessons.filter((l) => l.module_id === module.id).map((l) => l.position))+1;
                  await createCourseLesson(module.id,newLessonTitle,position);
                  setNewLessonTitle(''); setActiveModule(null);
                });
              }}>
                <input required value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} placeholder={az ? 'Dərs başlığı' : 'Lesson title'}
                  className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2"/>
                <button disabled={working} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50">+ {az ? 'Əlavə et' : 'Add'}</button>
              </form> : <button onClick={() => { setActiveModule(module.id); setNewLessonTitle(''); }} className="mt-4 inline-flex items-center gap-1 text-sm text-blue-400"><Plus size={15}/>{az ? 'Dərs əlavə et' : 'Add lesson'}</button>}
            </article>)}
            <form onSubmit={(e) => {
              e.preventDefault();
              void execute(async () => {
                await createCourseModule(id,moduleTitle,Math.max(0,...modules.map((m) => m.position))+1);
                setModuleTitle('');
              });
            }} className="mt-5 flex flex-wrap gap-2">
              <input required value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} placeholder={az ? 'Yeni modulun başlığı' : 'New module title'}
                className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2"/>
              <button disabled={working} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"><Plus size={16}/>{az ? 'Modul əlavə et' : 'Add module'}</button>
            </form>
          </section>
          {selectedLesson && <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="text-xl font-semibold">{az ? 'Dərsi redaktə et' : 'Edit lesson'}</h2>
            <label className="block text-sm">{az ? 'Başlıq' : 'Title'}
              <input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} maxLength={180}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 p-3"/>
            </label>
            <label className="block text-sm">{az ? 'Məzmun (sadə mətn)' : 'Content (plain text)'}
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 p-3"/>
            </label>
            <label className="block text-sm">{az ? 'HTTPS resurs linki' : 'HTTPS resource URL'}
              <input value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 p-3"/>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">{az ? 'Dərs növü' : 'Lesson type'}
                <select value={lessonType} onChange={(e) => setLessonType(e.target.value as CourseLesson['lesson_type'])} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 p-3">
                  <option value="text">Text</option><option value="video">Video</option><option value="link">External link</option>
                </select>
              </label>
              <label className="block text-sm">{az ? 'Status' : 'Status'}
                <select value={lessonStatus} onChange={(e) => setLessonStatus(e.target.value as CourseLesson['status'])} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 p-3">
                  <option value="draft">Draft</option><option value="published">Published</option>
                </select>
              </label>
            </div>
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={lessonRequired} onChange={(e) => setLessonRequired(e.target.checked)}/>{az ? 'Məcburi dərs' : 'Required lesson'}</label>
            <button disabled={working || !lessonTitle.trim()} onClick={() => void saveLesson()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"><Save size={17}/>{az ? 'Saxla' : 'Save lesson'}</button>
          </section>}
        </>}
      {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="text-sm text-emerald-400">{notice}</p>}
    </div>
  );
}
