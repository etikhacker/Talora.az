'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TaloraLogo } from '@/components/layout/talora-logo';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const { language } = useLanguage();
  const isAz = language === 'az';
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const result = await requestPasswordReset(email);
    setBusy(false);
    if (result.success) setSent(true);
    else setError(result.error || (isAz ? 'Sorğu göndərilmədi. Yenidən cəhd edin.' : 'Could not send the request. Please try again.'));
  }

  return (
    <main id="main-content" className="flex min-h-[100dvh] flex-col bg-[var(--page)] px-4 py-8 text-[var(--ink)] sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <TaloraLogo />
        <div className="auth-recovery-card mx-auto mt-16 max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900 sm:p-9">
          <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {sent ? <CheckCircle2 className="h-6 w-6" aria-hidden="true" /> : <Mail className="h-6 w-6" aria-hidden="true" />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{isAz ? 'Şifrəni bərpa et' : 'Reset your password'}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {sent
              ? (isAz ? 'Əgər bu ünvana bağlı hesab varsa, şifrəni yeniləmək üçün keçid göndərildi. E-poçt qutunuzu yoxlayın.' : 'If an account is associated with this address, a password reset link is on its way. Check your inbox.')
              : (isAz ? 'Hesabınızda qeydiyyatdan keçdiyiniz e-poçtu yazın. Bərpa keçidini həmin ünvana göndərək.' : 'Enter the email address you used to register and we will send you a reset link.')}
          </p>

          {error && <Alert variant="destructive" className="mt-5"><AlertDescription>{error}</AlertDescription></Alert>}

          {!sent && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label htmlFor="recovery-email" className="block text-sm font-semibold">{isAz ? 'E-poçt ünvanı' : 'Email address'}</label>
              <input
                id="recovery-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="telebe@universitet.edu.az"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              />
              <Button type="submit" disabled={busy} className="h-12 w-full bg-blue-600 font-semibold text-white hover:bg-blue-700">
                {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />{isAz ? 'Göndərilir…' : 'Sending…'}</> : (isAz ? 'Bərpa keçidini göndər' : 'Send reset link')}
              </Button>
            </form>
          )}

          <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />{isAz ? 'Giriş səhifəsinə qayıt' : 'Back to sign in'}
          </Link>
        </div>
      </div>
    </main>
  );
}
