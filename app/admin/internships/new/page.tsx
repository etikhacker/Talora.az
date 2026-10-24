'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { createInternship } from '@/lib/internships/service';
import { internshipSchema, InternshipFormData } from '@/lib/validations/internship';
import { InternshipDifficulty, InternshipStatus } from '@/types/database';
import {
  ArrowLeft,
  Check,
  Plus,
  AlertCircle,
  Briefcase,
  Layers,
  Sparkles,
} from 'lucide-react';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export default function AdminNewInternshipPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const isAz = language === 'az';

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);
  const [category, setCategory] = useState('Proqramlaşdırma və Veb');
  const [customCategory, setCustomCategory] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [difficulty, setDifficulty] = useState<InternshipDifficulty>('intermediate');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [skillsRaw, setSkillsRaw] = useState('React, TypeScript, Next.js, Git');
  const [requirementsRaw, setRequirementsRaw] = useState(
    'HTML/CSS və JavaScript bilikləri\nGit və GitHub ilə işləmə bacarığı\nHəftədə ən azı 15 saat vaxt ayıra bilmək'
  );
  const [responsibilitiesRaw, setResponsibilitiesRaw] = useState(
    'Real layihələr üzərində komponentlərin hazırlanması\nKomanda icmallarında və sprintlərdə iştirak\nMentor rəylərinin koda tətbiqi'
  );
  const [benefitsRaw, setBenefitsRaw] = useState(
    'Rəsmi dövlət standartlı sertifikat\nReal iş təcrübəsi və güclü portfel\nTərəfdaş şirkətlərdə junior vakansiyalara tövsiyə'
  );
  const [maxStudents, setMaxStudents] = useState<string>('15');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState<InternshipStatus>('draft');

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const selectedCategory = category === 'custom' ? customCategory.trim() : category;

    const parsedSkills = skillsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedReqs = requirementsRaw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedResps = responsibilitiesRaw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedBenefits = benefitsRaw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const rawFormData: InternshipFormData = {
      title,
      slug,
      short_description: shortDescription,
      description,
      category: selectedCategory,
      duration_weeks: Number(durationWeeks),
      difficulty,
      skills: parsedSkills,
      requirements: parsedReqs,
      responsibilities: parsedResps,
      benefits: parsedBenefits,
      max_students: maxStudents ? Number(maxStudents) : null,
      status,
      application_deadline: applicationDeadline ? new Date(applicationDeadline).toISOString() : null,
      start_date: startDate ? new Date(startDate).toISOString() : null,
    };

    const validation = internshipSchema.safeParse(rawFormData);
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          errMap[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(errMap);
      return;
    }

    setSubmitting(true);
    try {
      const res = await createInternship(validation.data, user?.id);
      if (!res.success) {
        setErrorMessage(res.error || t('generalError'));
        setSubmitting(false);
        return;
      }

      if (res.notificationWarning) {
        window.alert(isAz
          ? `Proqram yaradıldı, amma e-poçt bildirişi göndərilmədi: ${res.notificationWarning}`
          : `The program was created, but its email notification failed: ${res.notificationWarning}`);
      }
      router.push('/admin/internships');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('generalError');
      setErrorMessage(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Link href="/admin/internships">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <PageHeading embedded title={<>
            {isAz ? 'Yeni Təcrübə Proqramı Yarat' : 'Create New Internship'}
          </>} description={<>
            {isAz ? 'Proqramın parametrlərini və tələblərini müəyyən edin' : 'Define program parameters, track and requirements'}
          </>} />
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">
            {isAz ? '1. Əsas Məlumatlar' : '1. Basic Information'}
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isAz ? 'Proqramın Başlığı' : 'Program Title'} <span className="text-rose-400">*</span>
            </label>
            <Input
              placeholder="məs: Frontend Development (React & Next.js)"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-amber-400"
            />
            {fieldErrors.title && <p className="text-xs text-rose-400 mt-1">{fieldErrors.title}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Slug (URL linki) <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setAutoSlug(!autoSlug)}
                className="text-2xs text-amber-400 hover:underline"
              >
                {autoSlug ? (isAz ? 'Əllə daxil et' : 'Manual edit') : (isAz ? 'Avtomatik yarat' : 'Auto generate')}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">/internships/</span>
              <Input
                placeholder="frontend-development"
                value={slug}
                readOnly={autoSlug}
                onChange={(e) => setSlug(e.target.value)}
                className={`bg-slate-950 border-slate-800 text-white placeholder-slate-600 font-mono text-xs ${
                  autoSlug ? 'opacity-80' : 'focus:border-amber-400'
                }`}
              />
            </div>
            {fieldErrors.slug && <p className="text-xs text-rose-400 mt-1">{fieldErrors.slug}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isAz ? 'İstiqamət / Kateqoriya' : 'Category / Track'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Data">Data</option>
                <option value="AI">AI</option>
                <option value="Automation">Automation</option>
                <option value="Proqramlaşdırma və Veb">Proqramlaşdırma və Veb</option>
                <option value="Məlumat Analitikası">Məlumat Analitikası</option>
                <option value="Məhsul İdarəetməsi">Məhsul İdarəetməsi</option>
                <option value="Kibertəhlükəsizlik">Kibertəhlükəsizlik</option>
                <option value="UI/UX Dizayn">UI/UX Dizayn</option>
                <option value="Rəqəmsal Marketinq">Rəqəmsal Marketinq</option>
                <option value="custom">{isAz ? 'Fərqli qeyd et...' : 'Custom...'}</option>
              </select>
              {category === 'custom' && (
                <Input
                  placeholder={isAz ? 'Kateqoriyanı yazın' : 'Enter category'}
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2 bg-slate-950 border-slate-800 text-white text-xs"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isAz ? 'Müddət (həftə)' : 'Duration (weeks)'}
              </label>
              <Input
                type="number"
                min="1"
                max="8"
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(Number(e.target.value))}
                className="bg-slate-950 border-slate-800 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isAz ? 'Çətinlik Səviyyəsi' : 'Difficulty'}
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as InternshipDifficulty)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="beginner">{isAz ? 'Başlanğıc (Beginner)' : 'Beginner'}</option>
                <option value="intermediate">{isAz ? 'Orta (Intermediate)' : 'Intermediate'}</option>
                <option value="advanced">{isAz ? 'İrəli (Advanced)' : 'Advanced'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isAz ? 'Qısa Təsvir (kartlarda əks olunur)' : 'Short Description'} <span className="text-rose-400">*</span>
            </label>
            <Textarea
              rows={2}
              placeholder={isAz ? 'Məs: React 19, Next.js və Tailwind CSS ilə genişmiqyaslı tətbiqlər...' : 'Brief summary for cards...'}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white text-xs placeholder-slate-600"
            />
            {fieldErrors.short_description && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.short_description}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isAz ? 'Geniş Təsvir və İcmal' : 'Detailed Program Description'} <span className="text-rose-400">*</span>
            </label>
            <Textarea
              rows={5}
              placeholder={isAz ? 'Təcrübə proqramının tam təfərrüatları, hədəfləri və metodologiyası...' : 'Full curriculum context and roadmap...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white text-xs placeholder-slate-600"
            />
            {fieldErrors.description && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.description}</p>
            )}
          </div>
        </div>

        {/* Technical Requirements & Lists */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">
            {isAz ? '2. Bacarıqlar və Tələblər' : '2. Skills & Curriculum'}
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isAz ? 'Tələb olunan bacarıqlar (vergüllə ayırın)' : 'Skills (comma-separated)'}
            </label>
            <Input
              placeholder="React, Next.js, TypeScript, Git"
              value={skillsRaw}
              onChange={(e) => setSkillsRaw(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white text-xs placeholder-slate-600"
            />
            {fieldErrors.skills && <p className="text-xs text-rose-400 mt-1">{fieldErrors.skills}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isAz ? 'Qəbul Tələbləri (hər sətirdə bir tələb)' : 'Requirements (one per line)'}
            </label>
            <Textarea
              rows={3}
              value={requirementsRaw}
              onChange={(e) => setRequirementsRaw(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white text-xs placeholder-slate-600"
            />
            {fieldErrors.requirements && <p className="text-xs text-rose-400 mt-1">{fieldErrors.requirements}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isAz ? 'Vəzifə və Öhdəliklər (hər sətirdə bir öhdəlik)' : 'Responsibilities (one per line)'}
            </label>
            <Textarea
              rows={3}
              value={responsibilitiesRaw}
              onChange={(e) => setResponsibilitiesRaw(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white text-xs placeholder-slate-600"
            />
            {fieldErrors.responsibilities && <p className="text-xs text-rose-400 mt-1">{fieldErrors.responsibilities}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isAz ? 'Üstünlüklər və İmkanlar (hər sətirdə bir maddə)' : 'Benefits (one per line)'}
            </label>
            <Textarea
              rows={3}
              value={benefitsRaw}
              onChange={(e) => setBenefitsRaw(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white text-xs placeholder-slate-600"
            />
            {fieldErrors.benefits && <p className="text-xs text-rose-400 mt-1">{fieldErrors.benefits}</p>}
          </div>
        </div>

        {/* Capacity, Dates & Publishing Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">
            {isAz ? '3. Qəbul Sayı, Tarixlər və Status' : '3. Capacity & Publication'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isAz ? 'Maksimum Tələbə Sayı' : 'Max Cohort Capacity'}
              </label>
              <Input
                type="number"
                placeholder={isAz ? 'məs: 15 (boşsa limitsiz)' : 'e.g. 15'}
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isAz ? 'Son Müraciət Tarixi' : 'Application Deadline'}
              </label>
              <Input
                type="date"
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isAz ? 'Proqramın Başlama Tarixi' : 'Cohort Start Date'}
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {isAz ? 'İlkin Status' : 'Initial Status'}
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={status === 'draft'}
                  onChange={() => setStatus('draft')}
                  className="accent-amber-400"
                />
                <span>{isAz ? 'Qaralama (Saytda görünməyəcək)' : 'Draft (Private)'}</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={status === 'published'}
                  onChange={() => setStatus('published')}
                  className="accent-amber-400"
                />
                <span>{isAz ? 'Dərc et (Saytda dərhal görünəcək)' : 'Publish (Visible on site)'}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/admin/internships">
            <Button type="button" variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white">
              {isAz ? 'İmtina et' : 'Cancel'}
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold gap-2 shadow-xs"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>{isAz ? 'Yaradılır...' : 'Creating...'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isAz ? 'Təcrübə Proqramını Yarat' : 'Create Internship'}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
