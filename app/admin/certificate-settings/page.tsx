'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { getAllInternships } from '@/lib/internships/service';
import {
  getAllCertificateSettings,
  saveCertificateSettings,
} from '@/lib/certificates/service';
import { Internship, CertificateSettings } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit2,
  Save,
  X,
  Plus,
  Briefcase,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export default function AdminCertificateSettingsPage() {
  const { profile } = useAuth();
  const { t, language } = useLanguage();

  const [internships, setInternships] = useState<Internship[]>([]);
  const [settingsList, setSettingsList] = useState<CertificateSettings[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingInternship, setEditingInternship] = useState<Internship | null>(null);
  const [price, setPrice] = useState<number>(25);
  const [currency, setCurrency] = useState<string>('AZN');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [m10PhoneNumber, setM10PhoneNumber] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      const [allInternships, allSettings] = await Promise.all([
        getAllInternships('all'),
        getAllCertificateSettings(),
      ]);
      setInternships(allInternships);
      setSettingsList(allSettings);
    } catch (err) {
      console.error('Failed to load certificate settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        const [allInternships, allSettings] = await Promise.all([
          getAllInternships('all'),
          getAllCertificateSettings(),
        ]);
        if (isMounted) {
          setInternships(allInternships);
          setSettingsList(allSettings);
        }
      } catch (err) {
        console.error('Failed to load certificate settings:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenEdit = (internship: Internship) => {
    const existing = settingsList.find((s) => s.internship_id === internship.id);
    setEditingInternship(internship);
    if (existing) {
      setPrice(existing.price);
      setCurrency(existing.currency || 'AZN');
      setCardNumber(existing.card_number || '');
      setM10PhoneNumber(existing.m10_phone_number || '');
      setIsEnabled(existing.is_enabled);
    } else {
      setPrice(25);
      setCurrency('AZN');
      setCardNumber('');
      setM10PhoneNumber('');
      setIsEnabled(true);
    }
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInternship) return;

    if (price < 0) {
      setErrorMsg('Qiymət mənfi ola bilməz.');
      return;
    }

    if (isEnabled && !cardNumber.trim() && !m10PhoneNumber.trim()) {
      setErrorMsg('Sertifikat aktiv edildikdə bank kartı və ya M10 nömrəsi daxil edilməlidir.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await saveCertificateSettings({
        internshipId: editingInternship.id,
        price,
        currency,
        cardNumber,
        m10PhoneNumber,
        isEnabled,
      });

      if (res.success && res.settings) {
        setSuccessMsg('Parametrlər uğurla yadda saxlanıldı.');
        await loadData();
        setTimeout(() => {
          setEditingInternship(null);
        }, 1200);
      } else {
        setErrorMsg(res.error || 'Parametrlər saxlanılarkən xəta baş verdi.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xəta baş verdi';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggle = async (internship: Internship, currentSetting?: CertificateSettings) => {
    const newEnabledState = currentSetting ? !currentSetting.is_enabled : true;
    const curPrice = currentSetting ? currentSetting.price : 25;
    const curCurr = currentSetting ? currentSetting.currency : 'AZN';
    const curCard = currentSetting ? currentSetting.card_number : '';
    const curM10Phone = currentSetting?.m10_phone_number || '';

    if (newEnabledState && !curCard.trim() && !curM10Phone.trim()) {
      setEditingInternship(internship);
      setPrice(curPrice);
      setCurrency(curCurr);
      setCardNumber('');
      setM10PhoneNumber('');
      setIsEnabled(true);
      setErrorMsg('Sertifikat ödənişini aktiv etməzdən əvvəl real ödəniş kartı və ya köçürmə məlumatını daxil edin.');
      return;
    }

    try {
      await saveCertificateSettings({
        internshipId: internship.id,
        price: curPrice,
        currency: curCurr,
        cardNumber: curCard,
        m10PhoneNumber: curM10Phone,
        isEnabled: newEnabledState,
      });
      await loadData();
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Sertifikat Parametrləri
            </h1>
            <Badge variant="admin" className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-[10px]">
              Phase 4
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hər bir təcrübə proqramı üçün sertifikat qiyməti, ödəniş kartı və aktivlik statusunu tənzimləyin.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={loadData}
          disabled={loading}
          className="text-xs border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenilə</span>
        </Button>
      </div>

      {/* Main Table / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-xs text-slate-400">Parametrlər yüklənir...</p>
        </div>
      ) : internships.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/60">
          <CardContent className="p-8 text-center text-xs text-slate-400">
            Hələ heç bir təcrübə proqramı mövcud deyil.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {internships.map((internship) => {
            const setting = settingsList.find((s) => s.internship_id === internship.id);
            const isConfigured = !!setting;
            const isEnabled = setting ? setting.is_enabled : false;
            const displayPrice = setting ? `${setting.price} ${setting.currency}` : 'Təyin edilməyib (25 AZN defolt)';
            const displayCard = setting?.card_number || 'Kart təyin edilməyib';
            const displayM10 = setting?.m10_phone_number || 'M10 nömrəsi təyin edilməyib';

            return (
              <Card
                key={internship.id}
                className={`border transition-all ${
                  isEnabled
                    ? 'border-slate-700 bg-slate-900/90 shadow-xs'
                    : 'border-slate-800/80 bg-slate-900/40 opacity-85'
                }`}
              >
                <CardHeader className="pb-3 border-b border-slate-800/60 flex flex-row items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className="text-[9px] border-slate-700 text-slate-400 uppercase tracking-wider"
                      >
                        {internship.category}
                      </Badge>
                      {isEnabled ? (
                        <Badge variant="default" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] py-0 px-1.5">
                          Sertifikat Aktivdir
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-slate-700 text-slate-500">
                          Deaktivdir
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-sm font-bold text-white truncate" title={internship.title}>
                      {internship.title}
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3.5 text-xs">
                  {/* Price & Currency */}
                  <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <span className="text-slate-400 text-[11px] font-medium">Sertifikat Qiyməti:</span>
                    <span className="font-bold text-amber-300 font-mono text-sm">
                      {setting ? `${setting.price} ${setting.currency}` : '25 AZN'}
                    </span>
                  </div>

                  {/* Card Number */}
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                      Ödəniş üçün Bank Kartı:
                    </span>
                    <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs font-semibold text-slate-200 border border-slate-800 flex items-center justify-between">
                      <span className="truncate">{displayCard}</span>
                      <CreditCard className="w-3.5 h-3.5 text-amber-400/80 shrink-0 ml-1.5" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                      M10 ilə ödəniş:
                    </span>
                    <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs font-semibold text-slate-200 border border-slate-800 flex items-center justify-between">
                      <span className="truncate">{displayM10}</span>
                      <span className="shrink-0 ml-1.5 text-emerald-300 font-sans font-bold">m10</span>
                    </div>
                  </div>

                  {/* Quick Controls */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleQuickToggle(internship, setting)}
                      className="h-8 px-2.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      {isEnabled ? (
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <ToggleRight className="w-4 h-4" />
                          <span>Aktiv</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <ToggleLeft className="w-4 h-4" />
                          <span>Deaktiv</span>
                        </span>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleOpenEdit(internship)}
                      className="h-8 px-3 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold gap-1.5 shadow-2xs"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Redaktə et</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Settings Modal */}
      {editingInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xs">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>Sertifikat Parametrləri</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm">
                  {editingInternship.title}
                </p>
              </div>
              <button
                onClick={() => setEditingInternship(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              {/* Active Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Sertifikat verilməsi aktivdir?</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                    Tələbələr təcrübəni bitirdikdən sonra bank kartı və ya M10 ilə ödəniş qəbzi göndərə bilsin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEnabled(!isEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    isEnabled ? 'bg-amber-400 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full shadow-md transition-transform ${
                    isEnabled ? 'bg-slate-950' : 'bg-slate-300'
                  }`} />
                </button>
              </div>

              {/* Price & Currency */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-slate-300 font-semibold block">
                    Sertifikat Qiyməti (AZN/Digər) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-600 text-amber-100 caret-amber-300 font-mono [color-scheme:dark] focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Valyuta</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    maxLength={4}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-600 text-amber-100 caret-amber-300 font-mono text-center [color-scheme:dark] focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 focus:outline-hidden uppercase"
                  />
                </div>
              </div>

              {/* Payment destinations */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Ödəniş üçün Bank Kart Nömrəsi
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4169 7388 9012 3456"
                    required={isEnabled && !m10PhoneNumber.trim()}
                    className="w-full pl-3 pr-10 py-2 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono text-sm tracking-wider focus:border-amber-400 focus:outline-hidden"
                  />
                  <CreditCard className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="certificate-m10-number" className="text-slate-300 font-semibold block">
                  M10 qəbul nömrəsi
                </label>
                <input
                  id="certificate-m10-number"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={20}
                  value={m10PhoneNumber}
                  onChange={(e) => setM10PhoneNumber(e.target.value)}
                  placeholder="+994 50 123 45 67"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-emerald-200 font-mono text-sm tracking-wider focus:border-emerald-400 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500">
                  M10 tətbiqində bu nömrəyə köçürmə qəbul edəcəksiniz. Aktiv ödəniş üçün kart və ya M10 nömrəsindən ən azı biri olmalıdır; qəbz admin tərəfindən əl ilə yoxlanılır.
                </p>
              </div>

              {/* Messages */}
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingInternship(null)}
                  className="text-xs border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  Ləğv et
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold gap-1.5"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saxlanılır...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Yadda saxla</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
