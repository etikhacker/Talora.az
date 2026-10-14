'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-context';
import { GraduationCap, Target, Users, Award, Building2, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  const { language } = useLanguage();
  const isAz = language === 'az';

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-1 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold mb-4">
              <GraduationCap className="w-4 h-4" />
              <span>Talora Platform</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {isAz ? 'Haqqımızda' : 'About Talora'}
            </h1>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              {isAz
                ? 'Talora tələbələr və gənc mütəxəssislər ilə müasir əmək bazarının tələbləri arasında körpü quran beynəlxalq təcrübə və inkişaf platformasıdır.'
                : 'Talora connects aspiring professionals and students worldwide with real-world internship opportunities, industry mentorship, and verified credentials.'}
            </p>
          </div>

          {/* Mission & Vision Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {isAz ? 'Missiyamız' : 'Our Mission'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isAz
                  ? 'Gənc mütəxəssislərə tələbəlik dövründə real praktiki təcrübə qazanmaq və rəqabətədavamlı portfel formalaşdırmaq imkanı yaratmaq.'
                  : 'Empowering students to gain tangible workplace experience and build portfolio-grade skills before graduation.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {isAz ? 'Əhatə Dairəmiz' : 'Student Scope'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isAz
                  ? 'Bakı və region universitetlərində təhsil alan tələbələrə bərabər şəraitdə praktiki layihələrə qoşulmaq şansı verilir.'
                  : 'Providing equal access to practical industry tracks for university students across Baku and all regions of Azerbaijan.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {isAz ? 'Dəyərimiz' : 'Verified Credentials'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isAz
                  ? 'Yalnız real icra olunmuş tapşırıqlar və təsdiq olunmuş nəticələr əsasında verilən rəsmi sertifikatlar.'
                  : 'Certificates issued strictly based on actual delivered milestones and rigorous coordinator evaluation.'}
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {isAz ? 'Bizimlə əməkdaşlıq etmək istəyirsiniz?' : 'Interested in partnering with us?'}
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6">
              {isAz
                ? 'Universitet nümayəndələri və şirkət rəhbərləri təcrübə proqramları yaratmaq üçün bizimlə əlaqə saxlaya bilərlər.'
                : 'University representatives and employers can contact us to set up customized student internship tracks.'}
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/contact">
                <Button variant="default" className="gap-2">
                  {isAz ? 'Əlaqə saxlayın' : 'Contact Us'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
