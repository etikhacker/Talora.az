'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Pencil, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import {
  createDraftCourse, getAllCoursesForAdmin, getCourseCategories,
  type Course, type CourseCategory, type CourseLevel,
} from '@/lib/courses/service';

function slugify(value: string) {
  return value.toLocaleLowerCase().replace(/ə/g, 'e').replace(/ı/g, 'i').replace(/ö/g, 'o')
    .replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function AdminCoursesPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const az = language === 'az';
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [level, setLevel] = useState<CourseLevel>('beginner');
  const [languageCode, setLanguageCode] = useState<'az' | 'en'>('en');

  async function refresh() { setCourses(await getAllCoursesForAdmin()); }

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [items, cats] = await Promise.all([getAllCoursesForAdmin(), getCourseCategories()]);
        if (active) { setCourses(items); setCategories(cats); }
      } catch (err) { if (active) setError(err instanceof Error ? err.message : 'Unable to load courses.'); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, []);

  async function createCourse(event: React.FormEvent) {
    event.preventDefault();
    if (!user?.id || saving) return;
    setSaving(true); setError(null);
    try {
      await createDraftCourse({
        title: title.trim(), slug: slug.trim(), short_description: summary.trim(),
        description: description.trim(), category_id: categoryId || null, level, language_code: languageCode,
      }, user.id);
      setTitle(''); setSlug(''); setSummary(''); setDescription(''); setCategoryId('');
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create course.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-8 pb-10">
      <header><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-400">TALORA LEARNING</p>
        <h1 className="text-3xl font-bold">{az ? 'Kursların idarə edilməsi' : 'Course management'}</h1>
        <p className="mt-2 text-sm text-slate-400">{az ? 'Yeni kurs yarat, məzmunu əlavə et və hazır olduqda dərc et.' : 'Create a draft, add learning material, then publish.'}</p>
      </header>
      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold"><Plus size={19}/>{az ? 'Yeni kurs' : 'New course'}</h2>
        <form onSubmit={(event) => void createCourse(event)} className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">{az ? 'Başlıq' : 'Title'} *
            <input required maxLength={150} value={title} onChange={(e) => { setTitle(e.target.value); setSlug(slugify(e.target.value)); }}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5" />
          </label>
          <label className="block text-sm">Slug *
            <input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={(e) => setSlug(e.target.value)} maxLength={120}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5" />
          </label>
          <label className="block text-sm">{az ? 'Kateqoriya' : 'Category'}
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5">
              <option value="">{az ? 'Kateqoriya seç' : 'Select category'}</option>
              {categories.map((item) => <option key={item.id} value={item.id}>{az ? item.name_az : item.name_en}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">{az ? 'Səviyyə' : 'Level'}
              <select value={level} onChange={(e) => setLevel(e.target.value as CourseLevel)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5">
                <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
              </select>
            </label>
            <label className="block text-sm">{az ? 'Dil' : 'Language'}
              <select value={languageCode} onChange={(e) => setLanguageCode(e.target.value as 'az' | 'en')} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5">
                <option value="en">English</option><option value="az">Azərbaycan</option>
              </select>
            </label>
          </div>
          <label className="block text-sm md:col-span-2">{az ? 'Qısa təsvir' : 'Short description'}
            <input value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={500}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5" />
          </label>
          <label className="block text-sm md:col-span-2">{az ? 'Tam təsvir' : 'Description'}
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5" />
          </label>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving || !user} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? (az ? 'Yaradılır...' : 'Creating...') : az ? 'Qaralama yarat' : 'Create draft'}
            </button>
          </div>
        </form>
      </section>
      {error && <p role="alert" className="flex items-center gap-2 text-red-400"><AlertCircle size={18}/>{error}</p>}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{az ? 'Mövcud kurslar' : 'Existing courses'}</h2>
        {loading ? <p role="status">{az ? 'Yüklənir...' : 'Loading...'}</p>
          : courses.length === 0 ? <div className="rounded-xl border border-slate-700 p-8 text-center text-slate-400"><BookOpen className="mx-auto mb-3" size={28}/>{az ? 'Kurs hələ yoxdur.' : 'No courses yet.'}</div>
          : <div className="grid gap-3">{courses.map((course) => <article key={course.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-700 bg-slate-900 p-5">
            <div><p className="text-xs uppercase tracking-wider text-blue-400">{course.status} · {course.level}</p><h3 className="mt-1 font-semibold">{course.title}</h3><p className="mt-1 text-xs text-slate-400">{course.slug}</p></div>
            <Link href={'/admin/courses/' + course.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm hover:border-blue-500">
              <Pencil size={16}/>{az ? 'İdarə et' : 'Manage'}
            </Link>
          </article>)}</div>}
      </section>
    </div>
  );
}
