import Image from "next/image";

/** Exact artwork exported from the approved Talora Figma design. */
export function ExperienceArt({
  isAz = true,
  compact = false,
}: {
  isAz?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`experience-art${compact ? " experience-art--compact" : ""}`}
      aria-hidden="true"
    >
      <Image
        src="/design/experience-stairs.svg"
        alt=""
        width={550}
        height={530}
        priority={!compact}
      />
      <div className="experience-art__milestone">
        <span>
          {isAz ? "HƏR TAPŞIRIQ BİR ADDIMDIR" : "EVERY ASSIGNMENT IS A STEP"}
        </span>
        <strong>
          {isAz ? "Bilik → Bacarıq → Nəticə" : "Knowledge → Skill → Outcome"}
        </strong>
      </div>
      <div className="experience-art__result">
        <span>{isAz ? "SƏNİN NÖVBƏTİ ADDIMIN" : "YOUR NEXT STEP"}</span>
        <strong>
          {isAz ? "İlk real layihən." : "Your first real project."}
        </strong>
      </div>
    </div>
  );
}
