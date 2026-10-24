'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Shield, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    platformName: 'Talora.az',
    supportEmail: 'babayev.omr.23@gmail.com',
    contactPhone: '+994 70 644 92 22',
    certificatePrice: '15 AZN',
  });

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      const supabase = createClient();
      const { data, error: loadError } = await supabase
        .from('platform_settings')
        .select('key, value')
        .limit(4);

      if (!active) return;
      if (loadError) {
        setError(loadError.message);
        return;
      }

      const loaded = Object.fromEntries(
        (data ?? []).map((item: { key: string; value: string }) => [item.key, item.value]),
      );
      setSettings((current) => ({
        platformName: loaded.platform_name && !/^intern\.az$/i.test(loaded.platform_name.trim())
          ? loaded.platform_name
          : current.platformName,
        supportEmail: loaded.support_email ?? current.supportEmail,
        contactPhone: loaded.contact_phone ?? current.contactPhone,
        certificatePrice: loaded.certificate_price ?? current.certificatePrice,
      }));
    };

    void loadSettings();
    return () => { active = false; };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const updates = [
      ['platform_name', settings.platformName],
      ['support_email', settings.supportEmail],
      ['contact_phone', settings.contactPhone],
      ['certificate_price', settings.certificatePrice],
    ];
    const results = await Promise.all(
      updates.map(([key, value]) => supabase.from('platform_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key)),
    );
    const saveError = results.find((result) => result.error)?.error;
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="pb-4 border-b border-slate-800">
        <PageHeading embedded title={<>
          İnzibatçı Parametrləri
        </>} description={<>
          Platforma qlobal parametrləri və əlaqə tənzimləmələri
        </>} />
      </div>

      {saved && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Parametrlər yadda saxlanıldı.</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl">
          Parametrlər yadda saxlanılmadı: {error}
        </div>
      )}

      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-400" />
            Ümumi Platforma Məlumatları
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Saytda və rəsmi sənədlərdə əks olunan ilkin məlumatlar
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label className="text-xs text-slate-300">Platforma Adı</Label>
              <Input
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="mt-1 bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-300">Dəstək E-poçtu</Label>
              <Input
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="mt-1 bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-300">Əlaqə Telefonu</Label>
              <Input
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="mt-1 bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-300">Rəsmi Sertifikat Rüsumu</Label>
              <Input
                value={settings.certificatePrice}
                onChange={(e) => setSettings({ ...settings, certificatePrice: e.target.value })}
                className="mt-1 bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <Button type="submit" disabled={saving} className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold shadow-xs">
              {saving ? 'Yadda saxlanılır...' : 'Yadda saxla'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
