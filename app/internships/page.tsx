'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageHeading } from '@/components/layout/page-heading';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useLanguage } from '@/lib/i18n/language-context';
import type { Internship } from '@/types/database';
import { formatDate as formatDisplayDate } from '@/lib/utils/date';
import {
  Briefcase,
  Search,
  Filter,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Users,
  RotateCcw,
} from 'lucide-react';

function InternshipsContent({
  initialSearch,
  initialCategory,
}: {
  initialSearch: string;
  initialCategory: string;
}) {

  const { language, t } = useLanguage();
  const isAz = language === 'az';

  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const response = await fetch('/api/internships/public', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load internships (${response.status})`);
        }
        const data = (await response.json()) as Internship[];
        if (isMounted) {
          setInternships(data);
          setCurrentTimestamp(Date.now());
        }
      } catch (err) {
        console.error('Failed to load internships:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Extract unique categories from actual data
  const categories = useMemo(() => {
    const set = new Set<string>();
    internships.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [internships]);

  const filteredInternships = useMemo(() => {
    return internships
      .filter((item) => {
        // Category filter
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }

        // Difficulty filter
        if (selectedDifficulty !== 'all' && item.difficulty !== selectedDifficulty) {
          return false;
        }

        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc =
            item.short_description?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q);
          const matchCategory = item.category?.toLowerCase().includes(q);
          const matchSkills = item.skills?.some((s) => s.toLowerCase().includes(q));

          if (!matchTitle && !matchDesc && !matchCategory && !matchSkills) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'duration') {
          return (a.duration_weeks || 0) - (b.duration_weeks || 0);
        }
        if (sortBy === 'deadline') {
          if (!a.application_deadline) return 1;
          if (!b.application_deadline) return -1;
          return new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime();
        }
        // Default: newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [internships, selectedCategory, selectedDifficulty, searchTerm, sortBy]);

  const getDifficultyLabel = (diff: string) => {
    if (diff === 'beginner') return t('difficultyBeginner');
    if (diff === 'intermediate') return t('difficultyIntermediate');
    if (diff === 'advanced') return t('difficultyAdvanced');
    return diff;
  };

  const formatDeadline = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return formatDisplayDate(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--page)]">
      <Navbar />

      <main id="main-content" className="flex-1 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeading eyebrow={isAz ? 'İSTİQAMƏTİNİ TAP' : 'FIND YOUR DIRECTION'} title={isAz ? 'Növbəti addımını seç.' : 'Choose your next step.'} description={isAz ? 'Real tapşırıqlar üzərində çalışacağın proqramı tap. İstiqamət, səviyyə və müddətə görə öz yolunu seç.' : 'Find a program built around real assignments. Choose your path by track, level and duration.'} />

          {/* Search, Filter and Sort Controls */}
          <div className="catalogue-filter space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search input */}
              <div className="relative md:col-span-6">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="internship-search"
                  placeholder={isAz ? 'Vəzifə, texnologiya və ya açar söz...' : 'Search by role, track, or keywords...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white text-sm"
                />
              </div>

              {/* Difficulty selector (Using themed Select component) */}
              <div className="md:col-span-3">
                <Select
                  id="difficulty-filter"
                  aria-label={t('allDifficulties')}
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="h-11 text-xs sm:text-sm"
                >
                  <option value="all">{t('allDifficulties')}</option>
                  <option value="beginner">{t('difficultyBeginner')}</option>
                  <option value="intermediate">{t('difficultyIntermediate')}</option>
                  <option value="advanced">{t('difficultyAdvanced')}</option>
                </Select>
              </div>

              {/* Sort selector (Using themed Select component) */}
              <div className="md:col-span-3">
                <Select
                  id="sort-filter"
                  aria-label="Sort internships"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-11 text-xs sm:text-sm"
                >
                  <option value="newest">{isAz ? 'Ən yeni əlavə olunanlar' : 'Sort: Newest'}</option>
                  <option value="deadline">{isAz ? 'Yaxınlaşan son müraciət' : 'Sort: Deadline'}</option>
                  <option value="duration">{isAz ? 'Müddətə görə' : 'Sort: Duration'}</option>
                </Select>
              </div>
            </div>

            {/* Category Segmented Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-slate-100 pb-1 scrollbar-none">
              <span className="text-xs font-semibold text-slate-500 shrink-0 flex items-center gap-1.5 pr-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                {isAz ? 'İstiqamətlər:' : 'Categories:'}
              </span>
              <button
                id="cat-filter-all"
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t('allCategories')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  id={`cat-filter-${cat}`}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Internships Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                  <div className="h-6 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-12 bg-slate-100 rounded w-full"></div>
                  <div className="h-8 bg-slate-100 rounded w-24"></div>
                </div>
              ))}
            </div>
          ) : filteredInternships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredInternships.map((internship) => {
                const deadlineFormatted = formatDeadline(internship.application_deadline);
                const isDeadlinePassed =
                  internship.application_deadline && currentTimestamp
                    ? new Date(internship.application_deadline).getTime() < currentTimestamp
                    : false;

                return (
                  <div
                    key={internship.id}
                    id={`internship-card-${internship.slug}`}
                    className="catalogue-card bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Zero-pill metadata row */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium mb-2.5">
                        <span className="text-blue-600 font-semibold">{internship.category || 'General Track'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{getDifficultyLabel(internship.difficulty)}</span>
                        {internship.duration_weeks ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {internship.duration_weeks} {t('durationWeeks')}
                            </span>
                          </>
                        ) : null}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                        {internship.title}
                      </h3>

                      {/* Short Description */}
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
                        {internship.short_description || internship.description}
                      </p>

                      {/* Skills clean unboxed list */}
                      {internship.skills && internship.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {internship.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {internship.skills.length > 4 && (
                            <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-400 text-xs font-medium border border-slate-200">
                              +{internship.skills.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Info & CTA */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        {deadlineFormatted && (
                          <div className={`flex items-center gap-1.5 text-xs ${isDeadlinePassed ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {isDeadlinePassed ? t('deadlinePassed') : `${t('applicationDeadline')}: ${deadlineFormatted}`}
                            </span>
                          </div>
                        )}
                        {internship.max_students && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Users className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span>
                              {t('maxStudents')}: {internship.max_students}
                            </span>
                          </div>
                        )}
                      </div>

                      <Link href={`/internships/${internship.slug}`}>
                        <Button size="sm" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs font-medium">
                          <span>{t('viewDetails')}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-xs">
              <div className="w-14 h-14 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <Briefcase className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {searchTerm || selectedCategory !== 'all' || selectedDifficulty !== 'all'
                  ? (isAz ? 'Axtarışa uyğun təcrübə tapılmadı.' : 'No internships match your filter criteria.')
                  : t('emptyInternships')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
                {searchTerm || selectedCategory !== 'all' || selectedDifficulty !== 'all'
                  ? (isAz ? 'Axtarış sözünü dəyişməyə və ya filterləri sıfırlamağa cəhd edin.' : 'Try adjusting your search keywords or resetting the active filters.')
                  : (isAz ? 'Tezliklə yeni təcrübə proqramları əlavə ediləcəkdir.' : 'New internship programs will be opened shortly.')}
              </p>
              {(searchTerm || selectedCategory !== 'all' || selectedDifficulty !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedDifficulty('all');
                  }}
                  className="gap-1.5 border-slate-200 text-slate-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('clearFilters')}</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function InternshipsPageContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'all';

  // Remount the stateful listing when URL filters change. This keeps the URL
  // as the source of truth without synchronously setting state inside an effect.
  return (
    <InternshipsContent
      key={JSON.stringify([initialSearch, initialCategory])}
      initialSearch={initialSearch}
      initialCategory={initialCategory}
    />
  );
}

export default function InternshipsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--page)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <InternshipsPageContent />
    </Suspense>
  );
}
