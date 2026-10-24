"use client";

import { useEffect, useRef, type RefObject } from "react";

/** Progressive enhancement: text stays readable without JS or motion support. */
export function useLandingMotion(
  root: RefObject<HTMLDivElement | null>,
  paused: boolean,
) {
  const revealed = useRef(new WeakSet<Element>());
  useEffect(() => {
    const container = root.current;
    if (
      !container ||
      paused ||
      !window.IntersectionObserver ||
      !Element.prototype.animate
    )
      return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    const targets = container.querySelectorAll<HTMLElement>(
      ".landing-hero__copy > *, .section-heading > *, .direction-card, .process-grid > article, .certificate-promo__copy > *, .landing-faq > article, .landing-final > *",
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || revealed.current.has(entry.target))
            continue;
          revealed.current.add(entry.target);
          observer.unobserve(entry.target);
          const element = entry.target as HTMLElement;
          const index = Array.from(
            element.parentElement?.children || [],
          ).indexOf(element);
          const animation = element.animate(
            [
              { opacity: 0, transform: "translateY(22px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 720,
              delay: Math.min(index, 4) * 80,
              easing: "cubic-bezier(.2,.7,.2,1)",
              fill: "backwards",
            },
          );
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        }
      },
      { threshold: 0.08 },
    );
    function syncPreference() {
      observer.disconnect();
      if (preference.matches) {
        animations.forEach((animation) => animation.cancel());
        animations.clear();
      } else {
        targets.forEach((element) => {
          if (!revealed.current.has(element)) observer.observe(element);
        });
      }
    }
    syncPreference();
    preference.addEventListener("change", syncPreference);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", syncPreference);
      animations.forEach((animation) => animation.cancel());
    };
  }, [root, paused]);
}
