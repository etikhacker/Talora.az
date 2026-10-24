'use client';

import { AuthBrand } from '@/components/layout/auth-brand';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { useLanguage } from '@/lib/i18n/language-context';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { TaloraLogo } from '@/components/layout/talora-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Briefcase,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  Sparkles,
  Users,
} from 'lucide-react';

const REMEMBER_KEY = 'intern-az-remember-email';

/**
 * Only same-origin, in-app destinations are accepted after login.
 * Anything protocol-relative (`//evil.tld`), absolute (`https://evil.tld`),
 * backslash-slashed (`/\evil.tld`) or outside the student area is discarded, so
 * the `?redirect=` parameter cannot be turned into an open redirect.
 */
function safeRedirectPath(raw: string | null): string {
  if (!raw) return '/dashboard';
  if (!raw.startsWith('/dashboard')) return '/dashboard';
  if (raw.startsWith('//') || raw.startsWith('/\\')) return '/dashboard';
  if (/[\r\n\t]/.test(raw)) return '/dashboard';
  return raw;
}

/* ---------------------------------------------------------------------------
 * Left brand panel — shown on desktop. Marketing copy, abstract art and
 * social proof stacked above decorative gradient orbs.
 * ------------------------------------------------------------------------ */
function BrandPanel() { return <AuthBrand />; }

function MobileBrand() { return <AuthBrand mobile />; }

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = safeRedirectPath(searchParams.get('redirect'));
  const { signIn } = useAuth();
  const { t } = useLanguage();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  // Middleware sends visitors here with a reason instead of dropping them on a
  // blank redirect, so a blocked /admin or /dashboard URL always explains itself.
  const notice = (() => {
    const reason = searchParams.get('reason');
    const denied = searchParams.get('denied');
    if (denied === 'admin') return t('authNoticeAdmin');
    if (reason === 'setup') return t('authNoticeSetup');
    if (reason === 'unavailable') return t('authNoticeUnavailable');
    if (searchParams.get('redirect')) return t('authNoticeRedirect');
    return null;
  })();

  // Restore remembered email on mount (client-only via typeof guard).
  // setState-in-effect here is intentional — the entire purpose is to
  // hydrate local state from external (localStorage) on mount.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData((prev) => ({ ...prev, email: saved }));
      }
    } catch {
      /* localStorage may be unavailable — non-fatal */
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Persist (or clear) remembered email based on user preference.
    try {
      if (remember) {
        window.localStorage.setItem(REMEMBER_KEY, result.data.email);
      } else {
        window.localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      /* localStorage may be unavailable — non-fatal */
    }

    setIsSubmitting(true);

    try {
      const res = await signIn({
        email: result.data.email,
        password: result.data.password,
      });

      if (!res.success) {
        // Never surface the provider's raw message ("Email not confirmed",
        // "User already registered", ...): it confirms which addresses exist
        // on the platform. One generic message for every failure.
        setServerError(t('authErrorCredentials'));
        setIsSubmitting(false);
        return;
      }

      if (res.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace(redirectPath);
      }
    } catch {
      setServerError(t('generalError'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex w-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 sm:px-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-emerald-600"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all group-hover:-translate-x-0.5 group-hover:border-emerald-300 group-hover:text-emerald-600">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>{t('authBackHome')}</span>
        </Link>
        <div className="flex items-center gap-2"><ThemeToggle /><LanguageSwitcher /></div>
      </div>

      {/* Form area — this is the only scrolling region on desktop */}
      <div className="auth-login-scroll flex flex-1 items-center px-6 py-8 sm:px-10 sm:py-10 lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          {/* Heading */}
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t('authLoginBadge')}
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              {t('authLoginTitle')}
            </h1>
            <p className="text-sm leading-relaxed text-slate-500">
              {t('authLoginSubtitle')}
            </p>
          </div>

          {/* Server error */}
          {serverError && (
            <Alert
              variant="destructive"
              className="mt-6 text-xs"
            >
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* Route guard notice (blocked /admin, /dashboard, setup, etc.) */}
          {notice && !serverError && (
            <Alert variant="warning" className="mt-6 text-xs">
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                {t('authEmail')}
              </Label>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400 transition-colors group-focus-within:text-emerald-600">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </div>
                <Input
                  id="email"
                  name="email"
                      autoComplete="email"
                  type="email"
                  placeholder="telebe@universitet.edu.az"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  {t('authPassword')}
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  {t('authForgotPassword')}
                </Link>
              </div>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400 transition-colors group-focus-within:text-emerald-600">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                </div>
                <Input
                  id="password"
                  name="password"
                      autoComplete="current-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-700"
                  aria-label={showPassword ? t('authHidePassword') : t('authShowPassword')}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember me */}
            <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-700">
              <span className="relative inline-flex">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 bg-white transition-all checked:border-emerald-600 checked:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                />
                <Check
                  className="pointer-events-none absolute left-0 top-0 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                  strokeWidth={3}
                  aria-hidden="true"
                />
              </span>
              <span className="text-xs font-medium">{t('authRememberMe')}</span>
            </label>

            {/* Submit */}
            <Button
              type="submit"
              id="login-submit-btn"
              disabled={isSubmitting}
              className="group h-12 w-full gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-700/30"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {t('authSigningIn')}
                </>
              ) : (
                <>
                  {t('authSignIn')}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </>
              )}
            </Button>
          </form>

          {/* Footer link */}
          <p className="mt-8 text-center text-xs text-slate-500">
            {t('authNoAccount')}{' '}
            <Link
              href="/register"
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              {t('authFreeRegister')}
            </Link>
          </p>
        </div>
      </div>

      {/* Bottom bar — copyright */}
      <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 text-center text-[11px] text-slate-500 sm:px-10">
        © {new Date().getFullYear()} Talora · {t('authFooter')}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Page wrapper.
 * ------------------------------------------------------------------------ */
export default function LoginPage() {
  const { t } = useLanguage();

  return (
    <div className="auth-login-page flex min-h-[100dvh] w-full flex-col overflow-x-clip bg-white">
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] w-full items-center justify-center text-sm text-slate-500">
            <Loader2
              className="mr-2 h-5 w-5 animate-spin text-emerald-600"
              aria-hidden="true"
            />
            {t('authLoadingLogin')}
          </div>
        }
      >
        <BrandPanel />
        <div className="auth-login-panel flex w-full min-w-0 flex-col">
          <MobileBrand />
          <LoginForm />
        </div>
      </Suspense>
    </div>
  );
}
