'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TaloraLogo } from '@/components/layout/talora-logo';
import { useLanguage } from '@/lib/i18n/language-context';
import { createClient } from '@/lib/supabase/client';
import type { AuthChangeEvent, AuthError, Session } from '@supabase/supabase-js';
import { ArrowLeft, CheckCircle2, Loader2, Lock } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isAz = language === 'az';
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setReady(true);
      setError(isAz ? 'Şifrə bərpa xidməti hazırda əlçatan deyil.' : 'Password recovery is currently unavailable.');
      return;
    }

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (active && session) setHasSession(true);
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }: { data: { session: Session | null }; error: AuthError | null }) => {
      if (!active) return;
      if (sessionError) setError(isAz ? 'Bərpa keçidi etibarsızdır və ya vaxtı bitib.' : 'This reset link is invalid or has expired.');
      setHasSession(Boolean(data.session));
      setReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [isAz]);

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
          {!ready ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{isAz ? 'Bərpa keçidi yoxlanılır…' : 'Checking reset link…'}</div>
          ) : complete ? (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{isAz ? 'Yeni şifrəniz yadda saxlanıldı. Giriş səhifəsinə yönləndirilirsiniz.' : 'Your new password is saved. Redirecting you to sign in.'}</p>
          ) : !hasSession ? (
            <>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{isAz ? 'Bərpa keçidi etibarsızdır və ya vaxtı bitib. Yenidən e-poçt istəyə bilərsiniz.' : 'This reset link is invalid or expired. You can request another email.'}</p>
              {error && <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>}
              <Link href="/forgot-password" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{isAz ? 'Yeni bərpa keçidi istə' : 'Request another reset link'}</Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{isAz ? 'Yeni şifrəniz ən azı 8 simvol olmalıdır.' : 'Your new password must contain at least 8 characters.'}</p>
              <label htmlFor="new-password" className="block text-sm font-semibold">{isAz ? 'Yeni şifrə' : 'New password'}</label>
              <input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-600 dark:bg-slate-950 dark:text-white" />
              <label htmlFor="confirm-password" className="block text-sm font-semibold">{isAz ? 'Şifrəni təsdiqlə' : 'Confirm password'}</label>
              <input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-600 dark:bg-slate-950 dark:text-white" />
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <Button type="submit" disabled={busy} className="h-12 w-full bg-blue-600 font-semibold text-white hover:bg-blue-700">{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />{isAz ? 'Yadda saxlanılır…' : 'Saving…'}</> : (isAz ? 'Yeni şifrəni yadda saxla' : 'Save new password')}</Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
