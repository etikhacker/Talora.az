'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { getInternshipBySlug } from '@/lib/internships/service';
import { submitApplication, getStudentApplications } from '@/lib/applications/service';
import { applicationSchema, ApplicationFormData } from '@/lib/validations/application';
import { Internship } from '@/types/database';
import {
  Briefcase,
  User,
  Mail,
  School,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Globe,
  Github,
  Linkedin,
  Clock,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function ApplyInternshipPage({ params }: Props) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();

  const { user, profile, isLoading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const { language, t } = useLanguage();
  const isAz = language === 'az';

  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // Form fields
  const [motivation, setMotivation] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const item = await getInternshipBySlug(slug);
        if (!isMounted) return;
        setInternship(item);
        setCurrentTimestamp(Date.now());

        if (profile?.id && profile.role === 'student' && item) {
          const apps = await getStudentApplications(profile.id);
          if (!isMounted) return;
          const existing = apps.find(
            (a) => a.internship_id === item.id && (a.status === 'pending' || a.status === 'accepted')
          );
          if (existing) {
            setAlreadyApplied(true);
          }
        }
      } catch (err) {
        console.error('Failed to load application data:', err);
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
  }, [slug, profile]);

  // Auth gate
  if (!authLoading && !isAuthenticated) {
    router.replace(`/login?redirect=/internships/${slug}/apply`);
    return null;
  }

  if (loading || authLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <main id="main-content" className="flex-1 py-16 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <main id="main-content" className="flex-1 py-16 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {isAz ? 'Təcrübə proqramı tapılmadı' : 'Internship Not Found'}
          </h2>
          <Link href="/internships">
            <Button variant="outline" size="sm" className="mt-4">
              {t('backToInternships')}
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Admin notification
  if (profile?.role === 'admin') {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <main id="main-content" className="flex-1 py-16">
          <div className="max-w-xl mx-auto px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-200">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <PageHeading embedded title={<>
              {isAz ? 'İnzibatçı Rejimi' : 'Administrator Mode'}
            </>} description={<>
              {isAz
                ? 'İnzibatçı hesabları tələbə kimi təcrübə proqramlarına müraciət edə bilməz. Müraciətləri idarə etmək üçün admin panelinə keçid edin.'
                : 'Administrator accounts cannot submit student applications. Please visit the admin console to review applicants.'}
            </>} />
            <div className="flex items-center justify-center gap-3">
              <Link href={`/internships/${slug}`}>
                <Button variant="outline" size="sm">
                  {isAz ? 'Proqrama bax' : 'View Program'}
                </Button>
              </Link>
              <Link href="/admin">
                <Button size="sm" className="gap-2">
                  {isAz ? 'Admin Paneli' : 'Admin Console'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isDeadlinePassed =
    internship.application_deadline && currentTimestamp
      ? new Date(internship.application_deadline).getTime() < currentTimestamp
      : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setErrorMessage(null);
    setFieldErrors({});

    const formData: ApplicationFormData = {
      motivation,
      portfolio_url: portfolioUrl || undefined,
      github_url: githubUrl || undefined,
      linkedin_url: linkedinUrl || undefined,
    };

    const validation = applicationSchema.safeParse(formData);
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
      const res = await submitApplication({
        internshipId: internship.id,
        studentProfile: profile,
        data: validation.data,
      });

      if (!res.success) {
        setErrorMessage(res.error || t('generalError'));
        setSubmitting(false);
        return;
      }

      setSuccessMessage(true);
      setTimeout(() => {
        router.push('/dashboard/applications');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('generalError');
      setErrorMessage(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main id="main-content" className="flex-1 public-main">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href={`/internships/${slug}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {isAz ? 'Proqramın təfərrüatlarına qayıt' : 'Back to program details'}
          </Link>

          {/* Form Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-2xs font-semibold uppercase">
                {internship.category}
              </Badge>
              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-2xs">
                {internship.duration_weeks} {t('durationWeeks')}
              </Badge>
            </div>
            <PageHeading embedded title={<>
              {internship.title}
            </>} description={<>
              {t('applySubtitle')}
            </>} />
          </div>

          {/* Already Applied Notice */}
          {alreadyApplied && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-amber-900">
                {t('alreadyApplied')}
              </h3>
              <p className="text-xs sm:text-sm text-amber-700 max-w-md mx-auto">
                {isAz
                  ? 'Siz bu təcrübə proqramına artıq müraciət etmisiniz. Müraciətinizin statusunu şəxsi kabinetinizdə yoxlaya bilərsiniz.'
                  : 'You have already submitted an active application for this program. You can monitor review decisions in your dashboard.'}
              </p>
              <Link href="/dashboard/applications">
                <Button size="sm" className="gap-2 mt-2">
                  {t('myApplicationsTitle')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}

          {/* Deadline Passed Notice */}
          {isDeadlinePassed && !alreadyApplied && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 mb-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-rose-900">
                {t('deadlinePassed')}
              </h3>
              <p className="text-xs sm:text-sm text-rose-700 max-w-md mx-auto">
                {isAz
                  ? 'Bu təcrübə proqramı üçün müraciət müddəti başa çatmışdır.'
                  : 'The application period for this internship program has ended.'}
              </p>
              <Link href="/internships">
                <Button variant="outline" size="sm" className="mt-2">
                  {t('backToInternships')}
                </Button>
              </Link>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-emerald-900">
                {t('applicationSuccess')}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-700 max-w-md mx-auto">
                {t('applicationSuccessDesc')}
              </p>
            </div>
          )}

          {/* Application Form */}
          {!alreadyApplied && !isDeadlinePassed && !successMessage && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Info Card (Auto-filled) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  {t('studentInfo')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block mb-0.5">{isAz ? 'Ad və Soyad' : 'Full Name'}</span>
                    <span className="font-semibold text-slate-800 text-sm">{profile?.full_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">{isAz ? 'E-poçt' : 'Email'}</span>
                    <span className="font-semibold text-slate-800 text-sm">{profile?.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">{isAz ? 'Universitet' : 'University'}</span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {profile?.university || (isAz ? 'Qeyd olunmayıb' : 'Not set')}
                    </span>
                  </div>
                </div>
                <div role="note" className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p className="leading-relaxed">{t('emailSpamFolderNotice')}</p>
                </div>
              </div>

              {/* Motivation */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div>
                  <label htmlFor="app-motivation" className="block text-sm font-bold text-slate-900 mb-1">
                    {t('motivationLabel')} <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    {isAz
                      ? 'Niyə məhz bu proqrama müraciət etdiyinizi və öyrənmək istədiyiniz texnologiyaları qeyd edin (minimum 50 simvol).'
                      : 'Share your background, enthusiasm and goals for this internship (minimum 50 characters).'}
                  </p>
                  <Textarea
                    id="app-motivation"
                    rows={6}
                    placeholder={t('motivationPlaceholder')}
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    className={`w-full ${fieldErrors.motivation ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`}
                  />
                  <div className="flex justify-between items-center mt-1.5 text-xs text-slate-400">
                    {fieldErrors.motivation ? (
                      <span className="text-rose-600 font-medium">{fieldErrors.motivation}</span>
                    ) : (
                      <span></span>
                    )}
                    <span>{motivation.length} / 3000</span>
                  </div>
                </div>

              </div>

              {/* External Links */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                  {isAz ? 'Peşəkar Profillər və Portfel' : 'Professional Links & Portfolio'}
                </h3>

                {/* Portfolio */}
                <div>
                  <label htmlFor="app-portfolio" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    {t('portfolioLabel')}
                  </label>
                  <Input
                    id="app-portfolio"
                    type="url"
                    placeholder="https://myportfolio.az"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className={fieldErrors.portfolio_url ? 'border-rose-400' : ''}
                  />
                  {fieldErrors.portfolio_url && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.portfolio_url}</p>
                  )}
                </div>

                {/* GitHub */}
                <div>
                  <label htmlFor="app-github" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-slate-400" />
                    {t('githubLabel')}
                  </label>
                  <Input
                    id="app-github"
                    type="url"
                    placeholder="https://github.com/username"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className={fieldErrors.github_url ? 'border-rose-400' : ''}
                  />
                  {fieldErrors.github_url && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.github_url}</p>
                  )}
                </div>

                {/* LinkedIn */}
                <div>
                  <label htmlFor="app-linkedin" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5 text-slate-400" />
                    {t('linkedinLabel')}
                  </label>
                  <Input
                    id="app-linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className={fieldErrors.linkedin_url ? 'border-rose-400' : ''}
                  />
                  {fieldErrors.linkedin_url && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.linkedin_url}</p>
                  )}
                </div>
              </div>

              {/* Error Box */}
              {errorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <Link href={`/internships/${slug}`} className="w-full sm:w-auto">
                  <Button type="button" variant="outline" className="w-full sm:w-auto">
                    {isAz ? 'İmtina et' : 'Cancel'}
                  </Button>
                </Link>
                <Button
                  id="submit-application-btn"
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('submitting')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('submitApplication')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
