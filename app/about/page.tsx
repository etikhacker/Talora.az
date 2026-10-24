"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageHeading } from "@/components/layout/page-heading";
import { ExperienceArt } from "@/components/landing/experience-art";
import { buttonVariants } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";
export default function AboutPage() {
  const { language } = useLanguage();
  const isAz = language === "az";
  const values = isAz
    ? [
        [
          "Bilik praktikaya çevriləndə dəyər qazanır.",
          "Məqsədimiz tələbələrə real tapşırıqlar üzərində işləmək, rəy almaq və öz portfoliolarını qurmaq üçün aydın yol göstərməkdir.",
        ],
        [
          "Hər yerdən başlamaq mümkündür.",
          "Bakı və region universitetlərində təhsil alan tələbələr maraqlarına uyğun proqramların şərtləri ilə tanış olub müraciət edə bilərlər.",
        ],
        [
          "Nəticəni gördüyün iş göstərir.",
          "Tapşırıqlar, təqdimatlar və qiymətləndirmələr şəxsi kabinetdə izlənir. Sertifikat proqramın tamamlama və ödəniş şərtlərinə əsasən verilir.",
        ],
      ]
    : [
        [
          "Knowledge becomes valuable through practice.",
          "Our goal is to help students work on real assignments, receive feedback and build their own portfolios with a clear path forward.",
        ],
        [
          "You can start from anywhere.",
          "Students from universities in Baku and across Azerbaijan can explore requirements and apply to programs that match their interests.",
        ],
        [
          "Your work shows your progress.",
          "Assignments, submissions and reviews are tracked in your dashboard. Certificates follow each program’s completion and payment requirements.",
        ],
      ];
  return (
    <div>
      <Navbar />
      <main id="main-content" className="public-main content-width">
        <PageHeading
          eyebrow={isAz ? "TALORA HAQQINDA" : "ABOUT TALORA"}
          title={
            isAz
              ? "Bilikdən ilk real layihənə."
              : "From learning to your first real project."
          }
          description={
            isAz
              ? "Talora tələbələr və gənc mütəxəssislər üçün praktiki təcrübə və inkişaf platformasıdır."
              : "Talora is a practical experience and development platform for students and aspiring professionals."
          }
        />
        <div className="public-columns">
          <ExperienceArt isAz={isAz} />
          <div className="public-stack">
            {values.map(([title, copy], i) => (
              <article className="public-panel" key={title}>
                <p className="eyebrow mb-4">0{i + 1}</p>
                <h2>{title}</h2>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
        <section className="public-panel mt-12">
          <h2>
            {isAz
              ? "Birlikdə daha çox imkan yaradaq."
              : "Let’s create more opportunities together."}
          </h2>
          <p className="mb-6">
            {isAz
              ? "Universitet və proqram əməkdaşlıqları üçün bizimlə əlaqə saxla."
              : "Get in touch about university and program partnerships."}
          </p>
          <Link href="/contact" className={buttonVariants({ size: "lg" })}>
            {isAz ? "Əlaqə saxla" : "Contact us"}
            <ArrowUpRight size={18} />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
