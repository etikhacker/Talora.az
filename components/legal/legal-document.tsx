'use client';

import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { useLanguage } from '@/lib/i18n/language-context';

type LegalDocumentKind = 'terms' | 'privacy';

const documents = {
  terms: {
    az: {
      title: 'İstifadə qaydaları',
      intro: 'Talora hesabı yaratmaqla platformadan dürüst, təhlükəsiz və digər istifadəçilərin hüquqlarına hörmətlə istifadə etməyə razılaşırsınız.',
      sections: [
        ['Hesab və məlumatlar', 'Qeydiyyat zamanı düzgün e-poçt, ad və profil məlumatları təqdim edin. Hesabınıza giriş məlumatlarını məxfi saxlayın və hesabınızdan edilən fəaliyyəti izləyin.'],
        ['Təcrübə proqramları və tapşırıqlar', 'Proqramların müddəti, tapşırıqları, son tarixləri və uyğunluq şərtləri hər elanda göstərilir. Müraciət göndərilməsi qəbul olunmağa zəmanət vermir. Tapşırıqları öz əməyinizlə yerinə yetirin və təqdimatlarda düzgün məlumat verin.'],
        ['Sertifikatlar və ödənişlər', 'Sertifikat və ödənişlə bağlı şərtlər müvafiq proqram və sifariş səhifəsində göstərilən qaydalarla müəyyən olunur. Sertifikat yalnız platformada göstərilən tamamlanma və təsdiq meyarları yerinə yetirildikdə təqdim edilir.'],
        ['Platformadan düzgün istifadə', 'Platformanın təhlükəsizliyinə müdaxilə etmək, başqasının hesabına daxil olmaq, saxta müraciət və ya təqdimat göndərmək, yaxud xidmətin işinə mane olmaq qadağandır.'],
        ['Dəyişikliklər və əlaqə', 'Elan və proqram təfərrüatları yenilənə bilər. Bu qaydalarla bağlı sualınız varsa, bizimlə əlaqə səhifəsi vasitəsilə yazın.'],
      ],
    },
    en: {
      title: 'Terms of Use',
      intro: 'By creating a Talora account, you agree to use the platform honestly, safely, and with respect for other users.',
      sections: [
        ['Accounts and information', 'Provide accurate email, name, and profile information when registering. Keep your sign-in details private and review activity on your account.'],
        ['Internships and assignments', 'Program duration, assignments, deadlines, and eligibility are described in each listing. Applying does not guarantee acceptance. Complete assignments yourself and provide accurate information.'],
        ['Certificates and payments', 'Certificate and payment terms are described on the relevant program or order page. A certificate is issued only after the completion and review criteria shown on the platform are met.'],
        ['Acceptable use', 'You may not compromise platform security, access another person’s account, submit fraudulent applications or work, or disrupt the service.'],
        ['Changes and contact', 'Listing and program details may change. Contact us through the contact page if you have questions about these terms.'],
      ],
    },
  },
  privacy: {
    az: {
      title: 'Məxfilik siyasəti',
      intro: 'Talora hesabınızı və platforma müraciətlərinizi idarə etmək üçün təqdim etdiyiniz məlumatlardan istifadə edir.',
      sections: [
        ['Toplanan məlumatlar', 'Qeydiyyat və profildə ad, e-poçt, universitet, telefon və sizin əlavə etdiyiniz məlumatlar saxlanıla bilər. Müraciətlər, proqram irəliləyişi, tapşırıq təqdimatları və sertifikat sifarişləri ilə bağlı məlumatlar da hesabınıza bağlanır.'],
        ['İstifadə məqsədi', 'Məlumatlar giriş və hesabın idarəsi, müraciətlərin işlənməsi, proqramların təqdim edilməsi, mentor rəyləri, sertifikatların yoxlanması və platforma dəstəyi üçün istifadə olunur.'],
        ['Məlumatlara çıxış', 'Məlumatlarınıza yalnız platformanın işləməsi üçün lazım olan xidmətlər və səlahiyyətli əməliyyat heyəti çıxış edə bilər. Şifrəniz Talora tərəfindən oxunmur; giriş provayderinin təhlükəsiz autentifikasiya sistemi ilə idarə olunur.'],
        ['Saxlanma və sorğular', 'Məlumatlar hesab və platforma xidmətləri üçün tələb olunduğu müddətdə saxlanır. Məlumatlarınızla bağlı müraciət və suallar üçün əlaqə səhifəsindən bizə yazın.'],
      ],
    },
    en: {
      title: 'Privacy Policy',
      intro: 'Talora uses information you provide to manage your account and your activity on the platform.',
      sections: [
        ['Information collected', 'Your name, email, university, phone number, and other details you add to your profile may be stored. Applications, program progress, assignment submissions, and certificate orders are associated with your account.'],
        ['How information is used', 'Information supports sign-in and account management, application processing, program delivery, mentor feedback, certificate verification, and platform support.'],
        ['Access to information', 'Information is available only to the services needed to operate the platform and authorized operational staff. Talora cannot read your password; sign-in is managed by the authentication provider’s secure system.'],
        ['Retention and requests', 'Information is retained while needed for account and platform services. Contact us through the contact page with questions or requests about your information.'],
      ],
    },
  },
} satisfies Record<LegalDocumentKind, Record<'az' | 'en', { title: string; intro: string; sections: [string, string][] }>>;

export function LegalDocument({ kind }: { kind: LegalDocumentKind }) {
  const { language } = useLanguage();
  const isAz = language === 'az';
  const document = documents[kind][isAz ? 'az' : 'en'];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--page)] text-[var(--ink)]">
      <Navbar />
      <main className="flex-1 px-4 py-14 sm:px-6 lg:py-20">
        <article className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[.12em] text-blue-700 dark:text-blue-300">Talora</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{document.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">{document.intro}</p>
          <div className="mt-10 divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-700 dark:border-slate-700">
            {document.sections.map(([title, content]) => (
              <section key={title} className="py-6">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{content}</p>
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
