'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import {
  enrollInCourse, getMyCourseEnrollment, getPublishedCourseBySlug, getPublishedModules,
  type Course, type CourseModule, type CourseEnrollment,
} from '@/lib/courses/service';

export default function CourseDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const az = language === 'az';
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const current = await getPublishedCourseBySlug(slug);
        if (!current) { if (mounted) setLoading(false); return; }
        const [items, own] = await Promise.all([
          getPublishedModules(current.id),
          profile?.id ? getMyCourseEnrollment(current.id, profile.id) : Promise.resolve(null),
        ]);
        if (mounted) { setCourse(current); setModules(items); setEnrollment(own); }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Course unavailable.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (!authLoading) void load();
    return () => { mounted = false; };
  }, [slug, profile?.id, authLoading]);

  async function enroll() {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent('/courses/' + slug));
      return;
    }
    if (!profile) { setError(az ? 'Profil yüklənməyib.' : 'Profile is not loaded.'); return; }
    if (profile.role !== 'student') return;
    if (!course) return;
    setEnrolling(true);
    setError(null);
    try { setEnrollment(await enrollInCourse(course.id, profile.id)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Enrollment failed.'); }
    finally { setEnrolling(false); }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main-content" className="content-width public-main flex-1">
        <Link href="/courses" className="mb-8 inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100">
          <ArrowLeft size={16}/> {az ? 'Bütün kurslar' : 'All courses'}
        </Link>
        {loading || authLoading ? (
          <p role="status" className="py-12">{az ? 'Yüklənir...' : 'Loading...'}</p>
        ) : !course && !error ? (
          <div className="public-panel">{az ? 'Kurs tapılmadı və ya dərc edilməyib.' : 'Course not found or unpublished.'}</div>
        ) : error && !course ? (
          <p role="alert" className="text-red-500">{error}</p>
        ) : course && (
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <article>
              <p className="eyebrow mb-4">TALORA COURSES · {course.level.toUpperCase()}</p>
              <h1 className="mb-4 text-4xl font-bold tracking-tight">{course.title}</h1>
              <p className="mb-6 text-lg opacity-80">{course.short_description}</p>
              {course.description && <p className="mb-9 whitespace-pre-wrap leading-relaxed opacity-80">{course.description}</p>}
              <h2 className="mb-4 text-2xl font-semibold">{az ? 'Kurs proqramı' : 'Course curriculum'}</h2>
              <div className="space-y-3">
                {modules.map((module, index) => (
                  <section key={module.id} className="rounded-xl border border-slate-300/20 p-5">
                    <h3 className="font-semibold">{index + 1}. {module.title}</h3>
                    {module.description && <p className="mt-2 text-sm opacity-65">{module.description}</p>}
                  </section>
                ))}
                {modules.length === 0 && <p className="opacity-70">{az ? 'Tədris planı hələ yayımlanmayıb.' : 'The curriculum has not been published yet.'}</p>}
              </div>
            </article>
            <aside className="self-start rounded-2xl border border-slate-300/20 p-6">
              <BookOpen className="mb-4 text-blue-500" size={29}/>
              <p className="mb-1 text-sm opacity-65">{az ? 'Dil' : 'Language'}: {course.language_code.toUpperCase()}</p>
              <p className="mb-1 text-sm opacity-65">{az ? 'Səviyyə' : 'Level'}: {course.level}</p>
              {course.duration_minutes && <p className="mb-5 text-sm opacity-65">{az ? 'Müddət' : 'Duration'}: {course.duration_minutes} min</p>}
              {enrollment ? (
                <div className="mt-5 space-y-3">
                  <p className="flex items-center gap-2 text-sm text-emerald-500"><CheckCircle2 size={17}/>{az ? 'Qeydiyyatdan keçmisiniz' : 'You are enrolled'}</p>
                  <Link className="inline-flex rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700" href={'/learn/' + encodeURIComponent(course.slug)}>
                    {az ? 'Öyrənməyə davam et' : 'Continue learning'}
                  </Link>
                </div>
              ) : (
                <button type="button" onClick={() => void enroll()} disabled={enrolling || authLoading || (profile?.role === 'admin')}
                  className="mt-5 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {enrolling ? (az ? 'Qeydiyyat edilir...' : 'Enrolling...') : az ? 'Pulsuz başla' : 'Enroll for free'}
                </button>
              )}
              {error && <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-red-500"><AlertCircle size={16}/>{error}</p>}
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
