'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/lib/i18n/language-context';
import { getInternshipById, updateInternship } from '@/lib/internships/service';
import { internshipSchema, InternshipFormData } from '@/lib/validations/internship';
import { InternshipDifficulty, InternshipStatus, Internship } from '@/types/database';
import {
  ArrowLeft,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function AdminEditInternshipPage({ params }: Props) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const { language, t } = useLanguage();
  const isAz = language === 'az';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<Internship | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [difficulty, setDifficulty] = useState<InternshipDifficulty>('intermediate');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [skillsRaw, setSkillsRaw] = useState('');
  const [requirementsRaw, setRequirementsRaw] = useState('');
  const [responsibilitiesRaw, setResponsibilitiesRaw] = useState('');
  const [benefitsRaw, setBenefitsRaw] = useState('');
  const [maxStudents, setMaxStudents] = useState<string>('');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState<InternshipStatus>('draft');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const item = await getInternshipById(id);
        if (item) {
          setOriginal(item);
          setTitle(item.title);
          setSlug(item.slug);
          setCategory(item.category);
          setDurationWeeks(item.duration_weeks);
          setDifficulty(item.difficulty);
          setShortDescription(item.short_description);
          setDescription(item.description);
          setSkillsRaw(item.skills.join(', '));
          setRequirementsRaw(item.requirements.join('\n'));
          setResponsibilitiesRaw(item.responsibilities.join('\n'));
          setBenefitsRaw(item.benefits.join('\n'));
          setMaxStudents(item.max_students ? String(item.max_students) : '');
          setStatus(item.status);

          if (item.application_deadline) {
            setApplicationDeadline(item.application_deadline.slice(0, 10));
          }
          if (item.start_date) {
            setStartDate(item.start_date.slice(0, 10));
          }
        }
      } catch (err) {
        console.error('Failed to load internship:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

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
      category,
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
      const res = await updateInternship(id, validation.data);
      if (!res.success) {
        setErrorMessage(res.error || t('generalError'));
        setSubmitting(false);
        return;
      }

      if (res.notificationWarning) {
        window.alert(isAz
          ? `Proqram yeniləndi, amma e-poçt bildirişi göndərilmədi: ${res.notificationWarning}`
          : `The program was updated, but its email notification failed: ${res.notificationWarning}`);
      }
      router.push('/admin/internships');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('generalError');
      setErrorMessage(msg);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!original) {
    return (
      <div className="p-8 text-center text-white">
        <p>{isAz ? 'Təcrübə proqramı tapılmadı' : 'Internship not found'}</p>
        <Link href="/admin/internships">
          <Button variant="outline" size="sm" className="mt-4">
            {isAz ? 'Geri qayıt' : 'Go back'}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/admin/internships">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <PageHeading embedded title={<>
              {isAz ? 'Təcrübə Proqramını Redaktə Et' : 'Edit Internship'}
            </>} description={<>
              ID: {id}
            </>} />
          </div>
        </div>

        <Link href={`/internships/${original.slug}`} target="_blank">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
            <ExternalLink className="w-3.5 h-3.5" />
            {isAz ? 'Saytda bax' : 'Preview'}
          </Button>
        </Link>
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-amber-400"
            />
            {fieldErrors.title && <p className="text-xs text-rose-400 mt-1">{fieldErrors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Slug (URL linki) <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">/internships/</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white font-mono text-xs focus:border-amber-400"
              />
            </div>
            {fieldErrors.slug && <p className="text-xs text-rose-400 mt-1">{fieldErrors.slug}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isAz ? 'İstiqamət / Kateqoriya' : 'Category / Track'}
              </label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs"
              />
              {fieldErrors.category && <p className="text-xs text-rose-400 mt-1">{fieldErrors.category}</p>}
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
              {isAz ? 'Qısa Təsvir' : 'Short Description'} <span className="text-rose-400">*</span>
            </label>
            <Textarea
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white text-xs"
            />
            {fieldErrors.short_description && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.short_description}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isAz ? 'Geniş Təsvir' : 'Full Description'} <span className="text-rose-400">*</span>
            </label>
            <Textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white text-xs"
            />
            {fieldErrors.description && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.description}</p>
            )}
          </div>
        </div>

        {/* Requirements & Skills */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">
            {isAz ? '2. Bacarıqlar və Tələblər' : '2. Skills & Requirements'}
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isAz ? 'Tələb olunan bacarıqlar (vergüllə ayırın)' : 'Skills (comma-separated)'}
            </label>
            <Input
              value={skillsRaw}
              onChange={(e) => setSkillsRaw(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white text-xs"
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
              className="bg-slate-950 border-slate-800 text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isAz ? 'Vəzifə və Öhdəliklər (hər sətirdə bir öhdəlik)' : 'Responsibilities (one per line)'}
            </label>
            <Textarea
              rows={3}
              value={responsibilitiesRaw}
              onChange={(e) => setResponsibilitiesRaw(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isAz ? 'Üstünlüklər (hər sətirdə bir maddə)' : 'Benefits (one per line)'}
            </label>
            <Textarea
              rows={3}
              value={benefitsRaw}
              onChange={(e) => setBenefitsRaw(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white text-xs"
            />
          </div>
        </div>

        {/* Capacity, Dates & Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">
            {isAz ? '3. Qəbul Sayı, Tarixlər və Status' : '3. Capacity & Status'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isAz ? 'Maksimum Tələbə Sayı' : 'Max Students'}
              </label>
              <Input
                type="number"
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
                {isAz ? 'Başlama Tarixi' : 'Start Date'}
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
              {isAz ? 'Statusu Dəyiş' : 'Status'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['draft', 'published', 'closed', 'archived'] as InternshipStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium capitalize border transition-all ${
                    status === st
                      ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {st === 'draft'
                    ? (isAz ? 'Qaralama' : 'Draft')
                    : st === 'published'
                    ? (isAz ? 'Dərc edilib' : 'Published')
                    : st === 'closed'
                    ? (isAz ? 'Bağlanıb' : 'Closed')
                    : (isAz ? 'Arxiv' : 'Archived')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
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
                <span>{isAz ? 'Yenilənir...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isAz ? 'Dəyişiklikləri Saxla' : 'Save Changes'}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
