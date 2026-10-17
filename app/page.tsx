'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useLanguage } from '@/lib/i18n/language-context';
import type { Internship } from '@/types/database';
import { formatDate } from '@/lib/utils/date';
import {
  Search,
  MapPin,
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
  const router = useRouter();
  const { language } = useLanguage();
  const isAz = language === 'az';

  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchWorkType, setSearchWorkType] = useState('all');

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.set('search', searchKeyword.trim());
    if (searchLocation.trim()) params.set('location', searchLocation.trim());
    if (searchWorkType && searchWorkType !== 'all') params.set('type', searchWorkType);

    const queryString = params.toString();
    router.push(queryString ? `/internships?${queryString}` : '/internships');
  };

  return (
    <div className="talora-home flex min-h-screen flex-col bg-[#F8FAFC] text-[#101828]">
      <Navbar />

      <main className="flex-1">
        {/* =====================================================================
            HERO SECTION
            ===================================================================== */}
        <section className="border-b border-slate-200 bg-white py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-3">
                {isAz ? 'Beynəlxalq Təcrübə Platforması' : 'International Internship Platform'}
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                {isAz ? 'Növbəti fürsətiniz buradan başlayır.' : 'Your next opportunity starts here.'}
              </h1>
              <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
                {isAz
                  ? 'Təcrübə proqramlarını kəşf edin, real bacarıqlar qazanın və gələcəyinizə doğru ilk addımı atın.'
                  : 'Discover internships, build real-world skills, and take the first step toward your future.'}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/internships">
                  <Button size="lg" className="h-11 bg-blue-600 hover:bg-blue-700 text-white px-6 font-medium gap-2">
                    {isAz ? 'Təcrübələri Kəşf Et' : 'Explore Internships'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="outline" size="lg" className="h-11 border-slate-200 text-slate-800 hover:bg-slate-50 px-6 font-medium">
                    {isAz ? 'Necə İşləyir' : 'How It Works'}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Compact Search Interface */}
            <div className="mx-auto mt-12 max-w-4xl rounded-xl border border-slate-200 bg-white p-3 shadow-xs sm:p-4">
              <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder={isAz ? 'Vəzifə və ya açar söz...' : 'Role or keyword...'}
                    className="h-11 pl-9 border-slate-200 bg-white text-sm focus:border-blue-600 focus:ring-blue-600/20"
                  />
                </div>

                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder={isAz ? 'Şəhər və ya ölkə...' : 'Location (e.g. Remote, City)...'}
                    className="h-11 pl-9 border-slate-200 bg-white text-sm focus:border-blue-600 focus:ring-blue-600/20"
                  />
                </div>

                <div>
                  <Select
                    value={searchWorkType}
                    onChange={(e) => setSearchWorkType(e.target.value)}
                    className="h-11 border-slate-200 bg-white text-sm text-slate-800"
                  >
                    <option value="all">{isAz ? 'Bütün formatlar' : 'All Work Types'}</option>
                    <option value="remote">{isAz ? 'Distant (Remote)' : 'Remote'}</option>
                    <option value="hybrid">{isAz ? 'Hibrid' : 'Hybrid'}</option>
                    <option value="onsite">{isAz ? 'Ofisdə (On-site)' : 'On-site'}</option>
                  </Select>
                </div>

                <div>
                  <Button type="submit" className="h-11 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium gap-2">
                    <Search className="h-4 w-4" />
                    <span>{isAz ? 'Təcrübə Axtar' : 'Search Internships'}</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* =====================================================================
            OPPORTUNITY DISCOVERY SECTION
            ===================================================================== */}
        <section className="py-16 sm:py-20 border-b border-slate-200 bg-[#F8FAFC]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {isAz ? 'İstiqamətinizi tapın' : 'Find your path'}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600">
                {isAz
                  ? 'Maraqlarınıza və ambisiyalarınıza uyğun fürsətləri araşdırın.'
                  : 'Explore opportunities that match your interests and ambitions.'}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const linkHref = cat.query ? `/internships?search=${encodeURIComponent(cat.query)}` : '/internships';
                return (
                  <Link
                    key={cat.id}
                    href={linkHref}
                    className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-xs"
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
        <section className="py-16 sm:py-20 border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {isAz ? 'Təcrübə imkanlarını kəşf edin' : 'Explore internship opportunities'}
                </h2>
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
                    className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-xs"
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
        <section id="how-it-works" className="py-16 sm:py-20 border-b border-slate-200 bg-[#F8FAFC]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
                {isAz ? 'Platformanın iş prinsipi' : 'Workflow & Methodology'}
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {isAz ? 'Üç sadə addımla karyeranızı başladın' : 'How Talora works'}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600">
                {isAz
                  ? 'Nəzəriyyəni real təcrübəyə və yoxlanıla bilən nəticələrə çeviririk.'
                  : 'We bridge academic fundamentals with practical workplace output and verified credentials.'}
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Step 1 */}
              <div className="rounded-xl border border-slate-200 bg-white p-7">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">01 / Step</div>
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
              <div className="rounded-xl border border-slate-200 bg-white p-7">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">02 / Step</div>
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
              <div className="rounded-xl border border-slate-200 bg-white p-7">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">03 / Step</div>
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
        <section className="py-20 sm:py-24 bg-white">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {isAz ? 'Növbəti fəsliniz bir fürsətlə başlayır.' : 'Your next chapter starts with one opportunity.'}
            </h2>
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
