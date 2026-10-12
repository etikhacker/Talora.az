'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/i18n/language-context';
import { Internship } from '@/types/database';
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
  GraduationCap,
} from 'lucide-react';

export default function InternshipsPage() {
  const { language, t } = useLanguage();
  const isAz = language === 'az';

  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

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

  // Extract unique categories from data
  const categories = useMemo(() => {
    const set = new Set<string>();
    internships.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [internships]);

  const filteredInternships = useMemo(() => {
    return internships.filter((item) => {
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
        const matchDesc = item.short_description?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
        const matchCategory = item.category?.toLowerCase().includes(q);
        const matchSkills = item.skills?.some((s) => s.toLowerCase().includes(q));

        if (!matchTitle && !matchDesc && !matchCategory && !matchSkills) {
          return false;
        }
      }

      return true;
    });
  }, [internships, selectedCategory, selectedDifficulty, searchTerm]);

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
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-1 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="max-w-3xl mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAz ? 'Açıq Vakansiyalar' : 'Open Cohorts'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('internshipsTitle')}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
              {t('internshipsSubtitle')}
            </p>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs mb-8 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="internship-search"
                  placeholder={t('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:bg-white"
                />
              </div>

              {/* Difficulty Dropdown / Filter */}
              <div className="flex items-center gap-2">
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
            </div>

            {/* Categories Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 pb-1 scrollbar-none">
              <span className="text-xs font-medium text-slate-400 shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                {isAz ? 'Sahələr:' : 'Tracks:'}
              </span>
              <button
                id="cat-filter-all"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t('allCategories')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  id={`cat-filter-${cat}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-2xs'
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
                  <div className="h-5 bg-slate-100 rounded-md w-1/3"></div>
                  <div className="h-7 bg-slate-200 rounded-md w-3/4"></div>
                  <div className="h-16 bg-slate-100 rounded-md w-full"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-slate-100 rounded-md w-16"></div>
                    <div className="h-6 bg-slate-100 rounded-md w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredInternships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-2xs uppercase tracking-wider font-semibold">
                          {internship.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-2xs font-medium ${
                            internship.difficulty === 'beginner'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : internship.difficulty === 'intermediate'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          {getDifficultyLabel(internship.difficulty)}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-2xs flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {internship.duration_weeks} {t('durationWeeks')}
                        </Badge>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-2">
                        {internship.title}
                      </h3>

                      {/* Short Description */}
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
                        {internship.short_description}
                      </p>

                      {/* Skills */}
                      {internship.skills && internship.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {internship.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-2xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {internship.skills.length > 4 && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 text-2xs font-medium border border-slate-200">
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
                          <div className="flex items-center gap-1.5 text-2xs text-slate-400">
                            <Users className="w-3 h-3 shrink-0" />
                            <span>
                              {t('maxStudents')}: {internship.max_students}
                            </span>
                          </div>
                        )}
                      </div>

                      <Link href={`/internships/${internship.slug}`}>
                        <Button size="sm" className="w-full sm:w-auto gap-1.5 shadow-xs">
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
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-2xs">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <Briefcase className="w-8 h-8" />
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
                >
                  {t('clearFilters')}
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
