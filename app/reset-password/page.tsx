'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TaloraLogo } from '@/components/layout/talora-logo';
import { useLanguage } from '@/lib/i18n/language-context';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { AuthChangeEvent, AuthError, Session } from '@supabase/supabase-js';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isAz = language === 'az';
  const isConfigured = isSupabaseConfigured();
  const [ready, setReady] = useState(!isConfigured);
  const [hasSession, setHasSession] = useState(false);
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!active) return;
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        setHasSession(true);
        setError('');
        setReady(true);
      }
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }: { data: { session: Session | null }; error: AuthError | null }) => {
      if (!active) return;
      const url = new URL(window.location.href);
      const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
      const errorCode = url.searchParams.get('error_code') || fragment.get('error_code');
      const linkError = url.searchParams.get('error') || fragment.get('error');
      const errorDescription = url.searchParams.get('error_description') || fragment.get('error_description');
      if (sessionError || linkError || errorDescription) {
        const isExpired = errorCode === 'otp_expired' || /expired|invalid/i.test(errorDescription || '');
        setError(isAz
          ? (isExpired
              ? 'Bu bərpa keçidinin vaxtı bitib və ya o, artıq istifadə olunub. Yeni keçid istəyin və e-poçta gələn ən son linki açın.'
              : 'Bərpa keçidi təsdiqlənmədi. Yeni keçid istəyib e-poçtdan yenidən açın.')
          : (isExpired
              ? 'This reset link has expired or was already used. Request a new link and open the latest email.'
              : 'The reset link could not be verified. Request a new link and open it from your email.'));
      }
      setHasSession(Boolean(data.session));
      setReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [isAz, isConfigured]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError(isAz ? 'Şifrə ən azı 8 simvoldan ibarət olmalıdır.' : 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError(isAz ? 'Şifrələr uyğun gəlmir.' : 'Passwords do not match.');
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError(isAz ? 'Auth xidməti ilə əlaqə qurulmadı.' : 'Could not connect to the authentication service.');
      return;
    }

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setComplete(true);
    window.setTimeout(() => router.replace('/login'), 1800);
  }

  return (
    <main className="flex min-h-[100dvh] flex-col bg-[var(--page)] px-4 py-8 text-[var(--ink)] sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <TaloraLogo />
        <div className="mx-auto mt-16 max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900 sm:p-9">
          <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {complete ? <CheckCircle2 className="h-6 w-6" aria-hidden="true" /> : <Lock className="h-6 w-6" aria-hidden="true" />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{complete ? (isAz ? 'Şifrə yeniləndi' : 'Password updated') : (isAz ? 'Yeni şifrə təyin et' : 'Choose a new password')}</h1>
          {!isConfigured ? (
            <Alert variant="destructive" className="mt-4"><AlertDescription>{isAz ? 'Şifrə bərpa xidməti hazırda əlçatan deyil.' : 'Password recovery is currently unavailable.'}</AlertDescription></Alert>
          ) : !ready ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{isAz ? 'Bərpa keçidi yoxlanılır…' : 'Checking reset link…'}</div>
          ) : complete ? (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{isAz ? 'Yeni şifrəniz yadda saxlanıldı. Giriş səhifəsinə yönləndirilirsiniz.' : 'Your new password is saved. Redirecting you to sign in.'}</p>
          ) : !hasSession ? (
            <>
              {error ? (
                <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{isAz ? 'Şifrəni dəyişmək üçün e-poçtunuza göndərilən ən son bərpa keçidini açın.' : 'Open the latest reset link sent to your email to choose a new password.'}</p>
              )}
              <Link href="/forgot-password" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{isAz ? 'Yeni bərpa keçidi istə' : 'Request another reset link'}</Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{isAz ? 'Yeni şifrəniz ən azı 8 simvol olmalıdır.' : 'Your new password must contain at least 8 characters.'}</p>
              <label htmlFor="new-password" className="block text-sm font-semibold">{isAz ? 'Yeni şifrə' : 'New password'}</label>
              <div className="relative">
                <input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-sm text-[var(--ink)] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-600 dark:bg-slate-950" />
                <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? (isAz ? 'Şifrəni gizlət' : 'Hide password') : (isAz ? 'Şifrəni göstər' : 'Show password')} aria-pressed={showPassword} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500 hover:text-blue-600 dark:hover:text-blue-300">
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
              <label htmlFor="confirm-password" className="block text-sm font-semibold">{isAz ? 'Şifrəni təsdiqlə' : 'Confirm password'}</label>
              <div className="relative">
                <input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-sm text-[var(--ink)] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-600 dark:bg-slate-950" />
                <button type="button" onClick={() => setShowConfirmPassword((shown) => !shown)} aria-label={showConfirmPassword ? (isAz ? 'Şifrəni gizlət' : 'Hide password') : (isAz ? 'Şifrəni göstər' : 'Show password')} aria-pressed={showConfirmPassword} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500 hover:text-blue-600 dark:hover:text-blue-300">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <Button type="submit" disabled={busy} className="h-12 w-full bg-blue-600 font-semibold text-white hover:bg-blue-700">{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />{isAz ? 'Yadda saxlanılır…' : 'Saving…'}</> : (isAz ? 'Yeni şifrəni yadda saxla' : 'Save new password')}</Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
