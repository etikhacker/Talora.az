'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ScrollRevealTitle } from '@/components/landing/scroll-reveal-title';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-context';
import type { Internship } from '@/types/database';
import { formatDate } from '@/lib/utils/date';
import {
  Briefcase,
  ArrowRight,
  Code2,
  Palette,
  BarChart3,
  Cpu,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  FileCheck2,
  Globe2,
  MoveUpRight,
  Sparkle,
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'technology',
    query: 'Software',
    enName: 'Technology & Software',
    azName: 'Texnologiya və Proqramlaşdırma',
    enDesc: 'Web engineering, backend architectures, APIs, and modern platforms.',
    azDesc: 'Veb proqramlaşdırma, backend sistemləri, API və müasir platformalar.',
    icon: Code2,
  },
  {
    id: 'data-ai',
    query: 'Data',
    enName: 'Data & Artificial Intelligence',
    azName: 'Məlumat və Süni İntellekt',
    enDesc: 'Analytics, data modeling, machine learning, and automation workflows.',
    azDesc: 'Analitika, verilənlər bazası, maşın öyrənməsi və avtomatlaşdırma.',
    icon: Cpu,
  },
  {
    id: 'design',
    query: 'Design',
    enName: 'Design & Creative',
    azName: 'Dizayn və Yaradıcı Sahələr',
    enDesc: 'UI/UX systems, product design, prototyping, and user research.',
    azDesc: 'UI/UX sistemləri, məhsul dizaynı, prototipləşdirmə və istifadəçi tədqiqatları.',
    icon: Palette,
  },
  {
    id: 'business',
    query: 'Business',
    enName: 'Business & Marketing',
    azName: 'Biznes və Marketinq',
    enDesc: 'Product growth, market research, content strategy, and operations.',
    azDesc: 'Məhsul inkişafı, bazar araşdırmaları, məzmun strategiyası və əməliyyatlar.',
    icon: BarChart3,
  },
  {
    id: 'engineering',
    query: 'Engineering',
    enName: 'Engineering & Systems',
    azName: 'Mühəndislik və Sistemlər',
    enDesc: 'Infrastructure, DevOps, system reliability, and cloud solutions.',
    azDesc: 'İnfrastruktur, DevOps, sistem etibarlılığı və bulud texnologiyaları.',
    icon: Layers,
  },
  {
    id: 'other',
    query: '',
    enName: 'All Opportunities',
    azName: 'Bütün İmkanlar',
    enDesc: 'Browse the complete catalog of verified internship cohorts.',
    azDesc: 'Təsdiqlənmiş bütün təcrübə proqramları kataloquna baxın.',
    icon: Globe2,
  },
];

