'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAdminStats } from '@/lib/admin/stats';
import { getAllApplications } from '@/lib/applications/service';
import { AdminStats, Profile, Application } from '@/types/database';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils/date';
import {
  Users,
  Briefcase,
  FileCheck2,
  UserCheck,
  UploadCloud,
  FileBadge,
  CreditCard,
  Award,
  RefreshCw,
  GraduationCap,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    activeInternships: 0,
    pendingApplications: 0,
    activeInterns: 0,
    pendingSubmissions: 0,
    completedInternships: 0,
    pendingCertificatePayments: 0,
    certificatesIssued: 0,
  });
  const [students, setStudents] = useState<Profile[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  const refreshData = async () => {
    setLoading(true);
    try {
      const [fetchedStats, apps] = await Promise.all([
        getAdminStats(),
        getAllApplications(),
      ]);
      setStats(fetchedStats);
      setRecentApplications(apps.slice(0, 5));

      if (isConfigured) {
        const supabase = createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'student')
            .order('created_at', { ascending: false });

          if (!error && data) {
            setStudents(data as Profile[]);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [fetchedStats, apps] = await Promise.all([
          getAdminStats(),
          getAllApplications(),
        ]);
        if (!isMounted) return;
        setStats(fetchedStats);
        setRecentApplications(apps.slice(0, 5));

        if (isConfigured) {
          const supabase = createClient();
          if (supabase) {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('role', 'student')
              .order('created_at', { ascending: false });

            if (!isMounted) return;
            if (!error && data) {
              setStudents(data as Profile[]);
            }
          }
        }
      } catch (err) {
        console.warn('Initial admin data fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [isConfigured]);

  const statCards = [
    {
      title: 'Qeydiyyatdan Keçmiş Tələbələr',
      value: stats.totalStudents,
      description: 'Verilənlər bazasında aktiv tələbə profilləri',
      icon: Users,
      href: '/admin/students',
    },
    {
      title: 'Dərc Olunmuş Təcrübələr',
      value: stats.activeInternships,
      description: 'Açıq elan olunmuş qruplar',
      icon: Briefcase,
      href: '/admin/internships',
    },
    {
      title: 'Baxılmamış Müraciətlər',
      value: stats.pendingApplications,
      description: 'Qərar gözləyən namizəd anketləri',
      icon: FileCheck2,
      highlight: stats.pendingApplications > 0,
      href: '/admin/applications',
    },
    {
      title: 'Cari Təcrübəçilər',
      value: stats.activeInterns,
      description: 'Aktiv qeydiyyatda olan tələbələr',
      icon: UserCheck,
      href: '/admin/students',
    },
    {
      title: 'Yoxlanmalı Tapşırıqlar',
      value: stats.pendingSubmissions,
      description: 'Yoxlama gözləyən həllər',
      icon: UploadCloud,
      highlight: stats.pendingSubmissions > 0,
      href: '/admin/submissions',
    },
    {
      title: 'Tamamlanmış Təcrübələr',
      value: stats.completedInternships,
      description: 'Mərhələləri bitirmiş məzunlar',
      icon: FileBadge,
      href: '/admin/completed',
    },
    {
      title: 'Sertifikat Müraciətləri',
      value: stats.pendingCertificatePayments,
      description: 'Ödəniş və təsdiq gözləyən',
      icon: CreditCard,
      href: '/admin/certificate-orders',
    },
    {
      title: 'Verilmiş Sertifikatlar',
      value: stats.certificatesIssued,
      description: 'Rəsmi kodla təsdiq olunmuş',
      icon: Award,
      href: '/admin/certificates',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <PageHeading embedded title={<>
            İnzibatçı Paneli
          </>} description={<>
            Platforma idarəetməsi, tələbə qeydiyyatları və təcrübə proqramları göstəriciləri.
          </>} />
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/internships/new">
            <Button size="sm" className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold gap-1.5 shadow-xs text-xs">
              <Plus className="w-4 h-4" />
              Yeni Təcrübə Yarat
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
            className="gap-1.5 text-xs bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Yenilə
          </Button>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/admin/applications" className="block">
          <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Müraciətlərə Bax</h4>
                <p className="text-xs text-slate-400">
                  {stats.pendingApplications} gözləmədə olan anket
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </div>
        </Link>

        <Link href="/admin/internships" className="block">
          <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Təcrübə Proqramları</h4>
                <p className="text-xs text-slate-400">Vakansiyaları və qrupları idarə et</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </div>
        </Link>

        <Link href="/admin/internships/new" className="block">
          <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Yeni Vakansiya Yarat</h4>
                <p className="text-xs text-slate-400">Yeni təcrübəçi qrupu aç</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </div>
        </Link>
      </div>

      {/* 8 Statistics Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Sistem Göstəriciləri
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            const content = (
              <Card
                className={`bg-slate-900/90 text-white border shadow-2xs transition-all h-full ${
                  card.href ? 'hover:border-slate-700 hover:bg-slate-800/80 cursor-pointer' : ''
                } ${
                  card.highlight ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800'
                }`}
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <span className="text-xs font-medium text-slate-300">
                    {card.title}
                  </span>
                  <div className={`p-2 rounded-lg ${card.highlight ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    {card.value}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            );

            if (card.href) {
              return (
                <Link key={card.title} href={card.href} className="block group">
                  {content}
                </Link>
              );
            }
            return <div key={card.title}>{content}</div>;
          })}
        </div>
      </div>

      {/* Recent Applications Section */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader className="border-b border-slate-800 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              Son Müraciətlər
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-0.5">
              Qəbul və ya imtina üçün daxil olan ən son müraciətlər
            </CardDescription>
          </div>
          <Link href="/admin/applications">
            <Button variant="ghost" size="sm" className="text-xs text-amber-400 hover:text-amber-300 gap-1">
              Bütün müraciətlər
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentApplications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Hələlik heç bir müraciət daxil olmayıb.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {app.student?.full_name}
                      </span>
                      <span className="text-2xs text-slate-400 font-mono">
                        ({app.student?.email})
                      </span>
                    </div>
                    <p className="text-xs text-amber-400">
                      {app.internship?.title}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={`text-2xs font-semibold ${
                        app.status === 'accepted'
                          ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                          : app.status === 'rejected'
                          ? 'border-rose-500 text-rose-400 bg-rose-500/10'
                          : 'border-amber-500 text-amber-400 bg-amber-500/10'
                      }`}
                    >
                      {app.status === 'pending'
                        ? 'Gözləmədə'
                        : app.status === 'accepted'
                        ? 'Qəbul edildi'
                        : app.status === 'rejected'
                        ? 'Rədd edildi'
                        : 'Geri çəkildi'}
                    </Badge>
                    <Link href={`/admin/applications/${app.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700 text-slate-300 hover:text-white">
                        İcmal et
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registered Students Table */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Qeydiyyatdan Keçmiş Tələbələr
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Universitetlər üzrə qeydiyyatdan keçmiş tələbələrin siyahısı
              </CardDescription>
            </div>
            <Badge variant="default" className="bg-amber-400/20 text-amber-300 border-amber-400/30">
              {students.length} Tələbə
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {students.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Hələlik qeydiyyatdan keçmiş tələbə tapılmadı.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">Tələbə</th>
                  <th className="px-6 py-3 font-semibold">Universitet</th>
                  <th className="px-6 py-3 font-semibold">E-poçt</th>
                  <th className="px-6 py-3 font-semibold">Rol</th>
                  <th className="px-6 py-3 font-semibold">Tarix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5 flex items-center gap-3">
                      <Avatar
                        src={student.avatar_url}
                        fallback={student.full_name}
                        size="sm"
                        className="ring-slate-700"
                      />
                      <span className="font-semibold text-white">
                        {student.full_name}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{student.university || 'Qeyd olunmayıb'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-400 text-[11px]">
                      {student.email}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant="default" className="text-[10px] py-0 px-2 bg-emerald-950 text-emerald-300 border-emerald-800">
                        {student.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 text-[11px]">
                      {formatDate(student.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
