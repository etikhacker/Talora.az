'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { getInternshipBySlug } from '@/lib/internships/service';
import { getStudentApplications } from '@/lib/applications/service';
import { getStudentEnrollments } from '@/lib/enrollments/service';
import { Internship, Application, Enrollment } from '@/types/database';
import { formatDate as formatDisplayDate } from '@/lib/utils/date';
import {
  Briefcase,
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  Award,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function InternshipDetailsPage({ params }: Props) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();

  const { user, profile } = useAuth();
  const isAuthenticated = !!user;
  const { language, t } = useLanguage();
  const isAz = language === 'az';

  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null);
  const [studentApp, setStudentApp] = useState<Application | null>(null);
  const [studentEnrollment, setStudentEnrollment] = useState<Enrollment | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const found = await getInternshipBySlug(slug);
        if (!isMounted) return;
        setInternship(found);
        setCurrentTimestamp(Date.now());

        // If authenticated student, check their application and enrollment status
        if (profile?.id && profile.role === 'student' && found) {
          const [apps, enrolls] = await Promise.all([
            getStudentApplications(profile.id),
            getStudentEnrollments(profile.id),
          ]);

          if (!isMounted) return;
          const matchApp = apps.find(
            (a) => a.internship_id === found.id && (a.status === 'pending' || a.status === 'accepted')
          );
          if (matchApp) setStudentApp(matchApp);

          const matchEnroll = enrolls.find(
            (e) => e.internship_id === found.id && e.status === 'active'
          );
          if (matchEnroll) setStudentEnrollment(matchEnroll);
        }
      } catch (err) {
        console.error('Failed to load internship details:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [slug, profile]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <main id="main-content" className="flex-1 py-16 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <main id="main-content" className="flex-1 py-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertCircle className="w-8 h-8" />
            </div>
            <PageHeading embedded title={<>
              {isAz ? 'Təcrübə proqramı tapılmadı' : 'Internship Not Found'}
            </>} description={<>
              {isAz
                ? 'Axtardığınız təcrübə proqramı mövcud deyil və ya dərc olunmayıb.'
                : 'The internship program you are looking for does not exist or has been unpublished.'}
            </>} />
            <Link href="/internships">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t('backToInternships')}
              </Button>
            </Link>
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

  const isClosed = internship.status === 'closed' || internship.status === 'archived';

  const formatCustomDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return formatDisplayDate(d);
    } catch {
      return dateStr;
    }
  };

  const getDifficultyLabel = (diff: string) => {
    if (diff === 'beginner') return t('difficultyBeginner');
    if (diff === 'intermediate') return t('difficultyIntermediate');
    if (diff === 'advanced') return t('difficultyAdvanced');
    return diff;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main id="main-content" className="flex-1 public-main">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-6">
            <Link href="/internships" className="hover:text-blue-600 transition-colors">
              {t('navInternships')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">{internship.category}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-medium truncate max-w-xs">{internship.title}</span>
          </nav>

          {/* Program Header Box */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs mb-8">
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs uppercase font-semibold">
                {internship.category}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs font-medium ${
                  internship.difficulty === 'beginner'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : internship.difficulty === 'intermediate'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}
              >
                {getDifficultyLabel(internship.difficulty)}
              </Badge>
              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-xs flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {internship.duration_weeks} {t('durationWeeks')}
              </Badge>
            </div>

            <PageHeading embedded title={<>
              {internship.title}
            </>} description={<>
              {internship.short_description}
            </>} />

            {/* Quick Spec Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-100">
              <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                <span className="text-2xs text-slate-400 block mb-1 uppercase font-semibold">{t('durationWeeks')}</span>
                <span className="text-sm font-bold text-slate-900">{internship.duration_weeks} {t('durationWeeks')}</span>
              </div>
              <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                <span className="text-2xs text-slate-400 block mb-1 uppercase font-semibold">{t('maxStudents')}</span>
                <span className="text-sm font-bold text-slate-900">
                  {internship.max_students ? `${internship.max_students} ${isAz ? 'tələbə' : 'spots'}` : (isAz ? 'Məhdudiyyətsiz' : 'Open')}
                </span>
              </div>
              <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                <span className="text-2xs text-slate-400 block mb-1 uppercase font-semibold">{t('applicationDeadline')}</span>
                <span className={`text-sm font-bold ${isDeadlinePassed ? 'text-rose-600' : 'text-slate-900'}`}>
                  {formatCustomDate(internship.application_deadline) || (isAz ? 'Açıq' : 'Rolling')}
                </span>
              </div>
              <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                <span className="text-2xs text-slate-400 block mb-1 uppercase font-semibold">{t('startDate')}</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatCustomDate(internship.start_date) || (isAz ? 'Qəbuldan sonra' : 'Post-acceptance')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Detailed Description */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  {t('programOverview')}
                </h2>
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line space-y-4">
                  {internship.description}
                </div>
              </div>

              {/* Responsibilities */}
              {internship.responsibilities && internship.responsibilities.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-600" />
                    {t('responsibilities')}
                  </h2>
                  <ul className="space-y-3">
                    {internship.responsibilities.map((resp, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {internship.requirements && internship.requirements.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    {t('requirements')}
                  </h2>
                  <ul className="space-y-3">
                    {internship.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0"></div>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {internship.benefits && internship.benefits.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    {t('benefits')}
                  </h2>
                  <ul className="space-y-3">
                    {internship.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right 1 Col: Application Action Box */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs sticky top-24">
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {isAz ? 'Müraciət Mərkəzi' : 'Application Portal'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  {isAz
                    ? 'Bu təcrübə proqramına qəbul mərhələli seçim əsasında aparılır.'
                    : 'Selection for this internship is conducted on a merit-based evaluation.'}
                </p>

                {/* Status Decision & CTA */}
                {profile?.role === 'admin' ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-700">
                      <span className="font-semibold block mb-1">
                        {isAz ? 'İnzibatçı Girişi' : 'Admin Access'}
                      </span>
                      {isAz
                        ? 'Siz inzibatçı profilindəsiz. Bu proqramı idarəetmə panelindən redaktə edə bilərsiniz.'
                        : 'You are signed in as an administrator. You can edit this cohort from the admin console.'}
                    </div>
                    <Link href={`/admin/internships/${internship.id}/edit`}>
                      <Button className="w-full gap-2 shadow-xs">
                        {t('manageProgram')}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                ) : studentEnrollment ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
                      <span className="font-semibold flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {t('alreadyParticipating')}
                      </span>
                      {isAz
                        ? 'Siz artıq bu təcrübə proqramına qəbul olunmusunuz və aktiv iştirakçısınız.'
                        : 'You have been accepted and are actively enrolled in this internship.'}
                    </div>
                    <Link href="/dashboard/internship">
                      <Button className="w-full gap-2 shadow-xs bg-emerald-600 hover:bg-emerald-700">
                        {t('activeInternshipTitle')}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                ) : studentApp ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                      <span className="font-semibold flex items-center gap-1.5 mb-1">
                        <Clock className="w-4 h-4 text-amber-600" />
                        {t('alreadyApplied')}
                      </span>
                      {isAz
                        ? 'Müraciətiniz qeydə alınıb və hazırda inzibatçı tərəfindən nəzərdən keçirilməkdədir.'
                        : 'Your application has been received and is currently under administrative review.'}
                    </div>
                    <Link href="/dashboard/applications">
                      <Button variant="outline" className="w-full gap-2">
                        {t('myApplicationsTitle')}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                ) : isClosed ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 text-center">
                      <AlertCircle className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                      <span className="font-semibold block">{t('applicationsClosed')}</span>
                      {isAz ? 'Bu proqram üzrə müraciət qəbulu dayandırılmışdır.' : 'Applications for this cohort are currently closed.'}
                    </div>
                    <Button disabled className="w-full">
                      {t('applicationsClosed')}
                    </Button>
                  </div>
                ) : isDeadlinePassed ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 text-center">
                      <AlertCircle className="w-5 h-5 text-rose-500 mx-auto mb-1.5" />
                      <span className="font-semibold block">{t('deadlinePassed')}</span>
                      {isAz ? 'Son müraciət tarixi başa çatıb.' : 'The deadline to submit applications has ended.'}
                    </div>
                    <Button disabled className="w-full">
                      {t('deadlinePassed')}
                    </Button>
                  </div>
                ) : !isAuthenticated ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      {isAz
                        ? 'Müraciət etmək üçün tələbə hesabınıza daxil olmalısınız.'
                        : 'Please log in with your student account to submit an application.'}
                    </p>
                    <Link href={`/login?redirect=/internships/${internship.slug}/apply`}>
                      <Button className="w-full gap-2 shadow-xs">
                        {t('loginToApply')}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="outline" className="w-full text-xs">
                        {t('navRegister')}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link href={`/internships/${internship.slug}/apply`}>
                      <Button className="w-full gap-2 shadow-xs bg-blue-600 hover:bg-blue-700 text-white font-medium">
                        {t('applyNow')}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Required Skills Box */}
                {internship.skills && internship.skills.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                      {t('skills')}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {internship.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
