'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Info, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import styles from './development-notice.module.css';

export function DevelopmentNotice() {
  const [visible, setVisible] = useState(true);
  const { language } = useLanguage();
  const isAz = language === 'az';

  if (!visible) return null;

  return (
    <aside className={styles.notice} aria-label={isAz ? 'Platforma haqqında bildiriş' : 'Platform notice'}>
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Info className={`mt-0.5 h-5 w-5 shrink-0 ${styles.icon}`} aria-hidden="true" />
        <div role="status" className="min-w-0 flex-1 text-sm leading-6">
          <p className={`font-semibold ${styles.heading}`}>{isAz ? 'Talora inkişaf mərhələsindədir' : 'Talora is still being developed'}</p>
          <p className={styles.copy}>
            {isAz
              ? 'Saytdan istifadə zamanı hər hansı problemlə qarşılaşsanız, bizə bildirməyi unutmayın. Rəyiniz platformanı yaxşılaşdırmağa kömək edir.'
              : 'If you encounter a problem while using the website, please let us know. Your feedback helps us improve the platform.'}{' '}
            <Link href="/contact" className={`inline-block font-semibold underline underline-offset-4 ${styles.link}`}>
              {isAz ? 'Problem bildir' : 'Report a problem'}
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label={isAz ? 'Bildirişi bağla' : 'Dismiss notice'}
          className={`-my-1.5 grid h-11 w-11 shrink-0 place-items-center rounded-lg transition-colors ${styles.close}`}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
