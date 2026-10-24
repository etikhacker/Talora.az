"use client";
import { TaloraLogo } from "./talora-logo";
import { ExperienceArt } from "@/components/landing/experience-art";
import { useLanguage } from "@/lib/i18n/language-context";
export function AuthBrand({
  mobile = false,
  admin = false,
}: {
  mobile?: boolean;
  admin?: boolean;
}) {
  const { language } = useLanguage();
  const isAz = language === "az";
  return (
    <aside className={mobile ? "auth-brand-mobile" : "auth-brand"}>
      <TaloraLogo compact={mobile} />
      {!mobile && (
        <>
          <div className="auth-brand__copy">
            <p className="eyebrow">
              {admin
                ? isAz
                  ? "TALORA İDARƏETMƏSİ"
                  : "TALORA ADMINISTRATION"
                : isAz
                  ? "BİLİKDƏN PRAKTİKAYA"
                  : "FROM KNOWLEDGE TO PRACTICE"}
            </p>
            <h2>
              {admin ? (
                isAz ? (
                  <>
                    Təcrübəni birlikdə
                    <br />
                    <em>daha yaxşı edək.</em>
                  </>
                ) : (
                  <>
                    Make experience
                    <br />
                    <em>better, together.</em>
                  </>
                )
              ) : isAz ? (
                <>
                  Növbəti addımın
                  <br />
                  <em>buradan başlayır.</em>
                </>
              ) : (
                <>
                  Your next step
                  <br />
                  <em>starts here.</em>
                </>
              )}
            </h2>
            <p>
              {admin
                ? isAz
                  ? "Proqramları, müraciətləri və tələbələrin irəliləyişini bir yerdən idarə et."
                  : "Manage programs, applications and student progress in one place."
                : isAz
                  ? "Real tapşırıqlar, faydalı rəy və portfoliona əlavə edəcəyin yeni layihələr."
                  : "Real assignments, useful feedback and new projects for your portfolio."}
            </p>
          </div>
          <ExperienceArt isAz={isAz} compact />
          <p className="auth-brand__note">
            {isAz
              ? "Təcrübə ilə böyü. Öz yolunu qur."
              : "Grow through experience. Find your own path."}
          </p>
        </>
      )}
    </aside>
  );
}
