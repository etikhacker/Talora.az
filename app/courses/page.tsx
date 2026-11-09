'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight, Search, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useLanguage } from '@/lib/i18n/language-context';
import { getCourseCategories, getPublishedCourses, type Course, type CourseCategory } from '@/lib/courses/service';

export default function CoursesPage() {
  const { language } = useLanguage();
  const az = language === 'az';
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [level, setLevel] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [courseRows, categoryRows] = await Promise.all([getPublishedCourses(), getCourseCategories()]);
        if (mounted) { setCourses(courseRows); setCategories(categoryRows); }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Unable to load courses.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  const results = useMemo(() => courses.filter((course) => {
    const query = search.trim().toLocaleLowerCase();
    const matchesText = !query || [course.title, course.short_description].some((x) => x.toLocaleLowerCase().includes(query));
    return matchesText && (categoryId === 'all' || course.category_id === categoryId) && (level === 'all' || course.level === level);
  }), [courses, search, categoryId, level]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main-content" className="content-width public-main flex-1">
        <header className="mb-8 max-w-3xl">
          <p className="eyebrow mb-4">TALORA LEARNING</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{az ? 'Bacarıqlarını inkişaf etdir' : 'Learn skills for your next step'}</h1>
          <p className="mt-4 text-base opacity-75">{az ? 'Praktiki kursları araşdır, öyrən və təcrübə proqramlarına hazırlaş.' : 'Explore practical courses, build skills and prepare for internships.'}</p>
        </header>
        <section aria-label={az ? 'Kurs filtrləri' : 'Course filters'} className="mb-8 grid gap-3 rounded-2xl border border-slate-300/20 p-4 md:grid-cols-[2fr_1fr_1fr]">
          <label className="relative block">
            <span className="sr-only">{az ? 'Kurs axtar' : 'Search courses'}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={18} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={az ? 'Kurs axtar...' : 'Search courses...'} className="w-full rounded-lg border border-slate-300/30 bg-transparent py-2.5 pl-10 pr-3" />
          </label>
          <label><span className="sr-only">{az ? 'Kateqoriya' : 'Category'}</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-lg border border-slate-300/30 bg-transparent px-3 py-2.5">
              <option value="all">{az ? 'Bütün kateqoriyalar' : 'All categories'}</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{az ? category.name_az : category.name_en}</option>)}
            </select>
          </label>
          <label><span className="sr-only">{az ? 'Səviyyə' : 'Level'}</span>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full rounded-lg border border-slate-300/30 bg-transparent px-3 py-2.5">
              <option value="all">{az ? 'Bütün səviyyələr' : 'All levels'}</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
        </section>
        {loading ? (
          <p role="status" className="py-12 text-center opacity-70">{az ? 'Kurslar yüklənir...' : 'Loading courses...'}</p>
        ) : error ? (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-500/30 p-5"><AlertCircle size={20} /><p>{az ? 'Kursları yükləmək mümkün olmadı.' : 'Could not load courses.'} {error}</p></div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-slate-300/20 p-10 text-center"><BookOpen className="mx-auto mb-4 opacity-50" size={32}/><p>{az ? 'Hələ uyğun dərc edilmiş kurs yoxdur.' : 'No published courses match your filters yet.'}</p></div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {results.map((course) => <article key={course.id} className="flex flex-col rounded-2xl border border-slate-300/20 p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-500"><BookOpen size={23}/></div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-60">{course.level} · {course.language_code.toUpperCase()}</p>
              <h2 className="text-xl font-semibold">{course.title}</h2>
              <p className="my-3 flex-1 text-sm opacity-70">{course.short_description}</p>
              <Link href={'/courses/' + encodeURIComponent(course.slug)} className="mt-3 inline-flex items-center gap-2 font-semibold text-blue-500 hover:underline">
                {az ? 'Kursa bax' : 'View course'} <ArrowRight size={16}/>
              </Link>
            </article>)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
