'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-context';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
  normalizeNotificationPreferences,
} from '@/lib/notification-preferences';
import type { NotificationPreferences } from '@/lib/notification-preferences';
import { Bell, Globe, CheckCircle2, AlertCircle } from 'lucide-react';

type Feedback = { type: 'success' | 'error'; message: string } | null;

export default function StudentSettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
  });
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (authLoading) return;

    let isCurrent = true;
    const loadPreferences = async () => {
      if (!user) {
        if (isCurrent) {
          setPreferencesLoading(false);
          setFeedback({ type: 'error', message: t('settingsErrorViewAuth') });
        }
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        if (isCurrent) {
          setPreferencesLoading(false);
          setFeedback({ type: 'error', message: t('settingsErrorNoDb') });
        }
        return;
      }

      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!data.user) {
          if (isCurrent) setFeedback({ type: 'error', message: t('settingsErrorSession') });
          return;
        }

        if (isCurrent) {
          setPreferences(
            normalizeNotificationPreferences(data.user.user_metadata?.notification_preferences)
          );
          setFeedback(null);
        }
      } catch {
        if (isCurrent) {
          setFeedback({ type: 'error', message: t('settingsErrorLoadFailed') });
        }
      } finally {
        if (isCurrent) setPreferencesLoading(false);
      }
    };

    void loadPreferences();
    return () => {
      isCurrent = false;
    };
    // `t` is intentionally excluded: it is recreated on every render, and
    // re-running this effect on language change would refetch preferences.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleSave = async () => {
    const supabase = createClient();
    if (!supabase || !user) {
      setFeedback({ type: 'error', message: t('settingsErrorSaveAuth') });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!data.user) {
        setFeedback({ type: 'error', message: t('settingsErrorSession') });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        data: mergeNotificationPreferences(data.user.user_metadata, preferences),
      });
      if (error) throw error;

      setFeedback({ type: 'success', message: t('settingsSaved') });
    } catch {
      setFeedback({ type: 'error', message: t('settingsErrorSaveGeneric') });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, checked: boolean) => {
    setPreferences((current) => ({ ...current, [key]: checked }));
    setFeedback(null);
  };

  const languageOptions = [
    { code: 'az' as const, label: t('languageAzLabel') },
    { code: 'en' as const, label: t('languageEnLabel') },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header. `border-slate-200` resolves to a 18%-opacity slate on the
          dark theme, so the rule rendered as a barely-visible half-line;
          `border-slate-300` keeps it legible in both themes. `w-full` makes the
          divider span the content column instead of the text block. */}
      <header className="w-full border-b border-slate-300 pb-4">
        <PageHeading embedded title={<>
          {t('settingsTitle')}
        </>} description={<>{t('settingsSubtitle')}</>} />
      </header>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`p-3 border text-xs rounded-xl flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Language */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" />
            {t('interfaceLanguage')}
          </CardTitle>
          <CardDescription className="text-xs">
            {t('interfaceLanguageDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {languageOptions.map((option) => {
              const isActive = language === option.code;
              return (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => setLanguage(option.code)}
                  aria-pressed={isActive}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isActive
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" />
            {t('notificationSettings')}
          </CardTitle>
          <CardDescription className="text-xs">
            {t('notificationSettingsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <label
            htmlFor="new-internship-announcements"
            className={`flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 ${preferencesLoading ? 'opacity-60' : 'cursor-pointer'}`}
          >
            <input
              id="new-internship-announcements"
              type="checkbox"
              checked={preferences.new_internship_announcements}
              onChange={(event) => updatePreference('new_internship_announcements', event.target.checked)}
              disabled={preferencesLoading || saving}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="font-semibold text-slate-800">{t('notifNewInternships')}</p>
              <p className="text-slate-500 text-[11px]">{t('notifNewInternshipsDesc')}</p>
            </div>
          </label>

          <label
            htmlFor="application-status-updates"
            className={`flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 ${preferencesLoading ? 'opacity-60' : 'cursor-pointer'}`}
          >
            <input
              id="application-status-updates"
              type="checkbox"
              checked={preferences.application_status_updates}
              onChange={(event) => updatePreference('application_status_updates', event.target.checked)}
              disabled={preferencesLoading || saving}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="font-semibold text-slate-800">{t('notifApplicationStatus')}</p>
              <p className="text-slate-500 text-[11px]">{t('notifApplicationStatusDesc')}</p>
            </div>
          </label>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={preferencesLoading || saving || authLoading || !user}
            className="mt-2 shadow-xs"
          >
            {saving ? t('settingsSaving') : t('saveBtn')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}