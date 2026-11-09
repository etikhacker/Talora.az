'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { getMyCourseEnrollments, type CourseEnrollmentWithCourse } from '@/lib/courses/service';

export default function MyCoursesPage() {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const az = language === 'az';
  const [items, setItems] = useState<CourseEnrollmentWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!profile?.id) { if (active) setLoading(false); return; }
      try {
        const rows = await getMyCourseEnrollments(profile.id);
        if (active) setItems(rows);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load courses.');
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [profile?.id]);

  return (
    <div className="space-y-6">
      <header><p className="eyebrow mb-2">TALORA LEARNING</p>
        <h1 className="text-3xl font-bold">{az ? 'Kurslarım' : 'My courses'}</h1>
        <p className="mt-2 opacity-70">{az ? 'Qeydiyyatdan keçdiyin kurslar və öyrənmə yolun.' : 'Your enrolled courses and learning journey.'}</p>
      </header>
      <Link href="/courses" className="inline-flex items-center gap-2 text-blue-600 hover:underline">
        {az ? 'Kurslara bax' : 'Explore courses'} <ArrowRight size={16}/>
      </Link>
      {loading ? <p role="status">{az ? 'Yüklənir...' : 'Loading...'}</p> : error ? (
        <p role="alert" className="text-red-500">{error}</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-300/30 p-8">
          <BookOpen size={30} className="mb-4 opacity-50"/>
          <p>{az ? 'Hələ heç bir kursa yazılmamısan.' : 'You have not enrolled in any courses yet.'}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map(({ id, courses: course, status }) => (
            <article key={id} className="rounded-2xl border border-slate-300/30 p-6">
              <p className="mb-2 text-xs uppercase tracking-wider opacity-60">{status}</p>
              <h2 className="text-xl font-semibold">{course?.title ?? (az ? 'Kurs əlçatan deyil' : 'Course unavailable')}</h2>
              <p className="my-3 text-sm opacity-70">{course?.short_description}</p>
              {course && <Link className="inline-flex items-center gap-2 font-medium text-blue-600 hover:underline" href={'/courses/' + encodeURIComponent(course.slug)}>
                {az ? 'Kursa bax' : 'View course'} <ArrowRight size={16}/>
              </Link>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
