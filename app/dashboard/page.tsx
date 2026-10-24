'use client';

import { PageHeading } from '@/components/layout/page-heading';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { getStudentActiveEnrollment } from '@/lib/enrollments/service';
import { getStudentApplications } from '@/lib/applications/service';
import { Enrollment, Application } from '@/types/database';
import { formatDate } from '@/lib/utils/date';
import {
  User,
  GraduationCap,
  Mail,
  Shield,
  Briefcase,
  ArrowRight,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { profile, user } = useAuth();
  const { language, t } = useLanguage();
  const isAz = language === 'az';

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!profile?.id) return;
      setLoading(true);
      try {
        const [activeEnroll, apps] = await Promise.all([
          getStudentActiveEnrollment(profile.id),
          getStudentApplications(profile.id),
        ]);
        setEnrollment(activeEnroll);
        setApplications(apps);
      } catch (err) {
        console.error('Failed to load student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile?.id]);

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length;
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length;

  const formattedJoinDate = profile?.created_at
    ? formatDate(profile.created_at)
    : (isAz ? 'Yenicə' : 'Recently');

  return (
    <div className="space-y-6">
      <PageHeading eyebrow={isAz ? 'SƏNİN İNKİŞAF YOLUN' : 'YOUR LEARNING JOURNEY'} title={isAz ? 'Növbəti addımına hazırsan?' : 'Ready for your next step?'} description={isAz ? `Xoş gəldin, ${profile?.full_name || 'Tələbə'}. Müraciətlərini, proqramlarını və gördüyün işləri bir yerdən izlə.` : `Welcome, ${profile?.full_name || 'Student'}. Follow your applications, programs and work in one place.`} actions={<Link href="/dashboard/tasks"><Button className="gap-2">{isAz ? 'Tapşırıqlarıma keç' : 'Open assignments'}<ArrowRight size={16} /></Button></Link>} />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              {t('statusPending')}
            </span>
            <span className="text-2xl font-extrabold text-amber-600">{pendingCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              {t('statusAccepted')}
            </span>
            <span className="text-2xl font-extrabold text-emerald-600">{acceptedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              {t('statusRejected')}
            </span>
            <span className="text-2xl font-extrabold text-rose-600">{rejectedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Student Profile & Internship Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Detailed Student Profile Card */}
        <Card className="lg:col-span-2 border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  src={profile?.avatar_url}
                  fallback={profile?.full_name || 'ST'}
                  size="lg"
                  className="border-2 border-emerald-100 ring-2 ring-emerald-50"
                />
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    {profile?.full_name || 'Tələbə İstifadəçi'}
                  </CardTitle>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{profile?.university || (isAz ? 'Universitet qeyd olunmayıb' : 'University not set')}</span>
                  </p>
                </div>
              </div>
              <Badge variant="default" className="text-xs capitalize py-1 px-3">
                {isAz ? 'Tələbə' : 'Student'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {isAz ? 'E-poçt ünvanı' : 'Email Address'}
                </p>
                <p className="text-xs font-semibold text-slate-800 break-all">
                  {profile?.email || user?.email || '—'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-slate-400" />
                  {isAz ? 'Təhsil Müəssisəsi' : 'Institution'}
                </p>
                <p className="text-xs font-semibold text-slate-800">
                  {profile?.university || (isAz ? 'Qeyd olunmayıb' : 'Not specified')}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-slate-400" />
                  Status
                </p>
                <p className="text-xs font-semibold text-emerald-700 font-bold">
                  {isAz ? 'Aktiv Tələbə Hesabı' : 'Active Student Account'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {isAz ? 'Qeydiyyat tarixi' : 'Joined Date'}
                </p>
                <p className="text-xs font-semibold text-slate-800">
                  {formattedJoinDate}
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 py-3">
            <span>{isAz ? 'Profil məlumatlarınız rəsmi sertifikatda əks olunur.' : 'Profile information will appear on official certificates.'}</span>
            <Link href="/dashboard/profile" className="text-emerald-700 font-semibold hover:underline flex items-center gap-1">
              {isAz ? 'Profili yenilə' : 'Edit profile'}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </CardFooter>
        </Card>

        {/* Right Col: Internship Status Card */}
        <Card className="border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                {isAz ? 'Aktiv Təcrübə Statusu' : 'Active Enrollment'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAz ? 'Cari təcrübə proqramınızın vəziyyəti' : 'Status of your active internship cohort'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              {enrollment && enrollment.internship ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <Badge className="bg-emerald-600 text-white text-2xs mb-2">
                      {isAz ? 'Aktiv İştirakçı' : 'Enrolled'}
                    </Badge>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {enrollment.internship.title}
                    </h4>
                    <p className="text-2xs text-slate-500 mt-1">
                      {enrollment.internship.category} • {enrollment.internship.duration_weeks} {t('durationWeeks')}
                    </p>
                  </div>
                  <Link href="/dashboard/internship" className="block">
                    <Button size="sm" className="w-full text-xs gap-1.5 shadow-xs">
                      {t('activeInternshipTitle')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200">
                    <Clock className="w-7 h-7" />
                  </div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-1.5">
                    {isAz ? 'Aktiv proqram yoxdur' : 'No active program'}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto mb-4">
                    {t('noActiveInternshipDesc')}
                  </p>
                  <Link href="/internships">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      {isAz ? 'Təcrübə proqramlarına bax' : 'Explore Internships'}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </div>

          <CardFooter className="p-4 bg-slate-50/60 border-t border-slate-100">
            <Link href="/dashboard/applications" className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-emerald-700 font-medium">
              <span>{t('myApplicationsTitle')} ({applications.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
