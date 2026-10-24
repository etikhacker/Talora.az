'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/i18n/language-context';
import { getPublishedInternships } from '@/lib/internships/service';
import { Internship } from '@/types/database';
import { Briefcase, Search, Clock, ArrowRight, Sparkles } from 'lucide-react';

export default function StudentInternshipsPage() {
  const { language, t } = useLanguage();
  const isAz = language === 'az';

  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getPublishedInternships();
        setInternships(data);
      } catch (err) {
        console.error('Failed to load internships:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = internships.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.skills.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <PageHeading embedded title={<>
            {t('internshipsTitle')}
          </>} description={<>
            {t('internshipsSubtitle')}
          </>} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((internship) => (
            <div
              key={internship.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 text-2xs uppercase">
                    {internship.category}
                  </Badge>
                  <Badge variant="outline" className="text-2xs font-medium">
                    <Clock className="w-3 h-3 text-slate-400 mr-1" />
                    {internship.duration_weeks} {t('durationWeeks')}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5">
                  {internship.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {internship.short_description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xs text-slate-400">
                  {internship.skills.slice(0, 3).join(' • ')}
                </span>
                <Link href={`/internships/${internship.slug}`}>
                  <Button size="sm" className="gap-1.5 h-8 text-xs">
                    <span>{t('viewDetails')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {t('emptyInternships')}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {isAz
                ? 'Yeni təcrübə qrupları yaxın günlərdə elan olunacaq.'
                : 'Upcoming internship cohorts will be announced shortly.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
