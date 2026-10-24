"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageHeading } from "@/components/layout/page-heading";
import { buttonVariants } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";
export default function HowItWorksPage() {
  const { language } = useLanguage();
  const isAz = language === "az";
  const steps = isAz
    ? [
        [
          "Hesabını yarat.",
          "Adını, e-poçtunu və təhsil məlumatlarını əlavə et. Şəxsi kabinetin müraciətlərini və proqram üzrə irəliləyişini izlədiyin yer olacaq.",
        ],
        [
          "Proqramını seç və müraciət et.",
          "İstiqamət, səviyyə və müddətə görə proqramları araşdır. Şərtləri oxu və müraciətini göndər. Statusunu “Müraciətlərim” bölməsində izlə.",
        ],
        [
          "Tapşırıqları tamamla, rəy al.",
          "Qəbul olunduğun proqramın həftəlik tapşırıqlarını aç. Təlimata uyğun işlə, tələb olunan formatda həllini göndər və koordinatorun rəyinə əsasən düzəliş et.",
        ],
        [
          "Nəticələrini təqdim et.",
          "Tələb olunan işlər təsdiqləndikdən sonra, proqramda sertifikat verilməsi aktivdirsə, kabinetindən sifariş yarada bilərsən. Sertifikat ödənişlidir; məbləğ və ödəniş məlumatları əvvəlcədən göstərilir.",
        ],
      ]
    : [
        [
          "Create your account.",
          "Add your name, email and education details. Your dashboard is where you follow applications and progress through your program.",
        ],
        [
          "Choose a program and apply.",
          "Explore programs by track, level and duration. Read the requirements and submit your application. Follow its status in My applications.",
        ],
        [
          "Complete assignments and get feedback.",
          "Open the weekly assignments for your accepted program. Follow the instructions, submit in the required format and improve your work using coordinator feedback.",
        ],
        [
          "Present your results.",
          "Once the required work is approved, you can place an order from your dashboard if certification is enabled. A certificate fee applies; the amount and payment details are displayed first.",
        ],
      ];
  return (
    <div>
      <Navbar />
      <main id="main-content" className="public-main content-width">
        <PageHeading
          eyebrow={isAz ? "ADDIM-ADDIM İNKİŞAF" : "PROGRESS, STEP BY STEP"}
          title={
            isAz
              ? "Başlamaq düşündüyündən sadədir."
              : "Getting started is simpler than you think."
          }
          description={
            isAz
              ? "İlk müraciətdən tamamladığın layihəyə qədər bütün yol bir platformada."
              : "From your first application to a completed project, follow your journey in one place."
          }
        />
        <div className="public-stack">
          {steps.map(([title, copy], i) => (
            <article className="public-step" key={title}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2>{title}</h2>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/internships" className={buttonVariants({ size: "lg" })}>
            {isAz ? "Proqramlara bax" : "Explore programs"}
            <ArrowUpRight size={18} />
          </Link>
          <Link
            href="/register"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            {isAz ? "Hesab yarat" : "Create account"}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
