'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { registerSchema, RegisterFormData } from '@/lib/validations/auth';
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
  Star,
  University,
  User,
  Users,
} from 'lucide-react';

/* ---------------------------------------------------------------------------
 * Brand panel — same gradient identity as login.
 * ------------------------------------------------------------------------ */
function BrandPanel() {
  const { t } = useLanguage();

  return (
    <div className="auth-login-brand relative hidden overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-300/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-cyan-300/30 blur-3xl"
      />

      <TaloraLogo inverted className="relative z-10" />

      <div className="relative z-10 max-w-md space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {t('authRegisterBadge')}
        </div>
        <h2 className="text-4xl font-black leading-[1.05] tracking-tight xl:text-5xl">
          {t('authRegisterHeadline')}
        </h2>
        <p className="text-base leading-relaxed text-emerald-50/90">
          {t('authRegisterSubline')}
        </p>
        <ul className="space-y-2.5 pt-2 text-sm text-emerald-50/90">
          {[
            t('authRegisterBullet1'),
            t('authRegisterBullet2'),
            t('authRegisterBullet3'),
          ].map((bullet) => (
            <li key={bullet} className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
          <Users className="h-4 w-4 text-emerald-50" aria-hidden="true" />
          <p className="mt-3 text-2xl font-black tracking-tight">8</p>
          <p className="text-[10px] uppercase tracking-wider text-emerald-50/80">
            {t('authStatPrograms')}
          </p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
          <Briefcase className="h-4 w-4 text-amber-200" aria-hidden="true" />
          <p className="mt-3 text-2xl font-black tracking-tight">80</p>
          <p className="text-[10px] uppercase tracking-wider text-emerald-50/80">
            {t('authStatTasks')}
          </p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
          <Award className="h-4 w-4 text-cyan-200" aria-hidden="true" />
          <p className="mt-3 text-2xl font-black tracking-tight">8</p>
          <p className="text-[10px] uppercase tracking-wider text-emerald-50/80">
            {t('authStatWeeks')}
          </p>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-60 right-6 hidden -rotate-3 rounded-2xl border border-white/20 bg-white/95 p-4 text-slate-900 opacity-95 shadow-2xl shadow-emerald-900/30 backdrop-blur-md 2xl:block"
      >
        <div className="flex items-center gap-1 text-amber-500">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-current" />
          ))}
        </div>
        <p className="mt-2 max-w-[13rem] text-xs font-medium leading-snug">
          &ldquo;{t('authQuote')}&rdquo;
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
            RA
          </div>
          <div>
            <p className="text-[11px] font-bold">{t('authQuoteAuthor')}</p>
            <p className="text-[9px] text-slate-500">{t('authQuoteMeta')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileBrand() {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-6 py-7 text-white lg:hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-emerald-300/40 blur-3xl"
      />
      <TaloraLogo inverted compact className="relative z-10" />
      <h2 className="relative z-10 mt-5 text-2xl font-black leading-tight">
        {t('authRegisterHeadline')}
      </h2>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  type,
  placeholder,
  icon: Icon,
  value,
  onChange,
  disabled,
  error,
  trailing,
}: {
  id: string;
  name: string;
  label: string;
  type: string;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wider text-slate-700"
      >
        {label}
      </Label>
      <div className="group relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400 transition-colors group-focus-within:text-emerald-600">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <Input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          required
        />
        {trailing}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { t } = useLanguage();

  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    password: '',
    university: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);

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

    if (!agree) {
      setServerError(t('authErrorAgree'));
      return;
    }

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await signUp({
        fullName: result.data.fullName,
        email: result.data.email,
        password: result.data.password,
        university: result.data.university,
      });

      if (!res.success) {
        setServerError(res.error || t('authErrorRegister'));
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      if (res.requiresEmailConfirmation) {
        setNeedsEmailConfirmation(true);
        setIsSubmitting(false);
        return;
      }
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch {
      setServerError(t('generalError'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-login-page flex min-h-[100dvh] w-full flex-col overflow-x-clip bg-white">
      <BrandPanel />
      <div className="auth-login-panel flex w-full min-w-0 flex-col">
        <MobileBrand />

        <div className="relative flex w-full flex-1 flex-col bg-white">
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
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <Link
                href="/login"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                {t('authSignIn')}
              </Link>
            </div>
          </div>

          {/* Form — the only scrolling region on desktop, so the brand panel,
              the top bar and the copyright stay put on short screens. */}
          <div className="auth-login-scroll flex flex-1 items-start px-6 py-8 sm:px-10 sm:py-10 lg:px-14 xl:px-20">
            <div className="mx-auto w-full max-w-md">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {t('authRegisterFormBadge')}
                </span>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  {t('authRegisterTitle')}
                </h1>
                <p className="text-sm leading-relaxed text-slate-500">
                  {t('authRegisterSubtitle')}
                </p>
              </div>

              {serverError && (
                <Alert variant="destructive" className="mt-6 text-xs">
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mt-6 border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
                  <AlertDescription>{t(needsEmailConfirmation ? 'authRegisterConfirmEmail' : 'authRegisterSuccess')}</AlertDescription>
                </Alert>
              )}

              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
                noValidate
              >
                <Field
                  id="fullName"
                  name="fullName"
                  label={t('authFullName')}
                  type="text"
                  placeholder={t('authFullNamePlaceholder')}
                  icon={User}
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isSubmitting || success}
                  error={errors.fullName}
                />

                <Field
                  id="university"
                  name="university"
                  label={t('authUniversity')}
                  type="text"
                  placeholder={t('authUniversityPlaceholder')}
                  icon={University}
                  value={formData.university}
                  onChange={handleChange}
                  disabled={isSubmitting || success}
                  error={errors.university}
                />

                <Field
                  id="email"
                  name="email"
                  label={t('authEmail')}
                  type="email"
                  placeholder="ad.soyad@universitet.edu.az"
                  icon={Mail}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting || success}
                  error={errors.email}
                />

                <div role="note" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p className="leading-relaxed">{t('emailSpamFolderNotice')}</p>
                </div>

                <Field
                  id="password"
                  name="password"
                  label={t('authPasswordMin')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={Lock}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting || success}
                  error={errors.password}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-700"
                      aria-label={
                        showPassword ? t('authHidePassword') : t('authShowPassword')
                      }
                    >
                      {showPassword ? (
                        <EyeOff
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      ) : (
                        <Eye
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  }
                />

                <label className="flex cursor-pointer select-none items-start gap-2.5 text-xs text-slate-600">
                  <span className="relative mt-0.5 inline-flex">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      disabled={isSubmitting || success}
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 bg-white transition-all checked:border-emerald-600 checked:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                    />
                    <Check
                      className="pointer-events-none absolute left-0 top-0 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                      strokeWidth={3}
                      aria-hidden="true"
                    />
                  </span>
                  <span>
                    <Link
                      href="/terms"
                      className="font-semibold text-emerald-600 hover:underline"
                    >
                      {t('authTerms')}
                    </Link>{' '}
                    <span className="sr-only">,</span>
                    <Link
                      href="/privacy"
                      className="font-semibold text-emerald-600 hover:underline"
                    >
                      {t('authPrivacy')}
                    </Link>{' '}
                    {t('authAgreeSuffix')}
                  </span>
                </label>

                <Button
                  type="submit"
                  id="register-submit-btn"
                  disabled={isSubmitting || success}
                  className="group h-12 w-full gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-700/30"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      {t('authCreating')}
                    </>
                  ) : (
                    <>
                      {t('authCreateAccount')}
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-8 text-center text-xs text-slate-500">
                {t('authHaveAccount')}{' '}
                <Link
                  href="/login"
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  {t('authSignIn')}
                </Link>
              </p>

            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 text-center text-[11px] text-slate-500 sm:px-10">
            © {new Date().getFullYear()} Talora · {t('authFooter')}
          </div>
        </div>
      </div>
    </div>
  );
}
