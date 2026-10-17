'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

type ScrollRevealTitleProps = {
  children: ReactNode;
  className?: string;
};

export function ScrollRevealTitle({ children, className }: ScrollRevealTitleProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.h2
      initial={reduceMotion ? false : { opacity: 0, y: 34, rotateX: 20 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.72, ease: [0.2, 0.75, 0.25, 1] }}
      style={{ transformPerspective: 900, transformOrigin: '50% 100%' }}
      className={className}
    >
      {children}
    </motion.h2>
  );
}
