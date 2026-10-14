'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { SOLE_ADMIN_EMAIL } from '@/lib/auth/admin';
// SOLE_ADMIN_EMAIL is intentionally never rendered: printing the administrator
// address in the markup (placeholder, aria-label, or any DOM text) hands every
// visitor the one account worth attacking. It is only used for the local
// allow-list comparison below.

/* Failed-attempt throttle.
 * Per-browser, session-scoped: 5 failures -> 5 minutes of no auth calls.
 * sessionStorage is intentionally used so a lockout never follows the user to
 * another tab/browser, and it dies when the tab closes. */
const ATTEMPT_KEY = 'intern-az-admin-login-attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

type AttemptState = { count: number; firstAt: number; lockedUntil: number };

function readAttempts(): AttemptState {
  if (typeof window === 'undefined') return { count: 0, firstAt: 0, lockedUntil: 0 };
  try {
    const raw = window.sessionStorage.getItem(ATTEMPT_KEY);
    if (!raw) return { count: 0, firstAt: 0, lockedUntil: 0 };
    const parsed = JSON.parse(raw) as AttemptState;
    if (typeof parsed?.count !== 'number') return { count: 0, firstAt: 0, lockedUntil: 0 };
    if (Date.now() > parsed.lockedUntil + LOCKOUT_MS) {
      window.sessionStorage.removeItem(ATTEMPT_KEY);
      return { count: 0, firstAt: 0, lockedUntil: 0 };
    }
    return parsed;
  } catch {
    return { count: 0, firstAt: 0, lockedUntil: 0 };
  }
}

