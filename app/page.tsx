'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Internship } from '@/types/database';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-context';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  Briefcase,
  Check,
  Code2,
  Database,
  GraduationCap,
  Layers3,
  Sparkles,
  Users,
} from 'lucide-react';

const tracks = [
  {
    number: '01',
    icon: Code2,
    tone: 'violet',
    azTitle: 'Frontend & Web Engineering',
    enTitle: 'Frontend & Web Engineering',
    azText: 'Next.js, TypeScript, UI sistemləri və real məhsul interfeysləri.',
    enText: 'Next.js, TypeScript, UI systems, and real product interfaces.',
  },
  {
    number: '02',
    icon: Database,
    tone: 'green',
    azTitle: 'Backend & Data Systems',
    enTitle: 'Backend & Data Systems',
    azText: 'API-lər, PostgreSQL, verilənlər bazası dizaynı və təhlükəsiz serverlər.',
    enText: 'APIs, PostgreSQL, database design, and secure server systems.',
  },
  {
    number: '03',
    icon: BarChart3,
    tone: 'orange',
    azTitle: 'AI, Analytics & Automation',
    enTitle: 'AI, Analytics & Automation',
    azText: 'AI alətləri, data düşüncəsi və iş axınlarını avtomatlaşdıran layihələr.',
    enText: 'AI tools, data thinking, and projects that automate real workflows.',
  },
];

const steps = [
  ['01', 'Qeydiyyat', 'Profilini yarat, universitet və maraq sahələrini əlavə et.'],
  ['02', 'İstiqamət seçimi', 'Sənə uyğun təcrübə proqramına müraciət et.'],
  ['03', 'Real tapşırıqlar', 'Mentor dəstəyi ilə həftəlik layihələr üzərində işləyin.'],
  ['04', 'Sertifikat', 'Nəticəni göstərən təsdiqlənə bilən sertifikat əldə et.'],
];

