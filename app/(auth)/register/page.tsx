'use client';

import { AuthBrand } from '@/components/layout/auth-brand';
import { ThemeToggle } from '@/components/layout/theme-toggle';
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
function BrandPanel() { return <AuthBrand />; }

function MobileBrand() { return <AuthBrand mobile />; }

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
  autoComplete,
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
  autoComplete?: string;
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
          autoComplete={autoComplete}
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
  const { t, language } = useLanguage();

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
              <div className="flex items-center gap-2"><ThemeToggle /><LanguageSwitcher /></div>
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
                      autoComplete="email"
                  label={t('authEmail')}
                  type="email"
                  placeholder="ad.soyad@universitet.edu.az"
                  icon={Mail}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting || success}
                  error={errors.email}
                />

                <div role="note" className="auth-email-note flex items-start gap-2 rounded-xl border p-3 text-xs">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p className="leading-relaxed">{t('emailSpamFolderNotice')}</p>
                </div>

                <Field
                  id="password"
                  name="password"
                      autoComplete="new-password"
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
                    {language === 'en' && 'I agree to the '}
                    <Link
                      href="/terms"
                      className="font-semibold text-emerald-600 hover:underline"
                    >
                      {t('authTerms')}
                    </Link>{' '}
                    {language === 'az' ? 'və ' : 'and '}
                    <Link
                      href="/privacy"
                      className="font-semibold text-emerald-600 hover:underline"
                    >
                      {t('authPrivacy')}
                    </Link>{' '}
                    {language === 'az' ? 'ilə razıyam.' : '.'}
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
