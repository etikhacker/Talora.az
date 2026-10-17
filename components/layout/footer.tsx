'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/language-context';
import { Globe, Mail, ArrowUpRight } from 'lucide-react';

export function Footer() {
  const { language, t } = useLanguage();
  const isAz = language === 'az';

  return (
    <footer className="w-full border-t border-slate-200 bg-white text-slate-600 transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Talora">
              <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-md bg-blue-600 font-serif text-lg font-semibold italic text-white">t</span>
              <span className="font-serif text-2xl font-semibold tracking-tight text-slate-900">Talora</span>
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-slate-500">
              {isAz
                ? 'Tələbələr və gənc mütəxəssislər üçün beynəlxalq təcrübə proqramları, real layihələr və rəsmi sertifikatlaşdırma platforması.'
                : 'An international platform connecting aspiring professionals with internship opportunities to gain practical experience, develop skills, and shape their careers.'}
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
              <Globe className="h-3.5 w-3.5 text-blue-600" />
              <span>{isAz ? 'Qlobal Təcrübə Şəbəkəsi' : 'Global Internship Network'}</span>
            </div>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3.5">
              {isAz ? 'Platforma' : 'Platform'}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/internships" className="hover:text-blue-600 transition-colors">
                  {isAz ? 'Təcrübələr' : 'Explore Internships'}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-blue-600 transition-colors">
                  {isAz ? 'Necə işləyir?' : 'How It Works'}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-600 transition-colors">
                  {isAz ? 'Haqqımızda' : 'About Talora'}
                </Link>
              </li>
              <li>
                <Link href="/contact?type=employer" className="hover:text-blue-600 transition-colors inline-flex items-center gap-1">
                  <span>{isAz ? 'Şirkətlər üçün' : 'For Companies'}</span>
                  <ArrowUpRight className="h-3 w-3 text-slate-400" />
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-600 transition-colors">
                  {isAz ? 'Əlaqə & Dəstək' : 'Contact & Support'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Student Access & Portal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3.5">
              {isAz ? 'Tələbələr və İştirakçılar' : 'Students & Candidates'}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/register" className="hover:text-blue-600 transition-colors">
                  {isAz ? 'Qeydiyyatdan keç' : 'Create Account'}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-blue-600 transition-colors">
                  {isAz ? 'Daxil ol' : 'Sign In'}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                  {isAz ? 'Tələbə Portalı' : 'Student Portal'}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-600 transition-colors inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-blue-600" />
                  <span>{isAz ? 'Kömək mərkəzi' : 'Help & Inquiries'}</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Talora. {isAz ? 'Bütün hüquqlar qorunur.' : 'All rights reserved.'}</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Link href="/about" className="hover:text-slate-900 transition-colors">
              {t('privacy')}
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/about" className="hover:text-slate-900 transition-colors">
              {t('terms')}
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/admin/login" className="hover:text-slate-900 transition-colors">
              {isAz ? 'İnzibatçı' : 'Admin'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