export default function HomePage() {
  const { language } = useLanguage();
  const isAz = language === 'az';
  const [programs, setPrograms] = useState<Internship[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [previewStep, setPreviewStep] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadPrograms() {
      try {
        const response = await fetch('/api/internships/public', { cache: 'no-store' });
        if (!response.ok) throw new Error('Could not load public programs');
        const data = (await response.json()) as Internship[];
        if (active) setPrograms(data.filter((program) => program.status === 'published').slice(0, 3));
      } catch {
        if (active) setPrograms([]);
      } finally {
        if (active) setProgramsLoading(false);
      }
    }
    void loadPrograms();
    return () => { active = false; };
  }, []);

  const previewTasks = [
    {
      number: '01',
      title: isAz ? 'Layihəni planlaşdır' : 'Plan your project',
      detail: isAz ? 'Məqsədi müəyyən et, repo-nu yarat və ilk README-ni yaz.' : 'Define the goal, create your repository, and write the first README.',
      deliverable: isAz ? 'GitHub repo + README' : 'GitHub repo + README',
      icon: BookOpen,
    },
    {
      number: '02',
      title: isAz ? 'Həllini qur və yoxla' : 'Build and test your solution',
      detail: isAz ? 'Tapşırığı kiçik addımlara böl, kodunu yaz və nəticəni test et.' : 'Break the task into small steps, implement your solution, and test it.',
      deliverable: isAz ? 'Kod + test nəticələri' : 'Code + test results',
      icon: Code2,
    },
    {
      number: '03',
      title: isAz ? 'İşini təqdim et' : 'Submit your work',
      detail: isAz ? 'Nəticəni sənədləşdir, məhdudiyyətləri qeyd et və təqdimat linkini paylaş.' : 'Document the result, note limitations, and share your submission link.',
      deliverable: isAz ? 'Demo + qısa hesabat' : 'Demo + short report',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="portfolio-page flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="portfolio-hero relative overflow-hidden">
          <div className="portfolio-noise" aria-hidden="true" />
          <div className="portfolio-hero-glow portfolio-hero-glow-one" aria-hidden="true" />
          <div className="portfolio-hero-glow portfolio-hero-glow-two" aria-hidden="true" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-10 lg:pb-32 lg:pt-28">
            <div className="relative z-10">
              <div className="reveal-up reveal-delay-1 mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {isAz ? 'Azərbaycan tələbələri üçün' : 'For university students in Azerbaijan'}
              </div>
              <h1 className="reveal-up reveal-delay-2 max-w-4xl text-[3.25rem] font-black leading-[0.98] tracking-[-0.065em] text-white sm:text-6xl lg:text-[6.5rem]">
                {isAz ? (
                  <>Gələcəyini <span className="portfolio-gradient-text">bu gün</span> qur.</>
                ) : (
                  <>Build your <span className="portfolio-gradient-text">future</span> today.</>
                )}
              </h1>
              <p className="reveal-up reveal-delay-3 mt-8 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                {isAz
                  ? 'Intern.az universitetdə öyrəndiklərini real layihələrə, mentor rəyinə və karyeran üçün görünən nəticələrə çevirir.'
                  : 'Intern.az turns what you learn at university into real projects, mentor feedback, and visible career proof.'}
              </p>
              <div className="reveal-up reveal-delay-4 mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/register">
                  <Button size="lg" className="portfolio-primary-button h-13 w-full gap-2 rounded-full px-7 sm:w-auto">
                    {isAz ? 'Səyahətə başla' : 'Start your journey'}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/internships">
                  <Button variant="outline" size="lg" className="portfolio-outline-button h-13 w-full gap-2 rounded-full px-7 sm:w-auto">
                    {isAz ? 'Proqramları kəşf et' : 'Explore programs'}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
              <div className="reveal-up reveal-delay-4 mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-6 text-xs text-slate-400">
                <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-300" /> Real layihələr</span>
                <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-300" /> Mentor rəyi</span>
                <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-300" /> Verifiable sertifikat</span>
              </div>
            </div>

            <div className="portfolio-hero-art reveal-up reveal-delay-3 relative mx-auto h-[31rem] w-full max-w-[34rem] lg:h-[34rem]" aria-label="Intern.az tələbə inkişaf platformasının vizual önizləməsi">
              <div className="portfolio-orbit portfolio-orbit-one" aria-hidden="true" />
              <div className="portfolio-orbit portfolio-orbit-two" aria-hidden="true" />
              <div className="portfolio-main-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950 shadow-[0_0_30px_rgba(110,231,183,0.35)]">
                      <GraduationCap className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-200">Intern.az</p>
                      <p className="mt-1 text-sm text-slate-400">Student workspace</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200">ACTIVE</span>
                </div>
                <div className="mt-9">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current focus</p>
                  <h2 className="mt-3 max-w-xs text-4xl font-black tracking-[-0.05em] text-white">Build. Learn. Show it.</h2>
                </div>
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{isAz ? 'Nümunə tapşırıq' : 'Sample task'}</p><p className="mt-2 text-base font-bold text-white">{isAz ? 'İlk layihə repozitoriyası' : 'Your first project repository'}</p></div>
                    <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200">{isAz ? 'Başlanğıc' : 'Beginner'}</span>
                  </div>
                  <div className="mt-4 space-y-3 text-xs text-slate-400">
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> {isAz ? 'Repo-nu yarat' : 'Create your repository'}</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> {isAz ? 'README əlavə et' : 'Add a README'}</div>
                    <div className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border border-slate-600" /> {isAz ? 'Nəticəni təqdim et' : 'Submit your result'}</div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3"><Layers3 className="h-4 w-4 text-violet-300" /><p className="mt-3 text-sm font-black text-white">{isAz ? 'Layihə' : 'Project'}</p><p className="text-[10px] text-slate-500">{isAz ? 'Praktika' : 'Practice'}</p></div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3"><Users className="h-4 w-4 text-emerald-300" /><p className="mt-3 text-sm font-black text-white">{isAz ? 'Rəy' : 'Feedback'}</p><p className="text-[10px] text-slate-500">{isAz ? 'İnkişaf' : 'Growth'}</p></div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3"><Award className="h-4 w-4 text-orange-300" /><p className="mt-3 text-sm font-black text-white">{isAz ? 'Nəticə' : 'Outcome'}</p><p className="text-[10px] text-slate-500">{isAz ? 'Portfolio' : 'Portfolio'}</p></div>
                </div>
              </div>
              <div className="portfolio-floating-tag portfolio-floating-tag-top"><Briefcase className="h-4 w-4 text-orange-300" /> Real work</div>
              <div className="portfolio-floating-tag portfolio-floating-tag-bottom"><span className="h-2 w-2 rounded-full bg-emerald-300" /> Mentor feedback</div>
            </div>
          </div>
        </section>

        <div className="portfolio-marquee border-y border-white/10 bg-white/[0.025] py-5">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 sm:justify-between sm:px-8 lg:px-10">
            <span>Frontend</span><span>Backend</span><span>Data</span><span>AI & Automation</span><span>Cybersecurity</span><span>Product thinking</span>
          </div>
        </div>

        <section id="programs" className="portfolio-section mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl"><p className="portfolio-kicker">01 / {isAz ? 'Proqramlar' : 'Programs'}</p><h2 className="portfolio-heading">{isAz ? 'Növbəti addımını seç.' : 'Choose your next step.'}</h2><p className="mt-5 max-w-xl text-sm leading-6 text-slate-400">{isAz ? 'Proqramlar canlı siyahıdan yüklənir. Hər birində öyrən, qur və nəticəni portfoliona əlavə et.' : 'Programs load from the live listing. Learn, build, and add a tangible result to your portfolio.'}</p></div>
            <Link href="/internships" className="portfolio-text-link">{isAz ? 'Bütün proqramlara bax' : 'View all programs'} <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          {programsLoading ? (
            <div className="grid gap-5 lg:grid-cols-3">{[0,1,2].map((item) => <div key={item} className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/[0.035]" />)}</div>
          ) : programs.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-3">
              {programs.map((program, index) => <Link href={`/internships/${program.slug}`} key={program.id} className="portfolio-track-card group">
                <div className="flex items-start justify-between"><span className="text-xs font-bold tracking-[0.18em] text-slate-500">{String(index + 1).padStart(2,'0')}</span><span className="portfolio-track-icon"><GraduationCap className="h-5 w-5" aria-hidden="true" /></span></div>
                <div className="mt-8 flex flex-wrap gap-2"><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200">{program.category || (isAz ? 'Təcrübə proqramı' : 'Internship')}</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-400">{program.duration_weeks} {isAz ? 'həftə' : 'weeks'}</span></div>
                <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-white">{program.title}</h3>
                <p className="mt-3 min-h-14 text-sm leading-6 text-slate-400">{program.short_description || program.description}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-bold text-white">{isAz ? 'Proqramı araşdır' : 'Explore program'} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></span>
              </Link>)}
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-3">
              {tracks.map((track) => { const Icon = track.icon; return <Link href="/internships" key={track.number} className={`portfolio-track-card portfolio-track-${track.tone}`}>
                <div className="flex items-start justify-between"><span className="text-xs font-bold tracking-[0.18em] text-slate-500">{track.number}</span><span className="portfolio-track-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span></div>
                <h3 className="mt-12 text-2xl font-black tracking-[-0.04em] text-white">{isAz ? track.azTitle : track.enTitle}</h3>
                <p className="mt-4 min-h-14 text-sm leading-6 text-slate-400">{isAz ? track.azText : track.enText}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-bold text-white">{isAz ? 'İstiqaməti aç' : 'Open track'} <ArrowUpRight className="h-4 w-4" /></span>
              </Link>; })}
            </div>
          )}
        </section>

        <section className="border-y border-white/10 bg-[#0b1016]">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-32">
            <div><p className="portfolio-kicker">02 / Process</p><h2 className="portfolio-heading">{isAz ? 'Bir addım. Sonra bir addım da.' : 'One step. Then another.'}</h2><p className="portfolio-intro mt-6 max-w-md text-base leading-7 text-slate-400">{isAz ? 'Mürəkkəb karyera yolunu aydın və ölçülə bilən mərhələlərə bölürük.' : 'We turn an overwhelming career start into a clear, measurable sequence of steps.'}</p></div>
            <div className="grid gap-0">
              {steps.map(([number, title, text], index) => <div key={number} className="portfolio-step-row"><span className="portfolio-step-number">{number}</span><div><h3 className="text-xl font-bold text-white">{isAz ? title : ['Registration', 'Direction', 'Real tasks', 'Certificate'][index]}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">{isAz ? text : ['Create your profile and add your university details.', 'Choose a program that fits your interests.', 'Work on practical projects with mentor guidance.', 'Earn a credential you can verify and share.'][index]}</p></div><ArrowUpRight className="ml-auto hidden h-5 w-5 text-emerald-300 sm:block" aria-hidden="true" /></div>)}
            </div>
          </div>
        </section>

        <section className="portfolio-preview-section border-y border-white/10 bg-[#090e13]">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-10 lg:py-28">
            <div className="self-center">
              <p className="portfolio-kicker">03 / {isAz ? 'Tapşırıq təcrübəsi' : 'Task experience'}</p>
              <h2 className="portfolio-heading">{isAz ? 'Sadəcə öyrənmə. Qur, yoxla, təqdim et.' : 'Don’t just learn. Build, test, submit.'}</h2>
              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">{isAz ? 'Hər tapşırıq aydın məqsəd, addım-addım təlimat və konkret təhvil nəticəsi ilə qurulub. Hansı mərhələdə olduğunu seç və nümunəyə bax.' : 'Each task has a clear goal, step-by-step guidance, and a concrete deliverable. Select a stage to preview the workflow.'}</p>
              <div className="mt-8 flex flex-wrap gap-2">
                {previewTasks.map((task, index) => <button key={task.number} type="button" onClick={() => setPreviewStep(index)} aria-pressed={previewStep === index} className={`rounded-full border px-4 py-2 text-xs font-bold transition-all ${previewStep === index ? 'border-emerald-300/40 bg-emerald-300/15 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.08)]' : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white'}`}>{task.number} · {index === 0 ? (isAz ? 'Planla' : 'Plan') : index === 1 ? (isAz ? 'Hazırla' : 'Build') : (isAz ? 'Təqdim et' : 'Submit')}</button>)}
              </div>
            </div>
            <div className="portfolio-preview-card rounded-[2rem] border border-emerald-300/15 bg-gradient-to-br from-[#12221f] via-[#0e171c] to-[#0a0e13] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.3)] sm:p-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-5"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-200"><span className="text-sm font-black">{previewTasks[previewStep].number}</span></div><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{isAz ? 'Tapşırıq önizləməsi' : 'Task preview'}</p><h3 className="mt-1 text-lg font-black text-white">{previewTasks[previewStep].title}</h3></div></div><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold text-slate-300">{isAz ? 'Nümunə' : 'Example'}</span></div>
              <div className="py-8"><div className="flex items-start gap-4"><div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/10 text-emerald-200">{(() => { const Icon = previewTasks[previewStep].icon; return <Icon className="h-4 w-4" aria-hidden="true" />; })()}</div><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-200">{isAz ? 'Nə etməlisən?' : 'What you’ll do'}</p><p className="mt-3 text-sm leading-7 text-slate-300">{previewTasks[previewStep].detail}</p></div></div>
                <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{isAz ? 'Təhvil veriləcək nəticə' : 'Deliverable'}</p><div className="mt-3 flex items-center justify-between gap-4"><span className="text-sm font-bold text-white">{previewTasks[previewStep].deliverable}</span><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" /></div></div>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-5"><span className="text-xs text-slate-500">{isAz ? 'Aydın təlimat · Konkret nəticə' : 'Clear guidance · Concrete outcome'}</span><button type="button" onClick={() => setPreviewStep((previewStep + 1) % previewTasks.length)} className="inline-flex items-center gap-2 text-xs font-bold text-emerald-200 transition-colors hover:text-white">{isAz ? 'Növbəti mərhələ' : 'Next step'} <ChevronRight className="h-4 w-4" /></button></div>
            </div>
          </div>
        </section>

        <section className="portfolio-cta mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="relative overflow-hidden rounded-[2rem] border border-emerald-300/20 bg-gradient-to-br from-emerald-400 via-emerald-500 to-cyan-500 px-7 py-14 text-center shadow-[0_30px_100px_rgba(16,185,129,0.2)] sm:px-12">
            <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[40px] border-white/10" aria-hidden="true" /><div className="absolute -bottom-32 -left-10 h-72 w-72 rounded-full border-[45px] border-white/10" aria-hidden="true" />
            <p className="relative text-xs font-black uppercase tracking-[0.2em] text-emerald-950/70">Intern.az / 2026</p>
            <h2 className="relative mx-auto mt-5 max-w-3xl text-4xl font-black tracking-[-0.055em] text-slate-950 sm:text-6xl">{isAz ? 'Öyrəndiklərini göstərməyə başla.' : 'Start showing what you can do.'}</h2>
            <p className="relative mx-auto mt-5 max-w-xl text-sm leading-6 text-emerald-950/75">{isAz ? 'İlk real layihənə bir klik məsafədəsən.' : 'Your first real project is one click away.'}</p>
            <Link href="/register" className="relative mt-8 inline-block"><Button size="lg" className="h-13 rounded-full bg-slate-950 px-8 text-white shadow-xl hover:bg-slate-800">{isAz ? 'Qeydiyyatdan keç' : 'Create your profile'} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
