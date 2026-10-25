"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Clock3,
  ArrowRight,
  Pause,
  Play,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { DevelopmentNotice } from "@/components/landing/development-notice";
import { ExperienceArt } from "@/components/landing/experience-art";
import { useLandingMotion } from "@/components/landing/use-landing-motion";
import { ProgramArtwork } from "@/components/internships/program-artwork";
import { buttonVariants } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Internship } from "@/types/database";
import { cn } from "@/lib/utils";

const directions = [
  [
    "Frontend Development",
    "Frontend",
    "İdeyanı işlək veb interfeysə çevir.",
    "Turn ideas into working web interfaces.",
  ],
  [
    "Backend Engineering",
    "Backend",
    "API-lər və server məntiqi qur.",
    "Build APIs and server-side logic.",
  ],
  [
    "Mobile Development",
    "Mobile",
    "Mobil tətbiqlər üzərində çalış.",
    "Work on mobile applications.",
  ],
  [
    "UI/UX Design",
    "UI/UX",
    "İstifadəçi təcrübəsini dizayn et.",
    "Design thoughtful user experiences.",
  ],
  [
    "Cybersecurity",
    "Cybersecurity",
    "Təhlükəsiz sistemləri öyrən.",
    "Explore secure systems.",
  ],
  [
    "Applied AI Engineering",
    "AI",
    "Süni intellekti layihələrə tətbiq et.",
    "Apply artificial intelligence to projects.",
  ],
  [
    "Data Analytics",
    "Data",
    "Məlumatlardan nəticə çıxar.",
    "Turn data into insights.",
  ],
  [
    "Automation",
    "Automation",
    "Təkrarlanan işləri avtomatlaşdır.",
    "Automate repetitive work.",
  ],
];

