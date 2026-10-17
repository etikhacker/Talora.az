'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Menu, X, ArrowRight, User, LogOut } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAz = language === 'az';

  const navLinks = [
    { href: '/internships', label: isAz ? 'Təcrübələr' : 'Explore Internships' },
    { href: '/contact?type=employer', label: isAz ? 'Şirkətlər üçün' : 'For Companies' },
    { href: '/how-it-works', label: isAz ? 'Necə işləyir?' : 'How It Works' },
    { href: '/about', label: t('navAbout') },
    { href: '/contact', label: t('navContact') },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Talora text-based wordmark */}
        <Link href="/" className="flex items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
          <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-md bg-blue-600 font-serif text-lg font-semibold italic text-white shadow-sm">t</span>
          <span className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
            Talora
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600" aria-label={isAz ? 'Əsas naviqasiya' : 'Main navigation'}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href.split('?')[0]));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-blue-600 ${
                  isActive ? 'text-blue-600 font-semibold' : ''
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Area: Language Switcher, Theme & Auth Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {/* Clean Segmented Language Control */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-md px-2.5 py-1 transition-all ${
                language === 'en'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('az')}
              className={`rounded-md px-2.5 py-1 transition-all ${
                language === 'az'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              AZ
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-2 pl-1">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-2 border-slate-200 text-slate-800 hover:bg-slate-50">
                  <User className="h-4 w-4 text-blue-600" />
                  {t('navDashboard')}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                aria-label="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-1">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-900 font-medium">
                  {isAz ? 'Daxil ol' : 'Sign In'}
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs font-medium">
                  {isAz ? 'Qeydiyyat' : 'Get Started'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setLanguage(language === 'en' ? 'az' : 'en')}
            className="text-xs font-bold px-2 py-1 rounded border border-slate-200 bg-slate-50 text-slate-700 uppercase"
            aria-label="Switch language"
          >
            {language}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden space-y-4 border-b border-slate-200 bg-white px-4 pb-6 pt-3">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 text-base font-medium transition-colors ${
                  pathname === link.href ? 'text-blue-600 font-semibold' : 'text-slate-700 hover:text-blue-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    {t('navDashboard')}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-center text-slate-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('navLogout')}
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center border-slate-200 text-slate-800">
                    {isAz ? 'Daxil ol' : 'Sign In'}
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="default" className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    {isAz ? 'Qeydiyyat' : 'Get Started'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
