'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import {
  getPublishedCourseBySlug, getPublishedModules, getPublishedLessons, getMyCourseEnrollment,
} from '@/lib/courses/service';

export default function CourseLaunchPage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = use(params);
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login?redirect=' + encodeURIComponent('/learn/' + courseSlug));
      return;
    }
    if (!profile?.id) return;
    let active = true;
    async function launch() {
      try {
        const course = await getPublishedCourseBySlug(courseSlug);
        if (!course) throw new Error('Course not found.');
        const enrollment = await getMyCourseEnrollment(course.id, profile!.id);
        if (!enrollment || !['active', 'completed'].includes(enrollment.status)) throw new Error('Enroll before starting this course.');
        const modules = await getPublishedModules(course.id);
        for (const module of modules) {
          const lessons = await getPublishedLessons(module.id);
          if (lessons.length) {
            router.replace('/learn/' + encodeURIComponent(courseSlug) + '/' + lessons[0].id);
            return;
          }
        }
        throw new Error('This course has no published lessons yet.');
      } catch (err) { if (active) setError(err instanceof Error ? err.message : 'Course unavailable.'); }
    }
    void launch();
    return () => { active = false; };
  }, [isLoading, user?.id, profile?.id, courseSlug, router]);

  return (
    <main id="main-content" className="content-width public-main">
      {error ? <div role="alert" className="space-y-4"><p>{error}</p><Link href={'/courses/' + encodeURIComponent(courseSlug)} className="text-blue-600 hover:underline">Back to course</Link></div>
        : <p role="status">Opening your course...</p>}
    </main>
  );
}