export default function HomePage() {
  const { language } = useLanguage();
  const isAz = language === 'az';

  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadPrograms() {
      try {
        setFetchError(false);
        const res = await fetch('/api/internships/public', { cache: 'no-store' });
        if (!res.ok) throw new Error('Could not fetch');
        const data = (await res.json()) as Internship[];
        if (active) {
          const published = data.filter((item) => item.status === 'published');
          setInternships(published.slice(0, 4));
        }
      } catch {
        if (active) {
          setFetchError(true);
          setInternships([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadPrograms();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="talora-home flex min-h-screen flex-col bg-[#F8FAFC] text-[#101828]">
      <Navbar />

      <main className="flex-1">
        {/* =====================================================================
            HERO SECTION
            ===================================================================== */}
        <section className="landing-hero relative overflow-hidden border-b border-slate-200 bg-white py-14 sm:py-20 lg:py-24">
          <div className="pointer-events-none absolute inset-0 landing-grain" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:gap-16 lg:px-8">
            <div className="max-w-2xl">
              <p className="mb-5 inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.13em] text-blue-700">
                <Sparkle className="h-3.5 w-3.5" />
                {isAz ? 'Karyeran üçün real başlanğıc' : 'A practical start to your career'}
              </p>
              <h1 className="max-w-[14ch] text-5xl font-semibold leading-[.98] tracking-[-.055em] text-slate-900 sm:text-6xl lg:text-[4.7rem]">
                {isAz ? <>Öyrəndiklərini <span className="landing-accent">təcrübəyə</span> çevir.</> : <>Turn what you learn into <span className="landing-accent">experience.</span></>}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                {isAz
                  ? 'Real layihələrdə çalış, mentor rəyi al və növbəti addımını inamla at. Sənə uyğun təcrübə proqramını Talora-da tap.'
                  : 'Work on real projects, get mentor feedback, and take your next step with confidence. Find an internship that fits you.'}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/internships">
                  <Button size="lg" className="h-12 bg-blue-600 hover:bg-blue-700 text-white px-6 font-semibold gap-2 shadow-sm">
                    {isAz ? 'Proqramlara bax' : 'Explore programs'}
                    <MoveUpRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <span className="inline-flex h-12 items-center px-3 text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-blue-700">
                    {isAz ? 'Platforma necə işləyir' : 'How it works'}
                  </span>
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-slate-200 pt-5 text-xs font-medium text-slate-600">
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-600" />{isAz ? 'Real tapşırıqlar' : 'Real assignments'}</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-600" />{isAz ? 'Mentor dəstəyi' : 'Mentor feedback'}</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-600" />{isAz ? 'Təsdiqlənən nəticə' : 'Verified outcomes'}</span>
              </div>
            </div>

            <div className="landing-visual relative mx-auto w-full max-w-[570px] lg:ml-auto">
              <div className="landing-visual-grid absolute inset-0 rounded-[2rem]" aria-hidden="true" />
              <div className="relative min-h-[350px] overflow-hidden rounded-[1.65rem] border border-[#d8deee] bg-[#e9edf9] p-5 shadow-[0_28px_80px_-44px_rgba(33,50,100,.45)] sm:min-h-[430px] sm:p-7">
                <div className="absolute -right-12 -top-10 h-64 w-64 rounded-full border border-blue-300/60" aria-hidden="true" />
                <div className="absolute -right-1 top-5 h-48 w-48 rounded-full border border-blue-300/50" aria-hidden="true" />
                <div className="absolute bottom-0 left-0 h-2/3 w-full bg-gradient-to-t from-[#d5ddf4] to-transparent" aria-hidden="true" />
                <div className="relative flex items-center justify-between text-[11px] font-semibold uppercase tracking-[.14em] text-[#52618b]">
                  <span>Talora / 01</span><span>{isAz ? 'Təcrübəyə başla' : 'Start learning'}</span>
                </div>
                <div className="relative mt-14 max-w-[340px] sm:mt-20">
                  <p className="text-xs font-semibold text-blue-700">{isAz ? 'Nəzəriyyədən praktikaya' : 'From learning to doing'}</p>
                  <p className="mt-3 font-serif text-4xl leading-[1.02] tracking-[-.04em] text-[#202b43] sm:text-5xl">{isAz ? 'İlk layihən. Yeni istiqamətin.' : 'Your first project. A new direction.'}</p>
                </div>
                <div className="relative mt-10 flex items-end justify-between gap-4 sm:mt-12">
                  <div className="rounded-xl border border-white/80 bg-white/85 p-4 shadow-lg shadow-blue-950/5 backdrop-blur">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{isAz ? 'Öyrən' : 'Learn'}</p>
                    <p className="mt-1 font-serif text-xl text-[#202b43]">{isAz ? 'Tapşırıq' : 'Assignment'}</p>
                  </div>
                  <div className="mb-7 rounded-xl border border-white/70 bg-[#435fd1] p-4 text-white shadow-xl shadow-blue-900/20">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">{isAz ? 'İrəlilə' : 'Progress'}</p>
                    <p className="mt-1 font-serif text-xl">{isAz ? 'Mentor rəyi' : 'Mentor review'}</p>
                  </div>
                  <div className="rounded-xl border border-white/80 bg-white/85 p-4 shadow-lg shadow-blue-950/5 backdrop-blur">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{isAz ? 'Nəticə' : 'Outcome'}</p>
                    <p className="mt-1 font-serif text-xl text-[#202b43]">{isAz ? 'Sertifikat' : 'Certificate'}</p>
                  </div>
                </div>
                <div className="absolute bottom-5 right-5 grid h-11 w-11 place-items-center rounded-full bg-white text-blue-700 shadow-md sm:bottom-7 sm:right-7"><ArrowRight className="h-5 w-5" /></div>
              </div>
            </div>

          </div>
        </section>

        {/* =====================================================================
            OPPORTUNITY DISCOVERY SECTION
            ===================================================================== */}
        <section className="landing-discovery-section py-16 sm:py-20 border-b border-slate-200 bg-[#F8FAFC]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <ScrollRevealTitle className="landing-section-title text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {isAz ? 'İstiqamətinizi tapın' : 'Find your path'}
              </ScrollRevealTitle>
              <p className="mt-2 text-sm sm:text-base text-slate-600">
                {isAz
                  ? 'Maraqlarınıza və ambisiyalarınıza uyğun fürsətləri araşdırın.'
                  : 'Explore opportunities that match your interests and ambitions.'}
              </p>
            </div>

            <div className="landing-category-grid mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const linkHref = cat.query ? `/internships?search=${encodeURIComponent(cat.query)}` : '/internships';
                return (
                  <Link
                    key={cat.id}
                    href={linkHref}
                    className="landing-category-card group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-xs"
                  >
                    <div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {isAz ? cat.azName : cat.enName}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-500">
                        {isAz ? cat.azDesc : cat.enDesc}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                      <span>{isAz ? 'Vakansiyalara bax' : 'Explore opportunities'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================================
            FEATURED INTERNSHIPS SECTION
            ===================================================================== */}
        <section className="landing-programs-section py-16 sm:py-20 border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <ScrollRevealTitle className="landing-section-title text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {isAz ? 'Təcrübə imkanlarını kəşf edin' : 'Explore internship opportunities'}
                </ScrollRevealTitle>
                <p className="mt-2 text-sm sm:text-base text-slate-600">
                  {isAz
                    ? 'Sənaye mentorları ilə təcrübə qazanmaq üçün aktiv proqramlar.'
                    : 'Active programs curated to help you gain structured hands-on experience.'}
                </p>
              </div>

              <Link href="/internships">
                <Button variant="outline" size="sm" className="border-slate-200 text-slate-800 hover:bg-slate-50 gap-1.5 font-medium">
                  <span>{isAz ? 'Bütün vakansiyalar' : 'View all cohorts'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Content states */}
            {loading ? (
              <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                    <div className="h-4 w-24 rounded bg-slate-100" />
                    <div className="h-6 w-3/4 rounded bg-slate-100" />
                    <div className="h-4 w-full rounded bg-slate-100" />
                    <div className="h-4 w-1/2 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : fetchError ? (
              <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-600">
                  {isAz ? 'Təcrübə proqramlarını yükləmək mümkün olmadı.' : 'Could not load internship opportunities.'}
                </p>
                <Link href="/internships" className="mt-3 inline-block">
                  <Button variant="outline" size="sm" className="mt-2">
                    {isAz ? 'Yenidən cəhd et' : 'Try Again'}
                  </Button>
                </Link>
              </div>
            ) : internships.length === 0 ? (
              <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
                <Briefcase className="mx-auto h-8 w-8 text-slate-400" />
                <h3 className="mt-3 text-base font-semibold text-slate-900">
                  {isAz ? 'Hazırda aktiv təcrübə vakansiyası yoxdur' : 'No active cohorts published yet'}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  {isAz
                    ? 'Yeni təcrübə proqramları təsdiqləndikdən sonra burada elan olunacaq.'
                    : 'New verified internship cohorts will appear here once published by program coordinators.'}
                </p>
              </div>
            ) : (
              <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
                {internships.map((item) => (
                  <Link
                    key={item.id}
                    href={`/internships/${item.id}`}
                    className="landing-program-card group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-xs"
                  >
                    <div>
                      {/* Zero-pill metadata row */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                        <span className="text-blue-600 font-semibold">{item.category || 'General Track'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{item.difficulty}</span>
                        {item.duration_weeks ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{item.duration_weeks} {isAz ? 'həftə' : 'weeks'}</span>
                          </>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-2">
                        {item.short_description || item.description}
                      </p>
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        {item.application_deadline ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{isAz ? 'Son tarix:' : 'Deadline:'} {formatDate(item.application_deadline)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{isAz ? 'Müraciətlər açıqdır' : 'Open Cohort'}</span>
                          </div>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                        <span>{isAz ? 'Ətraflı bax' : 'View details'}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =====================================================================
            HOW IT WORKS SECTION
            ===================================================================== */}
        <section id="how-it-works" className="landing-process-section py-16 sm:py-20 border-b border-slate-200 bg-[#F8FAFC]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
                {isAz ? 'Platformanın iş prinsipi' : 'Workflow & Methodology'}
              </p>
              <ScrollRevealTitle className="landing-section-title text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {isAz ? 'Üç sadə addımla karyeranızı başladın' : 'How Talora works'}
              </ScrollRevealTitle>
              <p className="mt-2 text-sm sm:text-base text-slate-600">
                {isAz
                  ? 'Nəzəriyyəni real təcrübəyə və yoxlanıla bilən nəticələrə çeviririk.'
                  : 'We bridge academic fundamentals with practical workplace output and verified credentials.'}
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Step 1 */}
              <div className="landing-step-card rounded-xl border border-slate-200 bg-white p-7">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">{isAz ? 'Kəşf et' : 'Discover'}</div>
                <h3 className="mt-3 text-lg font-bold text-slate-900">
                  {isAz ? 'Fürsətləri kəşf edin' : 'Discover opportunities'}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {isAz
                    ? 'İxtisasınıza və maraqlarınıza uyğun təcrübə proqramlarını araşdırın, tələbləri nəzərdən keçirin.'
                    : 'Explore curated programs across engineering, design, and business. Review prerequisites and curriculum roadmaps.'}
                </p>
              </div>

              {/* Step 2 */}
              <div className="landing-step-card rounded-xl border border-slate-200 bg-white p-7">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">{isAz ? 'Müraciət et' : 'Apply'}</div>
                <h3 className="mt-3 text-lg font-bold text-slate-900">
                  {isAz ? 'Müraciət edin və təcrübə toplayın' : 'Apply and build experience'}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {isAz
                    ? 'Motivasiya məktubunuzu təqdim edin, təsdiq aldıqdan sonra strukturlaşdırılmış modullara başlayın.'
                    : 'Submit your profile, receive approval from coordinators, and embark on structured weekly assignments.'}
                </p>
              </div>

              {/* Step 3 */}
              <div className="landing-step-card rounded-xl border border-slate-200 bg-white p-7">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">{isAz ? 'İrəlilə' : 'Grow'}</div>
                <h3 className="mt-3 text-lg font-bold text-slate-900">
                  {isAz ? 'Tapşırıqları bitirin və bacarıqlarınızı artırın' : 'Complete tasks and grow your skills'}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {isAz
                    ? 'Həftəlik layihələri mentor rəyi ilə tamamlayın və təsdiqlənə bilən rəsmi sertifikat əldə edin.'
                    : 'Submit real deliverables, receive mentor reviews, and earn an authentic credential you can verify and share.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            FINAL CTA SECTION
            ===================================================================== */}
        <section className="landing-cta-section py-20 sm:py-24 bg-white">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <ScrollRevealTitle className="landing-section-title text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {isAz ? 'Növbəti fəsliniz bir fürsətlə başlayır.' : 'Your next chapter starts with one opportunity.'}
            </ScrollRevealTitle>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">
              {isAz
                ? 'Təcrübələri kəşf edin və karyeranıza doğru praktiki addım atın.'
                : 'Explore internships and take a practical step toward your career.'}
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/internships">
                <Button size="lg" className="h-12 bg-blue-600 hover:bg-blue-700 text-white px-8 font-medium gap-2 shadow-xs">
                  {isAz ? 'Təcrübələri Kəşf Et' : 'Explore Internships'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