function BrandPanel() {
  return (
    <div className="auth-login-brand relative hidden overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 text-white lg:flex lg:flex-col lg:justify-between lg:gap-8 lg:p-12 xl:p-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-amber-300/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-orange-300/30 blur-3xl"
      />

      <Link href="/" className="relative z-10 inline-flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-lg shadow-amber-900/20">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-lg font-bold tracking-tight">Intern.az Admin</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-amber-50/80">
            Administrator Portal
          </p>
        </div>
      </Link>

      <div className="relative z-10 max-w-md space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Məhdud giriş
        </div>
        <h2 className="text-4xl font-black leading-[1.05] tracking-tight xl:text-5xl">
          Yalnız{' '}
          <span className="bg-gradient-to-r from-white via-amber-100 to-orange-100 bg-clip-text text-transparent">
            səlahiyyətli
          </span>{' '}
          administratorlar.
        </h2>
        <p className="text-base leading-relaxed text-amber-50/90">
          Platform nəzarətçiləri, tapşırıq koordinatorları və sertifikat
          verifikatorları üçün məhdud giriş sahəsi.
        </p>
        <ul className="space-y-2.5 pt-2 text-sm text-amber-50/90">
          <li className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
              <Check className="h-3 w-3" aria-hidden="true" />
            </span>
            Giriş yalnız təsdiqlənmiş admin hesabı üçün mümkündür
          </li>
          <li className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
              <Check className="h-3 w-3" aria-hidden="true" />
            </span>
            Hər admin səhifəsi server tərəfdə yenidən yoxlanılır
          </li>
          <li className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
              <Check className="h-3 w-3" aria-hidden="true" />
            </span>
            Uğursuz cəhdlərdən sonra müvəqqəti bloklama tətbiq olunur
          </li>
        </ul>

        {/* Session policy chip — in normal flow, so it can never overlap the
            headline or the copyright on short screens. */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-50/80">
              Sessiya siyasəti
            </p>
            <p className="text-xs font-bold leading-tight">
              Cəhdlər jurnalın yazılır · IP maskalanır
            </p>
          </div>
        </div>
      </div>

      <p className="relative z-10 text-[10px] uppercase tracking-[0.18em] text-amber-50/70">
        © {new Date().getFullYear()} Intern.az — Administrator Console
      </p>
    </div>
  );
}

function MobileBrand() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 px-6 py-7 text-white lg:hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-amber-300/40 blur-3xl"
      />
      <Link href="/" className="relative z-10 inline-flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-700 shadow-lg shadow-amber-900/20">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-lg font-bold tracking-tight">Intern.az Admin</p>
          <p className="text-[9px] uppercase tracking-[0.18em] text-amber-50/80">
            Administrator Portal
          </p>
        </div>
      </Link>
      <h2 className="relative z-10 mt-5 text-2xl font-black leading-tight">
        Yalnız səlahiyyətli administratorlar.
      </h2>
    </div>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, signOut } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Read the lockout state lazily during the first render instead of in an
  // effect: sessionStorage is an external store read once, not a subscription,
  // and a synchronous setState in an effect causes a cascading render.
  const [lockedUntil, setLockedUntil] = useState(() => readAttempts().lockedUntil);

  const registerFailedAttempt = useCallback(() => {
    try {
      const now = Date.now();
      const prev = readAttempts();
      const base = now - prev.firstAt > LOCKOUT_MS ? { count: 0, firstAt: now } : prev;
      const next: AttemptState = {
        firstAt: base.firstAt,
        count: base.count + 1,
        lockedUntil:
          base.count + 1 >= MAX_ATTEMPTS ? now + LOCKOUT_MS : prev.lockedUntil,
      };
      window.sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(next));
      setLockedUntil(next.lockedUntil);
    } catch {
      /* sessionStorage unavailable — throttle is best-effort */
    }
  }, []);

  const clearFailedAttempts = useCallback(() => {
    try {
      window.sessionStorage.removeItem(ATTEMPT_KEY);
    } catch {
      /* non-fatal */
    }
    setLockedUntil(0);
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

    // Cheap local throttle: repeated failures from this browser stop being
    // forwarded to the auth provider. The real gate is server-side (middleware
    // re-verifies the session on every /admin request) — this only raises the
    // cost of online guessing.
    if (lockedUntil > Date.now()) {
      setServerError(
        `Çox sayda uğursuz cəhd. ${Math.ceil(
          (lockedUntil - Date.now()) / 60000
        )} dəqiqə sonra yenidən yoxlayın.`
      );
      return;
    }

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

    const email = result.data.email.trim().toLowerCase();

    // Do not reveal that a specific address is the administrator account, and
    // do not spend an auth round-trip on a non-admin address.
    if (email !== SOLE_ADMIN_EMAIL.toLowerCase()) {
      setErrors({
        email: 'Bu ünvan administrator hesabına aid deyil.',
      });
      registerFailedAttempt();
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await signIn({ email, password: result.data.password });

      if (!res.success) {
        registerFailedAttempt();
        setServerError(
          'Giriş rədd edildi. E-poçt və ya şifrə yanlışdır.'
        );
        setIsSubmitting(false);
        return;
      }

      if (res.role !== 'admin') {
        setServerError(
          'Giriş rədd edildi. Bu hesab üçün administrator səlahiyyəti yoxdur.'
        );
        setIsSubmitting(false);
        // Drop the student session so it cannot linger in this browser.
        void signOut();
        router.push('/dashboard');
        return;
      }

      clearFailedAttempts();
      router.replace('/admin');
    } catch {
      registerFailedAttempt();
      setServerError('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
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
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sm:px-10">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-amber-600"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all group-hover:-translate-x-0.5 group-hover:border-amber-300 group-hover:text-amber-600">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>Ana səhifə</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              Tələbə girişi
            </Link>
          </div>

          {/* Form — the only scrolling region on desktop */}
          <div className="auth-login-scroll flex flex-1 items-center px-6 py-8 sm:px-10 sm:py-10 lg:px-14 xl:px-20">
            <div className="mx-auto w-full max-w-md">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Administrator girişi
                </span>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Admin konsol.
                </h1>
                <p className="text-sm leading-relaxed text-slate-500">
                  Yalnız səlahiyyətli administrator hesabı ilə daxil ola
                  bilərsiniz. Bütün giriş cəhdləri qeydə alınır.
                </p>
              </div>

              {serverError && (
                <Alert
                  variant="destructive"
                  className="mt-6 text-xs"
                >
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
                noValidate
              >
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Administrator e-poçtu
                  </Label>
                  <div className="group relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400 transition-colors group-focus-within:text-amber-600">
                      <Mail className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin hesabının e-poçt ünvanı"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Administrator şifrəsi
                  </Label>
                  <div className="group relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400 transition-colors group-focus-within:text-amber-600">
                      <Lock className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-700"
                      aria-label={
                        showPassword ? 'Şifrəni gizlət' : 'Şifrəni göstər'
                      }
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

                <Button
                  type="submit"
                  id="admin-login-submit-btn"
                  disabled={isSubmitting}
                  className="group h-12 w-full gap-2 rounded-xl bg-amber-500 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 hover:bg-amber-600 hover:shadow-amber-600/30"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Yoxlanılır...
                    </>
                  ) : (
                    <>
                      Admin konsola daxil ol
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700"
                  aria-hidden="true"
                />
                <p className="leading-relaxed">
                  Bu sahifəyə giriş cəhdləri qeydə alınır. Səlahiyyətiniz
                  yoxdursa, hesabınız müvəqqəti olaraq bloklana bilər.
                </p>
              </div>

              <p className="mt-6 text-center text-xs text-slate-500">
                Tələbə hesabı ilə daxil olursan?{' '}
                <Link
                  href="/login"
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Tələbə girişi
                </Link>
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 text-center text-[11px] text-slate-500 sm:px-10">
            © {new Date().getFullYear()} Intern.az · Administrator Console
          </div>
        </div>
      </div>
    </div>
  );
}