export default function HomePage() {
  const { language } = useLanguage();
  const isAz = language === "az";
  const landingRef = useRef<HTMLDivElement>(null);
  const [motionPaused, setMotionPaused] = useState(false);
  useLandingMotion(landingRef, motionPaused);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/internships/public", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Program request failed");
        const data = (await response.json()) as Internship[];
        if (!controller.signal.aborted)
          setInternships(
            data.filter((item) => item.status === "published").slice(0, 4),
          );
      } catch {
        if (!controller.signal.aborted) setFetchError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);
  const cta = cn(buttonVariants({ size: "lg" }), "landing-button");
  const secondary = cn(
    buttonVariants({ size: "lg", variant: "outline" }),
    "landing-button",
  );
  const steps = isAz
    ? [
        [
          "01 / SEÇ",
          "İstiqamətini seç.",
          "Proqramları araşdır, şərtlərlə tanış ol və sənə uyğun təcrübəyə müraciət et.",
        ],
        [
          "02 / ÇALIŞ",
          "Layihəni həyata keçir.",
          "Həftəlik tapşırıqları tamamla, həllini göndər və verilən rəylə işini təkmilləşdir.",
        ],
        [
          "03 / TAMAMLA",
          "Nəticəni göstər.",
          "Tamamladığın işləri portfoliona əlavə et. Şərtlər ödənildikdə sertifikat üçün müraciət et.",
        ],
      ]
    : [
        [
          "01 / CHOOSE",
          "Find your direction.",
          "Explore the programs, read the requirements and apply to the internship that fits you.",
        ],
        [
          "02 / BUILD",
          "Bring your project to life.",
          "Complete weekly assignments, submit your work and improve it with the feedback you receive.",
        ],
        [
          "03 / COMPLETE",
          "Show your progress.",
          "Add completed work to your portfolio. Apply for a certificate when the requirements are met.",
        ],
      ];
  return (
    <div
      ref={landingRef}
      className={`talora-landing${motionPaused ? " is-motion-paused" : ""}`}
    >
      <DevelopmentNotice />
      <Navbar />
      <main id="main-content">
        <section className="landing-hero content-width">
          <div className="landing-hero__copy">
            <p className="eyebrow">
              {isAz
                ? "İLK ADDIMINDAN REAL TƏCRÜBƏYƏ"
                : "YOUR FIRST STEP INTO REAL EXPERIENCE"}
            </p>
            <h1>
              {isAz ? (
                <>
                  Öyrəndiklərini
                  <br />
                  <em>təcrübəyə</em>
                  <br />
                  çevir.
                </>
              ) : (
                <>
                  Turn learning
                  <br />
                  into <em>experience.</em>
                </>
              )}
            </h1>
            <p className="landing-lead">
              {isAz
                ? "Real tapşırıqlar üzərində çalış, rəy al və portfoliona yeni işlər əlavə et. İlk peşəkar addımını Talora ilə at."
                : "Work on real assignments, receive feedback and add new projects to your portfolio. Take your first professional step with Talora."}
            </p>
            <div className="landing-actions">
              <Link href="/internships" className={cta}>
                {isAz ? "Proqramlara bax" : "Explore programs"}
                <ArrowUpRight size={18} />
              </Link>
              <a href="#how-it-works" className={secondary}>
                {isAz ? "Necə işləyir?" : "How it works"}
                <ArrowDown size={16} />
              </a>
            </div>
            <p className="landing-footnote">
              {isAz
                ? "Real layihələr   ·   Addım-addım inkişaf"
                : "Real projects   ·   Progress, step by step"}
            </p>
            <button
              type="button"
              className="landing-motion-control"
              aria-pressed={motionPaused}
              onClick={() => setMotionPaused((value) => !value)}
            >
              {motionPaused ? (
                <Play size={13} aria-hidden="true" />
              ) : (
                <Pause size={13} aria-hidden="true" />
              )}
              {isAz
                ? motionPaused
                  ? "Hərəkəti davam etdir"
                  : "Hərəkəti dayandır"
                : motionPaused
                  ? "Resume motion"
                  : "Pause motion"}
            </button>
          </div>
          <ExperienceArt isAz={isAz} animated />
        </section>
        <section
          className="landing-section landing-section--surface"
          id="programs"
        >
          <div className="content-width">
            <div className="section-heading">
              <p className="eyebrow">
                {isAz ? "İSTİQAMƏTİNİ TAP" : "FIND YOUR DIRECTION"}
              </p>
              <h2>
                {isAz
                  ? "Maraqlandığın sahədən başla."
                  : "Start with what interests you."}
              </h2>
              <p>
                {isAz
                  ? "Bacarıqlarını real tapşırıqlarla inkişaf etdirəcəyin proqramı seç."
                  : "Choose a program to develop your skills through real assignments."}
              </p>
            </div>
            <div className="direction-grid direction-grid--illustrated">
              {directions.map(([title, query, az, en]) => (
                <Link
                  key={title}
                  href={"/internships?search=" + encodeURIComponent(query)}
                  className="direction-card direction-card--illustrated"
                >
                  <ProgramArtwork title={title} />
                  <div className="direction-card__body">
                    <h3>{title}</h3>
                    <p>{isAz ? az : en}</p>
                    <span className="direction-card__link">{isAz ? "Proqrama bax" : "Explore program"}<ArrowUpRight size={18} aria-hidden /></span>
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/internships" className={secondary}>
              {isAz ? "Bütün proqramlara bax" : "View all programs"}
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
        <section className="landing-section content-width" id="how-it-works">
          <div className="section-heading">
            <p className="eyebrow">
              {isAz ? "PROSES SADƏDİR" : "A CLEAR PROCESS"}
            </p>
            <h2>
              {isAz
                ? "Sənin yolun. Üç aydın addım."
                : "Your journey. Three clear steps."}
            </h2>
            <p>
              {isAz
                ? "Başladığın yerdən nəticəyədək hər mərhələni şəxsi kabinetində izlə."
                : "Follow each stage in your dashboard, from your first step to the result."}
            </p>
          </div>
          <div className="process-grid">
            {steps.map(([number, title, description]) => (
              <article key={number}>
                <p className="eyebrow">{number}</p>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="landing-section content-width" id="certificate">
          <div className="certificate-promo">
            <div className="certificate-promo__copy">
              <p className="eyebrow">
                {isAz
                  ? "ƏMƏYİNİN GÖRÜNƏN NƏTİCƏSİ"
                  : "MAKE YOUR PROGRESS VISIBLE"}
              </p>
              <h2>
                {isAz ? (
                  <>
                    Öyrəndin. Hazırladın.
                    <br />
                    İndi göstər.
                  </>
                ) : (
                  <>
                    Learn it. Build it.
                    <br />
                    Now show it.
                  </>
                )}
              </h2>
              <p>
                {isAz
                  ? "Proqramı uğurla tamamla və nailiyyətini Talora sertifikatı ilə təqdim et."
                  : "Complete your program successfully and present your achievement with a Talora certificate."}
              </p>
              <p className="certificate-promo__terms">
                {isAz
                  ? "Sertifikat proqramın şərtlərinə və nəticələrin təsdiqinə bağlıdır. Sertifikat ödənişlidir; məbləğ sifarişdən əvvəl göstərilir."
                  : "Certificates depend on program requirements and approved results. A certificate fee applies; the amount is shown before you order."}
              </p>
              <Link href="/internships" className={cta}>
                {isAz ? "Proqramları kəşf et" : "Discover programs"}
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <div
              className="certificate-paper"
              aria-label={
                isAz
                  ? "Sertifikat dizayn nümunəsi"
                  : "Certificate design sample"
              }
            >
              <b>talora.</b>
              <h3>
                {isAz ? (
                  <>
                    TAMAMLAMA
                    <br />
                    SERTİFİKATI
                  </>
                ) : (
                  <>
                    CERTIFICATE OF
                    <br />
                    COMPLETION
                  </>
                )}
              </h3>
              <p>
                {isAz ? (
                  <>
                    Bilikdən praktikaya.
                    <br />
                    İlk layihədən növbəti mərhələyə.
                  </>
                ) : (
                  <>
                    From knowledge to practice.
                    <br />
                    From your first project to your next chapter.
                  </>
                )}
              </p>
              <span>{isAz ? "DİZAYN NÜMUNƏSİ" : "DESIGN SAMPLE"}</span>
            </div>
          </div>
        </section>
        <section className="landing-section landing-section--surface">
          <div className="content-width">
            <div className="section-heading">
              <p className="eyebrow">
                {isAz ? "AKTİV PROQRAMLAR" : "OPEN PROGRAMS"}
              </p>
              <h2>
                {isAz
                  ? "Növbəti layihən səni gözləyir."
                  : "Find your next project."}
              </h2>
            </div>
            <div className="live-programs" aria-live="polite">
              {loading ? (
                [0, 1, 2, 3].map((i) => (
                  <div className="program-skeleton" key={i}>
                    <span />
                    <span />
                    <span />
                  </div>
                ))
              ) : fetchError ? (
                <p role="status">
                  {isAz
                    ? "Proqramlar hazırda yüklənmədi. Bir az sonra yenidən yoxla."
                    : "Programs could not be loaded. Please try again shortly."}
                </p>
              ) : !internships.length ? (
                <p>
                  {isAz
                    ? "Hazırda açıq proqram yoxdur. Yeni proqramlar burada görünəcək."
                    : "There are no open programs right now. New programs will appear here."}
                </p>
              ) : (
                internships.map((item) => (
                  <Link
                    className="live-program live-program--illustrated"
                    href={"/internships/" + item.id}
                    key={item.id}
                  >
                    <ProgramArtwork title={item.title} category={item.category} sizes="(max-width: 640px) 100vw, 50vw" />
                    <div className="live-program__body"><div>
                      <span className="eyebrow">{item.category}</span>
                      <h3>{item.title}</h3>
                      <p>{item.short_description || item.description}</p>
                    </div>
                    <span className="live-program__meta">
                      <span>
                        <Clock3 size={15} />
                        {item.duration_weeks} {isAz ? "həftə" : "weeks"}
                      </span>
                      <ArrowRight size={20} />
                    </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
        <section className="landing-section content-width">
          <div className="section-heading">
            <p className="eyebrow">
              {isAz ? "SUALLARIN VAR?" : "HAVE A QUESTION?"}
            </p>
            <h2>{isAz ? "Başlamazdan əvvəl." : "Before you get started."}</h2>
          </div>
          <div className="landing-faq">
            <article className="landing-faq__fees">
              <h3>{isAz ? "Sertifikat ödənişlidirmi?" : "Is there a certificate fee?"}</h3>
              <p>{isAz
                ? "Bəli, sertifikatın hazırlanması və verilməsi üçün ayrıca ödəniş tələb olunur. Məbləğ seçdiyiniz proqramdan asılıdır və sifarişdən əvvəl şəxsi kabinetinizdə göstərilir. Sertifikatı proqramın tələb olunan tapşırıqları və nəticələri təsdiqləndikdən sonra sifariş edə bilərsiniz."
                : "Yes. A separate fee applies to certificate preparation and issuance. The amount depends on your program and is displayed in your dashboard before you order. You can order a certificate after the program’s required assignments and results have been approved."}</p>
            </article>
            <article>
              <h3>
                {isAz
                  ? "Proqrama necə qoşula bilərəm?"
                  : "How do I join a program?"}
              </h3>
              <p>
                {isAz
                  ? "Hesab yarat, uyğun proqramın şərtlərini oxu və müraciətini göndər. Müraciətinin statusunu şəxsi kabinetindən izləyə bilərsən."
                  : "Create an account, read the requirements for your chosen program and apply. You can track your application in your dashboard."}
              </p>
            </article>
            <article>
              <h3>
                {isAz
                  ? "Sertifikatı necə əldə edə bilərəm?"
                  : "How do I get a certificate?"}
              </h3>
              <p>
                {isAz
                  ? "Proqramın tələb olunan tapşırıqlarını tamamla. Nəticələrin təsdiqləndikdən sonra, sertifikat verilməsi aktivdirsə, kabinetindən sifariş et. Qiymət ödənişdən əvvəl göstərilir."
                  : "Complete the required assignments. After your results are approved, order a certificate from your dashboard if certification is enabled. The price is shown before payment."}
              </p>
            </article>
          </div>
        </section>
        <section className="landing-section landing-final content-width">
          <h2>
            {isAz ? "İlk addımını bu gün at." : "Take your first step today."}
          </h2>
          <p>
            {isAz
              ? "Növbəti layihən, yeni bacarığın və yeni istiqamətin burada başlayır."
              : "Your next project, new skill and new direction start here."}
          </p>
          <Link href="/internships" className={cta}>
            {isAz ? "Proqramlara bax" : "Explore programs"}
            <ArrowUpRight size={18} />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
