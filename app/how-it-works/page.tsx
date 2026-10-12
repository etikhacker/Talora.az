'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-context';
import {
  UserCheck,
  Send,
  ListTodo,
  Award,
  ArrowRight,
  ShieldCheck,
  Building,
  CheckCircle,
} from 'lucide-react';

export default function HowItWorksPage() {
  const { language } = useLanguage();
  const isAz = language === 'az';

  const steps = isAz
    ? [
        {
          num: '01',
          title: 'Tələbə Profilinin Yaradılması',
          desc: 'Universitet e-poçtunuz və ya şəxsi məlumatlarınızla qeydiyyatdan keçin. Fakültə, ixtisas və maraqlandığınız istiqaməti göstərin.',
          icon: UserCheck,
        },
        {
          num: '02',
          title: 'Proqrama Müraciət',
          desc: 'Aktiv təcrübə proqramları arasından sizə uyğun olanı seçin və müraciət formasını göndərin. Müraciətiniz koordinatorlar tərəfindən yoxlanılır.',
          icon: Send,
        },
        {
          num: '03',
          title: 'Praktiki Tapşırıqlar və Mentorluq',
          desc: 'Qəbul olunduqdan sonra hər həftə real iş ssenarilərinə uyğun tapşırıqlar alacaqsınız. Hər mərhələdə rəy alaraq layihənizi inkişaf etdirin.',
          icon: ListTodo,
        },
        {
          num: '04',
          title: 'Yekun Qiymətləndirmə və Sertifikat',
          desc: 'Bütün tapşırıqları müvəffəqiyyətlə tamamlayan tələbələrə unikal identifikasiya nömrəsi olan rəsmi karyera sertifikatı təqdim olunur.',
          icon: Award,
        },
      ]
    : [
        {
          num: '01',
          title: 'Create Your Student Profile',
          desc: 'Sign up with your university credentials and specify your field of study, university, and preferred career track.',
          icon: UserCheck,
        },
        {
          num: '02',
          title: 'Apply to Selected Programs',
          desc: 'Browse open cohorts and submit your application. Track coordinators review applicant profiles for cohort placement.',
          icon: Send,
        },
        {
          num: '03',
          title: 'Weekly Deliverables & Feedback',
          desc: 'Work on structured real-world tasks each week. Receive actionable mentor feedback to elevate your engineering and analytical skills.',
          icon: ListTodo,
        },
        {
          num: '04',
          title: 'Verification & Official Certificate',
          desc: 'Successfully complete project milestones to earn a verified digital certificate complete with unique public verification code.',
          icon: Award,
        },
      ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-1 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {isAz ? 'Təcrübə Proqramı Necə İşləyir?' : 'How the Internship Program Works'}
            </h1>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              {isAz
                ? 'Intern.az tələbələrə nəzəri bilikləri real sənaye təcrübəsinə çevirmək üçün aydın və şəffaf mexanizm təqdim edir.'
                : 'A structured, transparent pathway helping university students bridge the gap into professional roles.'}
            </p>
          </div>

          <div className="space-y-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-6 items-start sm:items-center hover:border-blue-300 transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 font-extrabold text-xl flex items-center justify-center shrink-0 border border-blue-100">
                    {step.num}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <span>{step.title}</span>
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-14 p-8 bg-blue-900 text-white rounded-2xl text-center">
            <h2 className="text-2xl font-bold mb-3">
              {isAz ? 'Karyeranızı qurmağa bu gündən başlayın' : 'Start shaping your career today'}
            </h2>
            <p className="text-blue-100 text-sm max-w-xl mx-auto mb-6">
              {isAz
                ? 'Tələbə kabinetinizi yaradın və ilk təcrübə müraciətinizə hazırlaşın.'
                : 'Set up your student profile and get ready for the upcoming application cohorts.'}
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-950 hover:bg-blue-50 font-semibold gap-2">
                {isAz ? 'Qeydiyyatdan Keç' : 'Register Now'}
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
